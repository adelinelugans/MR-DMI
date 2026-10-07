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

