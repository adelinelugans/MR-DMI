import unittest
from unittest.mock import patch
from app import A
from securirm import search_securirm

class SecuriRMTests(unittest.TestCase):
    def reader(self, path):
        if path.startswith('/block/q?'):
            return {'results': [{'pk': 12, 'fields': {'ref': 'TEST-1', 'compatibility': 3, 'brand': 2, 'cat': 4, 'power': '1.5 T'}}]}
        return {'brands': {'2': 'Fabricant fictif'}, 'categories': {'item-cat-4': 'Catégorie fictive'}}

    def test_secondary_result_never_grants_compatibility(self):
        report = search_securirm('Fabricant fictif', 'TEST-1', self.reader)
        self.assertFalse(report['scan_authorized'])
        self.assertFalse(report['compatibility_established'])
        self.assertTrue(report['results'][0]['exact_reference'])
        self.assertIn('MR Conditional', report['results'][0]['label'])
        self.assertEqual(report['results'][0]['manufacturer'], 'Fabricant fictif')

    def test_other_reference_is_not_exact(self):
        report = search_securirm('Fabricant fictif', 'TEST-10', self.reader)
        self.assertFalse(report['results'][0]['exact_reference'])

    def test_source_unknown_label_is_not_reclassified(self):
        def read(path):
            value=self.reader(path)
            if 'results' in value:value['results'][0]['fields']['compatibility']=99
            return value
        report=search_securirm('Fabricant fictif','TEST-1',read)
        self.assertIn('inconnu',report['results'][0]['label'])

    def test_empty_results_are_not_authorization(self):
        report=search_securirm('Fabricant fictif','TEST-1',lambda _: {'results': []})
        self.assertEqual(report['results'],[])
        self.assertFalse(report['scan_authorized'])

    def test_bad_payload_does_not_become_empty_search(self):
        for payload in ({}, {'results':None}, [], {'results':[{'fields':{}}]}):
            with self.subTest(payload=payload),self.assertRaises(ValueError):
                search_securirm('Fabricant fictif','TEST-1',lambda _:payload)

    def test_endpoint_source_error_is_closed_and_not_cached(self):
        with patch('app.search_securirm',side_effect=OSError('upstream failed')):
            r=A.test_client().get('/api/securirm?maker=Fictif&model=TEST-1')
        self.assertEqual(r.status_code,502)
        self.assertFalse(r.json['scan_authorized'])
        self.assertFalse(r.json['compatibility_established'])
        self.assertEqual(r.headers['Cache-Control'],'no-store')

    def test_invalid_terms_never_reach_source(self):
        with patch('app.search_securirm') as read:
            for query in ('maker=patient&model=TEST-1','maker=&model=TEST-1','maker=Fictif&model=https://evil.test/?secret=1'):
                self.assertEqual(A.test_client().get('/api/securirm?'+query).status_code,400)
            read.assert_not_called()
