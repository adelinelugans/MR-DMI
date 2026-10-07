"""Documentary candidate search and conservative MR condition comparison.

No endpoint in this module declares an implant or an examination MR compatible.
"""
import json
import re
from pathlib import Path

CATALOG = json.loads((Path(__file__).with_name("catalog.json")).read_text(encoding="utf-8"))


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
    return sorted(results, key=lambda x: -x["score"])


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
    if not 0 <= number < 100000:
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

    return {
        "findings": findings,
        "blocking": any(x["status"] == "dépassé" for x in findings),
        "overall": "Dépassement identifié — ne pas réaliser selon ces paramètres" if any(x["status"] == "dépassé" for x in findings) else "Évaluation incomplète — validation humaine requise",
        "missing_checks": ["Référence exacte de chaque implant et notice applicable", "Antennes et zone d'examen", "Positionnement et délai après implantation", "Mode, programmation et surveillance du dispositif", "Conditions additionnelles et protocole local"],
    }

