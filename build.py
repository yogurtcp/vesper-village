"""Build the dependency-free playable app and its versioned offline cache."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
FILES = ['engine.js', 'renderer.js', 'game.js', 'boot.js']
parts = [(ROOT / p).read_bytes() for p in FILES + ['index.template.html', 'sw.template.js']]
parts += [(DIST / p).read_bytes() for p in ['style.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']]
version = hashlib.sha256(b''.join(parts)).hexdigest()[:16]
DIST.mkdir(exist_ok=True)
for name in FILES:
    (DIST / name).write_bytes((ROOT / name).read_bytes())
(DIST / 'index.html').write_text((ROOT / 'index.template.html').read_text().replace('__BUILD__', version))
(DIST / 'sw.js').write_text((ROOT / 'sw.template.js').read_text().replace('__BUILD__', version))
(DIST / 'version.json').write_text(json.dumps({'build': version}))
print('Vesper build:', version)
