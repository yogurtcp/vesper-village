"""Build the dependency-free playable app and its versioned offline cache."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
FILES = ['engine.js', 'renderer.js', 'game.js', 'boot.js']
art = json.loads((ROOT / 'art-manifest.json').read_text())
parts = [(ROOT / p).read_bytes() for p in FILES + ['index.template.html', 'sw.template.js', 'town-modern.json']]
parts += [(DIST / p).read_bytes() for p in ['style.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']]
parts += [(ROOT / 'art-manifest.json').read_bytes()]
parts += [(DIST / entry['url']).read_bytes() for entry in art.values()]
version = hashlib.sha256(b''.join(parts)).hexdigest()[:16]
DIST.mkdir(exist_ok=True)
for name in FILES+['town-modern.json']:
    (DIST / name).write_bytes((ROOT / name).read_bytes())
(DIST / 'index.html').write_text((ROOT / 'index.template.html').read_text().replace('__BUILD__', version).replace('__ART__', json.dumps(art)).replace('__TOWN__', (ROOT/'town-modern.json').read_text()))
art_files = json.dumps(['./' + entry['url'] + '?v=' + version for entry in art.values()])
(DIST / 'sw.js').write_text((ROOT / 'sw.template.js').read_text().replace('__BUILD__', version).replace('__ART_FILES__', art_files))
(DIST / 'version.json').write_text(json.dumps({'build': version}))
print('Vesper build:', version)
