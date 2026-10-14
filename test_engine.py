import unittest

from engine import compare_conditions, search_catalog


class DocumentaryEngineTests(unittest.TestCase):
    def test_official_agency_guides_are_searchable_without_device_conditions(self):
        for agency, identifier in [("FDA", "fda-mri-labeling"), ("HAS", "has-dmi-mri")]:
            matches = search_catalog(agency)
            self.assertIn(identifier, [item["id"] for item in matches])
            self.assertTrue(all(item["mri_conditions"] is None for item in matches))

    def test_family_search_does_not_identify_a_model(self):
        matches = search_catalog("ATS Bentall")
        self.assertEqual(len(matches), 2)
        self.assertTrue(all(item["mri_conditions"] is None for item in matches))
        self.assertEqual(search_catalog("patient ATS"), [])

    def test_manufacturer_does_not_suggest_unrelated_valves(self):
        self.assertEqual([item["id"] for item in search_catalog("Medtronic A2DR01")], ["medtronic-mri-library"])

    def test_exceeded_sar_blocks_planned_parameters(self):
        result = compare_conditions(
            {"field_t": [1.5, 3], "sar_wkg": 2},
            {"field_t": 1.5, "sar_wkg": 2.5},
        )
        self.assertTrue(result["blocking"])
        self.assertEqual(result["findings"][1]["status"], "dépassé")

    def test_apparently_respected_values_do_not_authorize_mri(self):
        result = compare_conditions({"field_t": [1.5], "sar_wkg": 2},
                                    {"field_t": 1.5, "sar_wkg": 1})
        self.assertFalse(result["blocking"])
        self.assertIn("incomplète", result["overall"])
        self.assertTrue(any(x["status"] == "inconnu" for x in result["findings"]))

    def test_wrong_field_is_detected(self):
        result = compare_conditions({"field_t": [1.5]}, {"field_t": 3})
        self.assertEqual(result["findings"][0]["status"], "dépassé")


if __name__ == "__main__":
    unittest.main()


class ExactNoticeTests(unittest.TestCase):
 def test_model_retrieves_document_but_maker_does_not(self):
  self.assertIn('cochlear-nucleus-emea-2024',[x['id'] for x in search_catalog('Cochlear CI612')])
  self.assertNotIn('cochlear-nucleus-emea-2024',[x['id'] for x in search_catalog('Cochlear')])
  self.assertNotIn('cochlear-nucleus-emea-2024',[x['id'] for x in search_catalog('Cochlear CI6120')])
  self.assertIn('abbott-pacing-2022',[x['id'] for x in search_catalog('Abbott PM2272')])


class FormalConclusionTests(unittest.TestCase):
    def base(self):
        from engine import DOCUMENT_CHECKS, RESTRICTION_CHECKS
        return dict(mr_label='MR_CONDITIONAL', field_t=[1.5], sar_wkg=2,
                    b1_rms_ut=2, spatial_gradient_t_m=20, gradient_slew_t_m_s=200,
                    duration_min=30, references=[dict(manufacturer='Fictif',
                    url='https://manufacturer.example/manual.pdf', document_version='TEST',
                    pages='1-10', models='TEST-1', region='France')],
                    restriction_checks={k: True for k in RESTRICTION_CHECKS},
                    **{k: True for k in DOCUMENT_CHECKS})

    def test_exact_manufacturer_notice_precedes_portal(self):
        results = search_catalog('Cochlear CI612')
        self.assertEqual(results[0]['id'], 'cochlear-nucleus-emea-2024')

    def test_labels_are_documentary_not_clearance(self):
        for label in ('MR_SAFE', 'MR_CONDITIONAL', 'MR_UNSAFE'):
            with self.subTest(label=label):
                result = compare_conditions({**self.base(), 'mr_label': label}, {'field_t':1.5})
                self.assertEqual(result['classification'], label)
                self.assertFalse(result['scan_authorized'])
                self.assertFalse(result['compatibility_established'])
                self.assertTrue(result['decision_blocked'])
                self.assertEqual(result['blocking'], label == 'MR_UNSAFE')

    def test_unverified_document_always_unknown(self):
        from engine import DOCUMENT_CHECKS
        for check in DOCUMENT_CHECKS:
            result = compare_conditions({**self.base(), check: False}, {'field_t':1.5})
            self.assertEqual(result['classification'], 'COMPATIBILITÉ NON ÉTABLIE')
        result = compare_conditions({**self.base(), 'references': []}, {})
        self.assertEqual(result['classification'], 'COMPATIBILITÉ NON ÉTABLIE')

    def test_all_numeric_values_cannot_bypass_document_validation(self):
        exam=dict(field_t=1.5, sar_wkg=1, b1_rms_ut=1, spatial_gradient_t_m=10,
                  gradient_slew_t_m_s=100, duration_min=10)
        result=compare_conditions(self.base(), exam)
        self.assertTrue(all(f['status']=='respecté' for f in result['findings']))
        self.assertIn('Compatibilité non établie', result['conclusion'])
        self.assertFalse(result['compatibility_established'])

    def test_missing_restriction_is_reported(self):
        result=compare_conditions({**self.base(), 'restrictions':[dict(condition='Antennes autorisées',verified=False)]}, {})
        self.assertIn('Antennes autorisées',result['unverified_checks'])
        self.assertTrue(result['adjustments'])

    def test_invalid_numbers_and_fields(self):
        for value in ('nan', 'inf', True, -1):
            with self.assertRaises(ValueError):
                compare_conditions({'field_t':[1.5]}, {'field_t':value})
        for fields in ([None], [''], [True], [0]):
            with self.assertRaises(ValueError):
                compare_conditions({'field_t':fields}, {'field_t':1.5})

    def test_declared_unsafe_blocks_without_documentary_proof(self):
        for label in ('MR_UNSAFE', 'MR Unsafe', ' mr_unsafe '):
            with self.subTest(label=label):
                result = compare_conditions({'mr_label': label}, {'field_t': 1.5})
                self.assertEqual(result['classification'], 'COMPATIBILITÉ NON ÉTABLIE')
                self.assertTrue(result['unsafe_declared'])
                self.assertTrue(result['blocking'])
                self.assertTrue(result['decision_blocked'])
                self.assertFalse(result['scan_authorized'])
                self.assertFalse(result['compatibility_established'])
                self.assertIn('MR Unsafe déclaré', result['conclusion'])
