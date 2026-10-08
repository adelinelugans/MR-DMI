"""Check the WSGI target and assets needed by the mobile OCR page."""
import unittest
from unittest.mock import patch
from pathlib import Path
from gunicorn.util import import_app
from app import A


class DeploymentTests(unittest.TestCase):
    def test_health_exposes_only_status_and_revision(self):
        with patch.dict('os.environ', {'RENDER_GIT_COMMIT': 'test-revision'}):
            with A.test_client() as client:
                response = client.get('/healthz')
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json, {'ok': True, 'revision': 'test-revision'})

    def test_both_wsgi_targets_use_the_same_application(self):
        self.assertIs(import_app('app:app'), A)
        self.assertIs(import_app('app:A'), A)

    def test_mobile_resources_are_served(self):
        with A.test_client() as client:
            for path in ('/', '/identification.js', '/sw.js',
                         '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'):
                with self.subTest(path=path):
                    response = client.get(path)
                    self.assertEqual(response.status_code, 200)
                    self.assertTrue(response.data)
                    response.close()
            response = client.get('/')
            self.assertEqual(response.data, Path('index.html').read_bytes())
            response.close()


if __name__ == '__main__':
    unittest.main()
