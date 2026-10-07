"""Public device identification: candidates are never an MRI authorization."""
import re
import urllib.parse

def validate_term(value):
    value = value.strip()
    if not value or len(value) > 80 or not re.fullmatch(r"[\w ./'()-]+", value):
        raise ValueError('Utilisez uniquement une marque ou une référence technique (80 caractères maximum).')
    if re.search(r'\b(?:patient|naissance|séjour|ne[ée])\b', value, re.I):
        raise ValueError('Retirez les données patient de la recherche.')
    return value

def model_query(maker, model):
    maker, model = validate_term(maker), validate_term(model)
    # Escape query punctuation by a restrictive field value alphabet.
    if any(c in maker + model for c in ':"\\'):
        raise ValueError('Référence technique invalide')
    aliases={'Abbott':['Abbott','St. Jude Medical','St Jude Medical'],'Medtronic':['Medtronic','ATS Medical'],'Sorin':['Sorin','Microport']}
    company=' OR '.join(f'company_name:"{name}"' for name in aliases.get(maker,[maker]))
    return urllib.parse.urlencode({'search': f'({company}) AND (version_or_model_number.exact:"{model}" OR catalog_number.exact:"{model}" OR brand_name.exact:"{model}")', 'limit': 20})

def candidates(payload):
    result = []
    for d in payload.get('results', []):
        ids = d.get('identifiers', [])
        primary = next((x.get('id') for x in ids if x.get('type') == 'Primary'), None)
        result.append({'di': primary, 'company': d.get('company_name'), 'brand': d.get('brand_name'),
                       'model': d.get('version_or_model_number'), 'catalog_number': d.get('catalog_number'),
                       'mri': d.get('mri_safety'), 'source': 'openFDA / GUDID',
                       'source_url': 'https://accessgudid.nlm.nih.gov/devices/' + urllib.parse.quote(primary, safe='') if primary else '',
                       'status': 'candidat à confirmer sur la carte ; conditions IRM non établies'})
    return result
