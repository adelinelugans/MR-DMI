"""Documentary candidate search and conservative MR condition comparison.

No endpoint in this module declares an implant or an examination MR compatible.
"""
import json
import math
from urllib.parse import urlsplit
import re
from pathlib import Path

CATALOG = json.loads((Path(__file__).with_name("catalog.json")).read_text(encoding="utf-8"))


def _source_priority(item):
    kind = item.get("source_type", "").casefold()
    if kind == "notice fabricant référencée": return 0
    if "recherche fabricant" in kind: return 1
    if "portail fabricant" in kind: return 2
    if "page fabricant" in kind: return 3
    if kind == "guide officiel": return 5
    return 4


def search_catalog(query):
    # Only short device terms belong here, never a full patient document.
    query = query.strip()[:100]
    if not query or re.search(r"\b(?:patient|naissance|s[eé]jour)\b", query, re.I):
        return []
    terms = [t.casefold() for t in re.findall(r"[\w-]{3,}", query)]
    results = []
    for item in CATALOG:
        haystack = " ".join([item["name"], *item["aliases"]]).casefold()
        matches = [t for t in terms if t in haystack]
        if item.get("exact_models") and not any(model.casefold() in terms for model in item["exact_models"]):
            continue
        # A manufacturer alone must not suggest every unrelated implant family.
        maker_terms = set(re.findall(r"[\w-]{3,}", item.get("manufacturer", "").split("(")[0].casefold()))
        if item.get("required_terms") and not any(t in terms for t in item["required_terms"]):
            continue
        specific_matches = [term for term in matches if term not in maker_terms]
        is_portal = item.get("source_type", "").startswith("portail fabricant") or item["id"] == "boston-imageready-model-lookup"
        is_official_guide = item.get("source_type") == "guide officiel"
        if matches and (specific_matches or is_portal or is_official_guide):
            results.append({**item, "matched_terms": matches, "score": len(matches)})
    return sorted(results, key=lambda x: (_source_priority(x), -x["score"], x["name"]))


NUMERIC_LIMITS = {
    "sar_wkg": "SAR corps entier (W/kg)",
    "b1_rms_ut": "B1+rms (µT)",
    "spatial_gradient_t_m": "Gradient spatial B0 (T/m)",
    "gradient_slew_t_m_s": "Vitesse de commutation des gradients (T/m/s)",
    "duration_min": "Durée de balayage (min)",
}


def _number(value):
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise ValueError("Valeur numérique invalide")
    number = float(value)
    if not math.isfinite(number) or not 0 <= number < 100000:
        raise ValueError("Valeur hors limites")
    return number


def compare_conditions(conditions, exam):
    """Return per-criterion findings; never an overall authorization."""
    if not isinstance(conditions, dict) or not isinstance(exam, dict):
        raise ValueError("Conditions et examen requis")
    findings = []
    allowed = conditions.get("field_t")
    actual = _number(exam.get("field_t"))
    if isinstance(allowed, list) and allowed and actual is not None:
        permitted = [_number(v) for v in allowed]
        if any(v is None or v <= 0 for v in permitted):
            raise ValueError("Champ fabricant invalide")
        status = "respecté" if any(abs(actual - v) < 0.01 for v in permitted) else "dépassé"
        detail = f"{actual:g} T ; champs cités par la notice : {', '.join(f'{v:g}' for v in permitted)} T"
    else:
        status, detail = "inconnu", "Champ de la notice ou champ de la machine manquant"
    findings.append({"criterion": "Champ statique", "status": status, "detail": detail})

    for key, label in NUMERIC_LIMITS.items():
        limit, measured = _number(conditions.get(key)), _number(exam.get(key))
        if limit is None or measured is None:
            status, detail = "inconnu", "Limite de la notice ou paramètre de l'examen manquant"
        else:
            status = "respecté" if measured <= limit else "dépassé"
            detail = f"Prévu : {measured:g} ; limite documentée : {limit:g}"
        findings.append({"criterion": label, "status": status, "detail": detail})

    report = formal_report(conditions, exam, findings)
    return {
        **report,
        "findings": findings,
        "blocking": report["classification"] == "MR_UNSAFE" or any(x["status"] == "dépassé" for x in findings),
        "overall": report["conclusion"],
        "missing_checks": ["Référence exacte de chaque implant et notice applicable", "Antennes et zone d'examen", "Positionnement et délai après implantation", "Mode, programmation et surveillance du dispositif", "Conditions additionnelles et protocole local"],
    }



# These checks describe evidence supplied by staff, not a verified server-side notice.
DOCUMENT_CHECKS = (
    "manufacturer_verified", "system_complete", "region_verified",
    "version_verified", "conditions_complete",
)
RESTRICTION_CHECKS = (
    "coils_zone", "position", "implant_delay", "programming_monitoring",
    "components_exclusions", "additional_conditions",
)


def formal_report(conditions, exam, findings):
    label = str(conditions.get("mr_label", "")).upper().replace(" ", "_")
    references = conditions.get("references", [])
    if not isinstance(references, list) or any(not isinstance(r, dict) for r in references):
        raise ValueError("Références documentaires invalides")
    def reference_present(r):
        url = urlsplit(str(r.get("url", "")))
        return (url.scheme == "https" and bool(url.hostname) and not url.username
                and all(isinstance(r.get(k), str) and r[k].strip()
                        for k in ("manufacturer", "document_version", "pages", "models", "region")))
    evidence = bool(references) and all(reference_present(r) for r in references)
    evidence = evidence and all(conditions.get(k) is True for k in DOCUMENT_CHECKS)
    classification = label if evidence and label in {"MR_SAFE", "MR_CONDITIONAL", "MR_UNSAFE"} else "COMPATIBILITÉ NON ÉTABLIE"
    restrictions = conditions.get("restrictions", [])
    if not isinstance(restrictions, list) or any(not isinstance(r, dict) or not isinstance(r.get("condition"), str) or not r["condition"].strip() for r in restrictions):
        raise ValueError("Restrictions invalides")
    checks = conditions.get("restriction_checks", {})
    if not isinstance(checks, dict): raise ValueError("Contrôles invalides")
    missing = [k for k in DOCUMENT_CHECKS if conditions.get(k) is not True]
    if not evidence: missing.append("Notice fabricant exacte, modèle, pages, version et pays non entièrement vérifiés")
    missing += [k for k in RESTRICTION_CHECKS if checks.get(k) is not True]
    missing += [r["condition"] for r in restrictions if r.get("verified") is not True]
    # Numeric omissions cannot silently become 'not applicable'. The legacy comparison
    # deliberately remains incomplete until an applicable, complete notice is integrated.
    failures = [f for f in findings if f["status"] == "dépassé"]
    unknown = [f["criterion"] for f in findings if f["status"] == "inconnu"]
    missing += unknown
    if classification == "MR_UNSAFE":
        conclusion = "MR Unsafe — ne pas réaliser l’IRM avec ce dispositif selon cette notice"
    elif failures:
        conclusion = "Compatibilité non établie — conditions non respectées ; ne pas réaliser avec ces paramètres"
    else:
        conclusion = "Compatibilité non établie — évaluation incomplète ; validation documentaire et clinique requise"
    return {
        "classification": classification,
        "classification_basis": "Déclaration documentaire utilisateur ; authenticité et exhaustivité non vérifiées automatiquement",
        "conclusion": conclusion,
        "compatibility_established": False,
        "decision_blocked": True,
        "scan_authorized": False,
        "references": references,
        "manufacturer_conditions": conditions,
        "restrictions": restrictions,
        "unverified_checks": list(dict.fromkeys(missing)),
        "adjustments": [dict(criterion=f["criterion"], action=(
            "Vérifier dans la notice exacte et à la console : " + f["detail"]
            if f["status"] == "inconnu" else
            "Adapter uniquement dans les limites fabricant, puis refaire la comparaison : " + f["detail"]
        )) for f in findings if f["status"] != "respecté"],
    }
