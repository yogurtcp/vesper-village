"""Normalize the original generated sources into small, palette-limited runtime pixel art."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parent
manifest={}
for src in sorted((ROOT/'design/generated').glob('*.png')):
    name=src.stem
    im=Image.open(src).convert('RGBA')
    if name.startswith('ground-'):
        im=im.resize((96,96),Image.Resampling.LANCZOS).convert('RGB').quantize(colors=96,dither=Image.Dither.NONE).convert('RGB')
    elif name.startswith('room-'):
        im=im.resize((384,256),Image.Resampling.LANCZOS).convert('RGB').quantize(colors=144,dither=Image.Dither.NONE).convert('RGB')
    else:
        alpha=im.getchannel('A')
        box=alpha.point(lambda v:255 if v>64 else 0).getbbox()
        if box: im=im.crop(box)
        width=304 if name=='market-v2' else 256 if name=='school-v2' else 128 if name.startswith('fountain-') else 96 if name.startswith('tree-') else 208
        im=im.resize((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS)
        alpha=im.getchannel('A').point(lambda v:round(v/85)*85)
        im=im.convert('RGB').quantize(colors=128,dither=Image.Dither.NONE).convert('RGBA')
        im.putalpha(alpha)
    path=ROOT/'dist/assets'/f'{name}.png'
    im.save(path,optimize=True)
    manifest[name]={'url':f'assets/{name}.png','width':im.width,'height':im.height}
(ROOT/'art-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Baked {len(manifest)} generated assets.')
