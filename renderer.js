/* Original small-scale canvas pixel art. All sprites are drawn at native pixel size. */
(function(root){'use strict';
const{WIDTH,HEIGHT,TILE,dist,clamp}=root.VesperEngine;
const coats=['#858b71','#bd7f67','#698a91','#9a7794','#b39b69','#657d9c','#8a697a','#6f927d','#ab8b79','#a19b88'];
const skins=['#d9ad8a','#bf8d70','#a7715b','#e9c3a1','#8c5e51'];
const dark='#35313b',ink='#41404a';
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function hash(x,y){let k=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);k=Math.imul(k^(k>>>13),1274126177);return(k^(k>>>16))>>>0;}
class Renderer{
 constructor(canvas,world){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.world=world;this.cam={x:world.p.x,y:world.p.y};this.zoom=1.5;this.roofAlpha={};this.ground=this.makeGround();this.trees=this.makeTrees();this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.min(1000,Math.max(320,Math.round(r.width/2)));this.canvas.height=Math.max(240,Math.round(this.canvas.width*r.height/r.width));this.zoom=r.width<700?1:.75;this.world.localRadius=Math.max(410,Math.hypot(this.canvas.width,this.canvas.height)/(2*this.zoom)+65);this.ctx.imageSmoothingEnabled=false;}
 makeTrees(){const out=[];for(let i=0;i<100;i++){const x=20+hash(i,3)%(WIDTH-40),y=25+hash(i,8)%(HEIGHT-50);if(this.world.buildings.some(b=>x>b.x-26&&x<b.x+b.w+26&&y>b.y-26&&y<b.y+b.h+24))continue;const road=this.roadAt(x,y);if(!road&&this.world.walkable(x,y))out.push({x,y,kind:'tree',variant:i%3});}return out;}
 roadAt(x,y){return[365,735,1100].some(a=>Math.abs(y-a)<32)||[385,753,1121].some(a=>Math.abs(x-a)<30);}
 makeGround(){const cv=document.createElement('canvas');cv.width=WIDTH;cv.height=HEIGHT;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;rect(c,0,0,WIDTH,HEIGHT,'#82917a');for(let y=0;y<HEIGHT;y+=8)for(let x=0;x<WIDTH;x+=8){const r=hash(x,y);if(r%7===0)rect(c,x+r%5,y+(r>>>4)%5,2,1,r%2?'#99a185':'#71846f');if(r%103===0){rect(c,x,y,1,2,'#d5ba87');rect(c,x-1,y+1,3,1,'#caa78c');}}
  for(const y of [365,735,1100]){rect(c,0,y-36,WIDTH,72,'#a49e8c');rect(c,0,y-29,WIDTH,58,'#b8ad98');for(let yy=y-26;yy<y+27;yy+=9)for(let x=0;x<WIDTH;x+=18){const offset=yy%2?8:0;rect(c,x+offset,yy,15,7,hash(x,yy)%3?'#b5aa97':'#c3b7a1');rect(c,x+offset,yy+7,15,1,'#a79d8e');}}
  for(const x of [385,753,1121]){rect(c,x-33,0,66,HEIGHT,'#a49e8c');rect(c,x-26,0,52,HEIGHT,'#b8ad98');for(let y=0;y<HEIGHT;y+=10)for(let xx=x-23;xx<x+24;xx+=15)rect(c,xx+(y%20?3:0),y,12,8,hash(xx,y)%3?'#b5aa97':'#c3b7a1');}
  for(const b of this.world.buildings){rect(c,b.x-8,b.y-5,b.w+16,b.h+15,'#74806e');rect(c,b.door.x-16,b.y+b.h,32,Math.max(12,365+Math.floor(b.ty/23)*370-(b.y+b.h)),'#b4a590');for(let x=b.x+12;x<b.x+b.w-10;x+=25){if(Math.abs(x-b.door.x)<28)continue;rect(c,x,b.y+b.h+3,17,7,'#586b59');rect(c,x+2,b.y+b.h+1,2,3,'#d1b4a0');rect(c,x+10,b.y+b.h,2,4,'#b9a0aa');}}
  // Small, fixed details keep the village grounded without per-frame texture work.
  for(const [x,y]of[[430,414],[795,782],[1170,410],[40,715],[1470,780],[45,1100]]){rect(c,x-15,y,30,6,'#655c58');rect(c,x-13,y-4,26,4,'#b08d6b');rect(c,x-12,y+6,3,5,'#49494a');rect(c,x+9,y+6,3,5,'#49494a');}
  return cv;
 }
 screenToWorld(x,y){return{x:(x-this.canvas.width/2)/this.zoom+this.cam.x,y:(y-this.canvas.height/2)/this.zoom+this.cam.y};}
 visible(x,y,pad=70){return Math.abs(x-this.cam.x)<this.canvas.width/this.zoom/2+pad&&Math.abs(y-this.cam.y)<this.canvas.height/this.zoom/2+pad;}
 draw(dt){const c=this.ctx,w=this.world,p=w.p,W=this.canvas.width,H=this.canvas.height;const halfW=W/(2*this.zoom),halfH=H/(2*this.zoom);this.cam.x+=(clamp(p.x,halfW,WIDTH-halfW)-this.cam.x)*Math.min(1,dt*9);this.cam.y+=(clamp(p.y-12,halfH,HEIGHT-halfH)-this.cam.y)*Math.min(1,dt*9);c.imageSmoothingEnabled=false;c.setTransform(1,0,0,1,0,0);rect(c,0,0,W,H,'#72816e');c.save();c.translate(Math.round(W/2-this.cam.x*this.zoom),Math.round(H/2-this.cam.y*this.zoom));c.scale(this.zoom,this.zoom);c.drawImage(this.ground,0,0);
  for(const b of w.buildings)if(this.visible(b.x+b.w/2,b.y+b.h/2,180))this.interior(c,b);
  const things=[];for(const b of w.buildings)if(this.visible(b.x+b.w/2,b.y+b.h/2,190))things.push({kind:'building',y:b.y+b.h,b});
  for(const t of this.trees)if(this.visible(t.x,t.y))things.push(t);for(const lamp of w.lamps())if(this.visible(lamp.x,lamp.y))things.push({...lamp,kind:'lamp'});
  for(const n of [p,...w.npcs]){if(!this.visible(n.x,n.y))continue;const inside=w.buildingAt(n.x,n.y);if(n!==p&&inside&&inside.id!==p.location)continue;things.push({kind:'person',x:n.x,y:n.y,n});}
  things.sort((a,b)=>a.y-b.y);for(const item of things){if(item.kind==='building'){const b=item.b,inside=p.location===b.id;const alpha=this.roofAlpha[b.id]??(inside?0:1);this.roofAlpha[b.id]=alpha+((inside?0:1)-alpha)*Math.min(1,dt*12);if(this.roofAlpha[b.id]>.01){c.save();c.globalAlpha=this.roofAlpha[b.id];this.exterior(c,b);c.restore();}}else if(item.kind==='person')this.person(c,item.n);else if(item.kind==='lamp')this.lamp(c,item);else this.tree(c,item);}
  for(const shot of w.bullets){c.strokeStyle='#ffe1a2';c.lineWidth=1;c.beginPath();c.moveTo(shot.x,shot.y);c.lineTo(shot.tx,shot.ty);c.stroke();}
  for(const e of w.effects){if(e.kind==='turn'){const t=1-(e.until-w.elapsed)/2;c.strokeStyle='#e4a1b3';c.lineWidth=1;c.beginPath();c.ellipse(e.x,e.y,5+t*13,2+t*4,0,0,Math.PI*2);c.stroke();}}
  c.restore();const night=this.nightAmount();if(night>0){rect(c,0,0,W,H,`rgba(24,29,62,${night*.51})`);for(const l of w.lamps())this.glow(l.x,l.y-22,80,night*.16);for(const b of w.buildings)if(this.visible(b.x+b.w/2,b.y+b.h,180)){for(const xx of [b.x+38,b.x+b.w-43])this.glow(xx,b.y+b.h-27,45,night*.12);}}
  c.save();c.translate(Math.round(W/2-this.cam.x*this.zoom),Math.round(H/2-this.cam.y*this.zoom));c.scale(this.zoom,this.zoom);
  for(const n of [p,...w.npcs]){if(!n.alive||!this.visible(n.x,n.y))continue;const b=w.buildingAt(n.x,n.y);if(n!==p&&b&&b.id!==p.location)continue;this.overhead(c,n);}
  c.restore();if(p.hp<100&&p.alive){c.fillStyle=`rgba(142,43,67,${(100-p.hp)/220})`;c.fillRect(0,0,W,3);c.fillRect(0,H-3,W,3);}
 }
 nightAmount(){const h=this.world.hour;if(h>=8&&h<18)return 0;if(h>=18&&h<20)return(h-18)/2;if(h>=6&&h<8)return(8-h)/2;return 1;}
 glow(x,y,r,alpha){const c=this.ctx,X=(x-this.cam.x)*this.zoom+this.canvas.width/2,Y=(y-this.cam.y)*this.zoom+this.canvas.height/2,R=r*this.zoom;if(X<-R||Y<-R||X>this.canvas.width+R||Y>this.canvas.height+R)return;const g=c.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,`rgba(255,205,129,${alpha})`);g.addColorStop(.35,`rgba(255,192,117,${alpha*.45})`);g.addColorStop(1,'rgba(255,185,113,0)');c.fillStyle=g;c.fillRect(X-R,Y-R,R*2,R*2);}
 interior(c,b){const w=this.world;rect(c,b.x,b.y,b.w,b.h,'#514d54');b.roomRects.forEach((r,i)=>{const palettes=[['#b49b7d','#aa9277'],['#a6a38e','#999c86'],['#a39386','#998879'],['#a69c90','#9c9188']][i];for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)rect(c,x*TILE,y*TILE,TILE,TILE,palettes[(x+y)%2]);if(b.id==='school'&&i===0){rect(c,(r.x+1)*TILE,(r.y+.25)*TILE,62,6,'#526b60');}if(b.id==='froyo'&&i===0){rect(c,(r.x+1)*TILE,(r.y+.2)*TILE,50,5,'#b07c98');}if(b.id==='guards'&&i===1){rect(c,(r.x+1)*TILE,(r.y+.2)*TILE,45,6,'#c6b797');}
   if(this.world.p.location===b.id){c.font='5px monospace';c.fillStyle='#554e51';c.textAlign='center';c.fillText(b.rooms[i].toUpperCase(),(r.x+r.w/2)*TILE,(r.y+r.h-.4)*TILE);}});
  for(let y=b.ty;y<b.ty+16;y++)for(let x=b.tx;x<b.tx+17;x++)if(w.solid[y*96+x]&&(x===b.tx||x===b.tx+16||y===b.ty||y===b.ty+15||x===b.tx+9||y===b.ty+8)){rect(c,x*TILE,y*TILE,TILE,TILE,'#67616a');rect(c,x*TILE,y*TILE,TILE,3,'#d4c1a7');rect(c,x*TILE,y*TILE+13,TILE,3,'#514b56');}
  for(const f of w.furniture)if(f.bid===b.id)this.furniture(c,f);
  for(const win of b.windows){rect(c,win.x+3,win.y+4,10,8,'#e8cc95');rect(c,win.x+7,win.y+4,1,8,'#796c64');}rect(c,b.door.x-6,b.door.y-8,12,16,'#b19a7c');
 }
 furniture(c,f){const{x,y,w,h,kind}=f;rect(c,x+2,y+3,w,h,'#776957');rect(c,x,y,w,h-2,'#7c6252');rect(c,x+1,y+1,w-2,3,'#bc9772');rect(c,x+2,y+5,w-4,h-9,'#9b7d5f');if(kind==='bed'){rect(c,x+1,y+3,14,8,'#e9ddc7');rect(c,x+1,y+13,14,17,'#94768e');rect(c,x+2,y+14,12,2,'#b494a6');}else if(kind==='shelf'){for(let a=5;a<h-3;a+=9){rect(c,x+2,y+a,w-4,2,'#c2a481');for(let k=3;k<w-3;k+=4)rect(c,x+k,y+a-5,3,5,['#697f79','#a7726f','#b7a17a'][k%3]);}}else if(kind==='computer'){rect(c,x+4,y-4,11,9,'#454f60');rect(c,x+5,y-3,9,6,'#7dacad');rect(c,x+19,y+5,8,3,'#d3c8b3');}else if(kind==='counter'||kind==='stall'){rect(c,x+3,y+4,8,5,'#d8b589');rect(c,x+16,y+4,6,5,'#b67a74');rect(c,x+24,y+3,5,6,'#75916a');}else{rect(c,x+5,y+5,6,4,'#eee0bf');rect(c,x+20,y+4,4,6,'#7a8c7d');}}
 exterior(c,b){const{x,y,w,h}=b,roof=b.color;rect(c,x+7,y+10,w,h,'#62685a66');rect(c,x,y+18,w,h-18,'#d0b699');rect(c,x+3,y+h-53,w-6,48,'#b89a7d');rect(c,x,y+h-7,w,7,'#766b60');rect(c,x+1,y+14,3,h-21,'#796a60');rect(c,x+w-4,y+14,3,h-21,'#796a60');
  rect(c,x-4,y-8,w+8,h-62,dark);rect(c,x-2,y-6,w+4,h-66,roof);for(let ry=y-2;ry<y+h-73;ry+=10){rect(c,x,ry,w,1,'#cbb3a04d');for(let rx=x+(Math.floor(ry/10)%2?8:0);rx<x+w;rx+=18)rect(c,rx,ry+1,1,8,'#33374422');}rect(c,x-5,y+h-71,w+10,6,'#4e4650');rect(c,x-3,y+h-66,w+6,3,'#a78b78');rect(c,x-2,y-6,w+4,3,'#d7bd9b66');
  const chimx=x+w-42;rect(c,chimx,y-19,16,27,'#776e6b');rect(c,chimx-2,y-21,20,5,'#b8a592');for(let q=0;q<3;q++){const phase=((this.world.elapsed*5+q*13)%43);rect(c,chimx+4+Math.sin(phase*.1)*4,y-25-phase,8-q,4,'#d7cbb244');}
  for(const xx of [x+30,x+w-50]){rect(c,xx-2,y+h-45,23,29,'#78665e');rect(c,xx,y+h-43,19,22,'#f0cd8e');rect(c,xx+9,y+h-43,2,22,'#8a6a57');rect(c,xx,y+h-33,19,2,'#8a6a57');rect(c,xx-3,y+h-20,25,4,'#705d55');rect(c,xx,y+h-17,19,3,'#6d866b');}
  rect(c,b.door.x-9,y+h-32,18,27,'#584c4f');rect(c,b.door.x-7,y+h-30,14,25,'#8e705f');rect(c,b.door.x+3,y+h-17,2,2,'#dfc28e');rect(c,b.door.x-11,y+h-4,22,4,'#ccbaa0');
  if(['cafe','froyo','market','bakery'].includes(b.id)){for(let i=0;i<8;i++)rect(c,x+80+i*14,y+h-54,14,12,i%2?'#dfc6a3':roof);rect(c,x+78,y+h-56,116,3,'#66575c');}
  c.font='7px monospace';c.textAlign='center';const label=b.name.toUpperCase(),tw=c.measureText(label).width;rect(c,x+w/2-tw/2-7,y+h-48,tw+14,13,'#383840');rect(c,x+w/2-tw/2-7,y+h-48,tw+14,1,'#b9a38b');c.fillStyle='#efdbb6';c.fillText(label,x+w/2,y+h-39);
  if(this.world.hour>=b.open&&this.world.hour<b.close){rect(c,b.door.x-2,y+h-36,4,2,'#c8ce9e');}else rect(c,b.door.x-2,y+h-36,4,2,'#b48985');
 }
 tree(c,t){const{x,y}=t;rect(c,x-10,y-2,22,5,'#56695366');rect(c,x-2,y-18,4,19,'#716257');rect(c,x-15,y-30,30,12,'#506d61');rect(c,x-12,y-39,24,15,'#5f7a67');rect(c,x-8,y-46,16,14,'#6d886e');rect(c,x-4,y-49,8,8,'#819779');rect(c,x-11,y-29,6,3,'#7d9272');rect(c,x+4,y-23,9,4,'#405e57');}
 lamp(c,l){const{x,y}=l;rect(c,x-3,y-1,9,2,'#716d6577');rect(c,x,y-27,2,28,'#55545b');rect(c,x-4,y-30,10,3,'#51505a');rect(c,x-3,y-27,8,9,'#544a4d');rect(c,x-2,y-26,6,7,this.nightAmount()>.1?'#f1cb8c':'#c2b5a0');rect(c,x-3,y-18,8,2,'#4e4d57');}
 person(c,n){const x=Math.round(n.x),y=Math.round(n.y),w=this.world;rect(c,x-5,y-1,10,3,'#45454b44');if(!n.alive){rect(c,x-8,y-5,13,4,n.vampire?'#7c586d':coats[n.coat]);rect(c,x+4,y-5,5,4,'#bba695');return;}
  const player=n.id==='player',guard=n.job==='guard'&&!n.vampire,walking=n.path?.length||(player&&Math.abs((n._lastDrawStep||0)-n.step)>.01),stride=walking?Math.sin(n.step*.23):0,bob=walking?Math.abs(stride)>.6?1:0:0; n._lastDrawStep=n.step;const yy=y-bob,coat=player?'#6f4c72':guard?'#5c728b':coats[n.coat||0],skin=n.vampire?'#c8bbbc':skins[n.skin||0];
  if(player){rect(c,x-6,yy-17,12,14,'#3e344c');rect(c,x-5,yy-15,10,12,'#684765');rect(c,x-5+(stride>0?1:0),yy-5,4,3,'#a06477');rect(c,x+2,yy-6,4,3,'#8f566e');}
  rect(c,x-4,yy-6+Math.round(stride*2),3,6-Math.round(stride*2),'#444553');rect(c,x+1,yy-6-Math.round(stride*2),3,6+Math.round(stride*2),'#444553');rect(c,x-5,yy+Math.round(stride*2),4,2,'#37333e');rect(c,x+1,yy-Math.round(stride*2),4,2,'#37333e');
  rect(c,x-5,yy-16,10,11,dark);rect(c,x-4,yy-16,8,10,coat);rect(c,x-3,yy-15,2,8,'#ffffff18');rect(c,x-5,yy-13+Math.round(stride),2,7,coat);rect(c,x+4,yy-13-Math.round(stride),2,7,coat);rect(c,x-5,yy-7+Math.round(stride),2,2,skin);rect(c,x+4,yy-7-Math.round(stride),2,2,skin);
  rect(c,x-4,yy-24,8,8,dark);rect(c,x-3,yy-23,6,7,skin);rect(c,x-4,yy-24,8,3,player?'#3c3346':guard?'#53657e':['#67534e','#8c7561','#504b50','#a1937b'][n.skin%4||0]);rect(c,x-4,yy-21,2,3,player?'#3c3346':'#67534e');
  if(n.face!==0){const eye=player||n.vampire?'#986275':'#45414a';if(n.face===2)rect(c,x-3,yy-20,1,1,eye);else if(n.face===3)rect(c,x+2,yy-20,1,1,eye);else{rect(c,x-2,yy-20,1,1,eye);rect(c,x+1,yy-20,1,1,eye);}rect(c,x,yy-17,2,1,'#a38380');}
  if(player){rect(c,x-5,yy-17,4,3,'#aa788b');rect(c,x+2,yy-17,3,3,'#aa788b');rect(c,x,yy-13,1,4,'#dbc09e');}if(guard){rect(c,x-5,yy-25,10,3,'#3e4a5f');rect(c,x,yy-24,2,2,'#dac48e');rect(c,x+2,yy-14,2,2,'#dcc18b');}
  if(n.feed||n.heldBy){rect(c,x-3,yy-18,6,3,'#b87688');}if(guard&&n.mode==='pursuing'){const a=w.actor(n.target);if(a){const dx=(a.x-n.x)/Math.max(1,dist(a,n)),dy=(a.y-n.y)/Math.max(1,dist(a,n));rect(c,x+dx*7-2,yy-12+dy*6,5,3,'#b1adb0');}}
 }
 overhead(c,n){const w=this.world,x=Math.round(n.x),y=Math.round(n.y);if(n.vampire){rect(c,x,y-32,2,2,'#e2a3b3');rect(c,x-1,y-31,4,2,'#a95171');rect(c,x,y-29,2,2,'#d485a0');}if(w.selected===n.id){c.strokeStyle='#f2db9f';c.lineWidth=1;c.strokeRect(x-8,y-27,16,30);}
  if(n.report){c.font='8px monospace';c.fillStyle='#f0c38d';c.textAlign='center';c.fillText('!',x,y-36);}if(n.job==='guard'&&n.mode==='pursuing'&&n.aim>0){rect(c,x-7,y-32,14,2,'#4b3c49');rect(c,x-7,y-32,14*clamp(n.aim/.85,0,1),2,'#ecc694');}
  if(n.speech&&n.speech.until>w.elapsed){c.font='7px monospace';c.textAlign='center';c.lineWidth=2;c.strokeStyle='#36313c';c.strokeText(n.speech.text,x,y-40);c.fillStyle='#fff0cf';c.fillText(n.speech.text,x,y-40);}
 }
 map(canvas){const c=canvas.getContext('2d'),w=this.world,s=Math.min(canvas.width/WIDTH,canvas.height/HEIGHT);c.imageSmoothingEnabled=false;rect(c,0,0,canvas.width,canvas.height,'#6d7a69');c.save();c.scale(s,s);c.drawImage(this.ground,0,0);for(const b of w.buildings){rect(c,b.x,b.y,b.w,b.h,b.color);rect(c,b.door.x-8,b.door.y-8,16,16,'#e2c296');c.font='18px Georgia';c.textAlign='center';c.fillStyle='#fff1cd';const labels={inn:'Inn',cafe:'Coffee',post:'Post',guards:'Watch',school:'School',market:'Market',froyo:'Froyo',office:'Office',rowan:'Rowan',willow:'Willow',clinic:'Clinic',bakery:'Bakery'};c.fillText(labels[b.id],b.x+b.w/2,b.y+b.h/2);}for(const n of w.npcs)if(n.alive)rect(c,n.x-3,n.y-3,7,7,n.vampire?'#ed9ab0':n.job==='guard'?'#f6d18f':'#d9ddc8');rect(c,w.p.x-6,w.p.y-6,12,12,'#ffffff');c.restore();}
}
root.VesperRenderer=Renderer;
})(window);
