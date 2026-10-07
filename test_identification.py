import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from app import A
from identification import candidates, model_query

class IdentificationTests(unittest.TestCase):
    def setUp(self): self.client=A.test_client()
    def test_required_fields_and_patient_text_rejected(self):
        for maker,model in [('Medtronic',''),('patient Dupont','A2'),('Medtronic','A2" OR *')]:
            self.assertEqual(self.client.get('/api/search',query_string={'maker':maker,'model':model}).status_code,400)
    def test_model_is_exact_and_candidates_are_not_conditions(self):
        query=model_query('Medtronic','A2DR01')
        self.assertIn('version_or_model_number.exact',query)
        sample={'results':[{'company_name':'Medtronic','version_or_model_number':'A2DR01','mri_safety':'MR Conditional','identifiers':[{'type':'Secondary','id':'wrong'},{'type':'Primary','id':'123'}]}]}
        with patch('app.get',return_value=sample) as fetch:
            response=self.client.get('/api/search?maker=Medtronic&model=A2DR01')
        self.assertEqual(response.status_code,200)
        device=response.json['candidates'][0]
        self.assertEqual(device['di'],'123')
        self.assertNotIn('mri_conditions',device)
        self.assertIn('candidat',device['status'])
    def test_not_found_is_distinct_from_outage(self):
        for code,expected in [(404,200),(429,502),(500,502)]:
            with patch('app.get',side_effect=HTTPError('url',code,'failure',{},None)):
                response=self.client.get('/api/search?maker=Medtronic&model=A2DR01')
            self.assertEqual(response.status_code,expected)
    def test_missing_primary_does_not_select_secondary(self):
        self.assertIsNone(candidates({'results':[{'identifiers':[{'type':'Secondary','id':'x'}]}]})[0]['di'])
    def test_js_is_served(self):
        with self.client.get('/identification.js') as response:
            self.assertEqual(response.status_code,200)

if __name__=='__main__': unittest.main()
