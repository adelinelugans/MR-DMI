"""Read a small public SecuriRM search, without mirroring its database.

Public website endpoints are not a documented/stable API. Any unavailable or
unexpected response remains an error, never an MRI compatibility conclusion.
"""
import datetime
import json
import urllib.parse
import urllib.request
from identification import validate_term

ORIGIN = 'https://securirm.com'
LABELS = {1: 'MR Safe (pictogramme SecuriRM)',
          2: 'MR Unsafe (pictogramme SecuriRM)',
          3: 'MR Conditional (pictogramme SecuriRM)'}


def read_public(path):
    request = urllib.request.Request(ORIGIN + path, headers={
        'User-Agent': 'MR-DMI/1 (on-demand public device reference lookup)',
        'Accept': 'application/json'})
    with urllib.request.urlopen(request, timeout=7) as response:
        if urllib.parse.urlsplit(response.url).hostname != 'securirm.com':
            raise ValueError('Unexpected SecuriRM redirect')
        raw = response.read(1_000_001)
        if len(raw) > 1_000_000:
            raise ValueError('SecuriRM response too large')
        return json.loads(raw)


def search_securirm(maker, model, reader=read_public):
    maker, model = validate_term(maker), validate_term(model)
    # Never transmit documents, serial numbers, or a patient dossier.
    params = urllib.parse.urlencode([('terms[]', maker), ('terms[]', model), ('status', '0')])
    payload = reader('/block/q?' + params)
    if not isinstance(payload, dict) or not isinstance(payload.get('results'), list):
        raise ValueError('SecuriRM search unavailable or malformed')
    raw_results = payload['results']
    metadata = reader('/block/q-suggestions') if raw_results else {'brands': {}, 'categories': {}}
    if not isinstance(metadata, dict) or not isinstance(metadata.get('brands'), dict) or not isinstance(metadata.get('categories'), dict):
        raise ValueError('SecuriRM metadata unavailable')
    results = []
    for row in raw_results[:20]:
        if not isinstance(row, dict) or not isinstance(row.get('fields'), dict):
            raise ValueError('Invalid SecuriRM row')
        fields = row['fields']
        ref = fields.get('ref')
        if not isinstance(ref, str) or not ref.strip():
            raise ValueError('Missing SecuriRM reference')
        label = LABELS.get(fields.get('compatibility'), 'Classement inconnu ; consulter SecuriRM')
        results.append({
            'reference': ref[:200], 'exact_reference': ref.strip().casefold() == model.casefold(),
            'manufacturer': str(metadata['brands'].get(str(fields.get('brand')), 'Fabricant à confirmer'))[:200],
            'category': str(metadata['categories'].get('item-cat-' + str(fields.get('cat')), 'Catégorie à confirmer'))[:200],
            'field': str(fields.get('power') or '')[:100], 'label': label,
            'source': 'SecuriRM', 'source_url': ORIGIN + '/',
        })
    return {'ok': True, 'source': 'SecuriRM', 'results': results,
            'truncated': len(raw_results) >= 20,
            'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'compatibility_established': False, 'scan_authorized': False,
            'notice': 'Source complémentaire ; référence, système et notice fabricant à vérifier.'}
