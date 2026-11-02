"""Bake retained generated modern art into pixel-sized runtime assets (Pillow authoring only)."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'design/modern';OUT=ROOT/'dist/assets/modern';OUT.mkdir(parents=True,exist_ok=True)
town=json.loads((ROOT/'town-modern.json').read_text());manifest={}
old=json.loads((ROOT/'art-manifest.json').read_text())
for name in ['ground-grass-v2','tree-v3']:manifest[name]=old[name]
def save(name,im,**meta):
 path=OUT/(name+'.png');im.save(path,optimize=True)
 manifest[name]={'url':'assets/modern/'+name+'.png','width':im.width,'height':im.height,**meta}
def pixels(im,size,colors=144):
 im=im.resize(size,Image.Resampling.LANCZOS)
 alpha=im.getchannel('A').point(lambda v:255 if v>=100 else 0) if im.mode=='RGBA' else None
 im=im.convert('RGB').quantize(colors=colors,dither=Image.Dither.NONE).convert('RGBA' if alpha else 'RGB')
 if alpha: im.putalpha(alpha)
 return im
for b in town['buildings']:
 name=b['art'];im=Image.open(SRC/(name+'.png')).convert('RGBA');box=im.getchannel('A').point(lambda v:255 if v>100 else 0).getbbox();im=im.crop(box)
 width=b['w']+40;save(name,pixels(im,(width,round(im.height*width/im.width))))
 atlas=Image.open(SRC/('interiors-modern-'+b['id']+'-doors.png')).convert('RGB');cw=atlas.width//2;ch=atlas.height//2
 for i,r in enumerate(b['rooms']):
  x=i%2*cw;y=i//2*ch
  panel=atlas.crop((x,y,x+cw,y+ch))
  clear=SRC/('interiors-modern-'+b['id']+'-clear.png')
  if i==0 and clear.exists():
   fixed=Image.open(clear).convert('RGB');panel=fixed.crop((0,0,fixed.width//2,fixed.height//2))
  save(r['art'],pixels(panel,(384,256),192))
for kind in ['player','civilian-a','civilian-b','police']:
 name='character-modern-'+kind;source=SRC/(name+'-walk.png')
 if not source.exists():source=SRC/(name+'.png')
 im=Image.open(source).convert('RGBA');frames=[]
 for y in range(4):
  for x in range(4):
   cell=im.crop((round(x*im.width/4),round(y*im.height/4),round((x+1)*im.width/4),round((y+1)*im.height/4)))
   box=cell.getchannel('A').point(lambda v:255 if v>100 else 0).getbbox();frames.append(cell.crop(box))
 scale=28/max(f.height for f in frames);sheet=Image.new('RGBA',(128,128))
 for i,f in enumerate(frames):
  f=pixels(f,(max(1,round(f.width*scale)),max(1,round(f.height*scale))),64)
  sheet.alpha_composite(f,(i%4*32+(32-f.width)//2,i//4*32+31-f.height))
 save(name,sheet,frameWidth=32,frameHeight=32,columns=4,rows=['south','west','east','north'])
save('ground-modern-asphalt',pixels(Image.open(SRC/'ground-modern-asphalt.png').convert('RGB'),(96,96),48))
(ROOT/'art-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Baked',len(manifest),'modern runtime assets.')
