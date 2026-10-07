import unittest
from unittest.mock import patch
from app import A

class ApiInputTests(unittest.TestCase):
 def setUp(self):self.client=A.test_client()
 def test_rejects_non_di_before_database_or_network(self):
  with patch('app.get') as upstream,patch('app.con') as database:
   for value in ('','EEL414832','123','patient Martin','123456789012345'):
    self.assertEqual(self.client.get('/api/device',query_string={'q':value}).status_code,400)
   upstream.assert_not_called();database.assert_not_called()
 def test_comparison_requires_object(self):
  self.assertEqual(self.client.post('/api/compare',json=['invalid']).status_code,400)

if __name__=='__main__':unittest.main()
