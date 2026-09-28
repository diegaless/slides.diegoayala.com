"""El servidor de vista previa no expone las soluciones de .private."""
import importlib.util
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from functools import partial
from pathlib import Path
from http.server import ThreadingHTTPServer

spec=importlib.util.spec_from_file_location('preview',Path(__file__).parents[1]/'scripts/preview.py')
preview=importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)

class PreviewSecurity(unittest.TestCase):
    def test_private_files_are_not_served(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'index.html').write_text('Publico')
            (root/'.private').mkdir()
            (root/'.private/solucion.pdf').write_bytes(b'Privado')
            (root/'enlace.pdf').symlink_to(root/'.private/solucion.pdf')
            (root/'assets').mkdir()
            server=ThreadingHTTPServer(('127.0.0.1',0),partial(preview.PreviewHandler,directory=folder))
            thread=threading.Thread(target=server.serve_forever,daemon=True)
            thread.start()
            base=f'http://127.0.0.1:{server.server_port}'
            try:
                with urllib.request.urlopen(base+'/') as response:
                    self.assertEqual(response.read(),b'Publico')
                    self.assertEqual(response.headers['Cache-Control'],'no-store')
                for path in ['/.private/solucion.pdf','/%2eprivate/solucion.pdf','/assets/../.private/solucion.pdf','/enlace.pdf','/.git/config','/node_modules/','/assets/']:
                    with self.subTest(path=path), self.assertRaises(urllib.error.HTTPError) as caught:
                        urllib.request.urlopen(base+path)
                    self.assertEqual(caught.exception.code,403)
            finally:
                server.shutdown(); server.server_close(); thread.join()

if __name__=='__main__': unittest.main()
