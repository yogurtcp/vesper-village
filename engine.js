/* Vesper: persistent residents, local knowledge, travel and coarse distant encounters. */
(function(root){
'use strict';
const TILE=16,COLS=96,ROWS=74,WIDTH=COLS*TILE,HEIGHT=ROWS*TILE;
const RULES=Object.freeze({secondsPerHour:60,bloodPerHour:80/24,sunMultiplier:1.5,feedSeconds:5,localRadius:410,farTick:1.25,rumorInterval:12,reportSeconds:2,guardAim:0.85,guardRange:155,bulletDamage:38,newVampireBlood:72});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const names=['Mara Vale','Theo Bell','Nora Moss','Jules Reed','Ada Finch','Oscar Lane','Iris Fox','Felix Grey','Cora Wells','Leon Ash','Mina Brooks','Hugo Pike','Rose Winter','Ellis Hart','Vera Birch','Milo Stone','Alma Finch','Otto Reed','June Vale','Arthur Moss','Lena Bell','Silas Brook','Cleo Hart','Edwin Ash','Pearl Lane','Kit Rowan','Wren Pike','Basil Grey','Esme Fox','Robin Wells','Nell Stone','Dorian Birch','Anya Reed','Finn Winter','Luca Hart','Sage Bell'];
const buildingDefs=[
 ['inn','The Lantern Inn','innkeeper',['Dining room','Kitchen','Guest lounge','Guest rooms'],'#86505d',6,23],
 ['cafe','Juniper Coffee','barista',['Coffee room','Kitchen','Pantry','Staff room'],'#617b73',7,21],
 ['post','Post Office','postal worker',['Public counter','Sorting room','Parcel store','Office'],'#96785e',8,18],
 ['guards','Watch House','guard',['Front desk','Briefing room','Equipment room','Watch quarters'],'#657387',0,24],
 ['school','Village School','teacher',['Classroom','Library','Staff room','Headteacher’s office'],'#9c7b62',8,17],
 ['market','Market Hall','market trader',['Market stalls','Produce room','Store room','Manager’s office'],'#6c8068',8,19],
 ['froyo','Moonberry Froyo','froyo server',['Froyo counter','Preparation room','Freezer','Staff room'],'#9b768c',11,23],
 ['office','Little Cloud Labs','engineer',['Open office','Meeting room','Kitchenette','Server room'],'#6c7e8c',9,20],
 ['rowan','Rowan House','resident',['Sitting room','Kitchen','Study','Bedroom'],'#977360',0,24],
 ['willow','Willow House','resident',['Sitting room','Kitchen','Study','Bedroom'],'#6f7f79',0,24],
 ['clinic','St. Agnes Clinic','nurse',['Waiting room','Consulting room','Treatment room','Staff room'],'#839085',7,22],
 ['bakery','The Early Bird','baker',['Bakery shop','Bake room','Flour store','Rest room'],'#b08a69',5,18]
];
function layout(){
 const solid=new Uint8Array(COLS*ROWS),opaque=new Uint8Array(COLS*ROWS),buildings=[],furniture=[];
 const index=(x,y)=>y*COLS+x,set=(x,y,see=true)=>{solid[index(x,y)]=1;opaque[index(x,y)]=see?1:0;};
 for(let x=0;x<COLS;x++){set(x,0);set(x,ROWS-1);}for(let y=0;y<ROWS;y++){set(0,y);set(COLS-1,y);}
 buildingDefs.forEach((d,i)=>{
  const tx=[5,28,51,74][i%4],ty=[5,28,51][Math.floor(i/4)],b={id:d[0],name:d[1],job:d[2],rooms:d[3],color:d[4],open:d[5],close:d[6],tx,ty,x:tx*TILE,y:ty*TILE,w:17*TILE,h:16*TILE,door:{x:(tx+4.5)*TILE,y:(ty+15.5)*TILE},windows:[]};
  for(let x=tx;x<tx+17;x++){set(x,ty);if(x!==tx+4)set(x,ty+15);}
  for(let y=ty;y<ty+16;y++){set(tx,y);set(tx+16,y);}
  for(let y=ty+1;y<ty+15;y++)if(y!==ty+4&&y!==ty+11)set(tx+9,y);
  for(let x=tx+1;x<tx+16;x++)if(x!==tx+4&&x!==tx+12)set(x,ty+8);
  for(const wx of [2,6,11,14])for(const wy of [0,15]){if(wx===4)continue;opaque[index(tx+wx,ty+wy)]=0;b.windows.push({x:(tx+wx)*TILE,y:(ty+wy)*TILE});}
  for(const wy of [3,6,10,13])for(const wx of [0,16]){opaque[index(tx+wx,ty+wy)]=0;b.windows.push({x:(tx+wx)*TILE,y:(ty+wy)*TILE});}
  const roomRects=[{x:tx+1,y:ty+9,w:8,h:6},{x:tx+1,y:ty+1,w:8,h:7},{x:tx+10,y:ty+9,w:6,h:6},{x:tx+10,y:ty+1,w:6,h:7}];b.roomRects=roomRects;
  b.spots=roomRects.map(r=>({x:(r.x+Math.floor(r.w/2)+.5)*TILE,y:(r.y+Math.floor(r.h/2)+.5)*TILE}));
  roomRects.forEach((r,j)=>{
   const kind=j===3&&(i===0||i===8||i===9)?'bed':j===1?'counter':j===2?'shelf':i===4?'desk':i===5?'stall':i===7?'computer':'table';
   const cells=kind==='bed'?[[r.x+1,r.y+1],[r.x+1,r.y+2]]:[[r.x+1,r.y+1],[r.x+2,r.y+1]];
   cells.forEach(([x,y])=>set(x,y,false));furniture.push({x:cells[0][0]*TILE,y:cells[0][1]*TILE,w:kind==='bed'?16:32,h:kind==='bed'?32:16,kind,bid:b.id,room:j});
   if(j===2){for(let a=0;a<3;a++)set(r.x+r.w-1,r.y+a+1,false);furniture.push({x:(r.x+r.w-1)*TILE,y:(r.y+1)*TILE,w:16,h:48,kind:'shelf',bid:b.id,room:j});}
  });buildings.push(b);
 });
 return{solid,opaque,buildings,furniture};
}
class World{
 constructor(saved){const l=layout();Object.assign(this,l);this.buildingById=Object.fromEntries(this.buildings.map(b=>[b.id,b]));this.pathCache=new Map();this.tick=0;this.time=17.75;this.elapsed=0;this.seed=(Math.random()*4294967296)>>>0;this.events=[];this.rumors=[];this.bullets=[];this.effects=[];this.wanted={};this.fear=0;this.speed=1;this.paused=false;this.end=null;this.selected=null;this.feed=null;this.lastRumor=0;this.lastRoutine=-1;this.lastFear=0;this.stats={turned:0,meals:0,shots:0};this.message=null;this.npcs=[];
  this.p={id:'player',name:'Lucien Vesper',x:155,y:299,face:1,blood:72,hp:100,vampire:true,alive:true,step:0,room:null,location:null,knowledge:{},human:false};
  for(let i=0;i<36;i++){const work=this.buildings[i%12],home=this.buildings[[0,8,9][i%3]],spot=work.spots[i%4],n={id:'n'+i,name:names[i],x:spot.x+(i%3)*7,y:spot.y,face:1,step:0,alive:true,human:true,vampire:false,blood:75+this.rand()*25,hp:100,home:home.id,work:work.id,job:work.job,temperament:['careful','sociable','reckless','dutiful'][i%4],family:Math.floor(i/3),knowledge:{},knownSources:{},path:[],goal:null,mode:'routine',wait:0,nextDecision:0,farDebt:0,nextHunt:0,speech:null,feed:null,report:null,heldBy:null,aim:0,cooldown:0,wasLocal:false,travel:'',lastGossip:0,skin:i%5,coat:i%10};this.npcs.push(n);}
  // Start with one hungry, undiscovered rival; conversion by any vampire spreads the same condition.
  const rival=this.npcs[0];rival.vampire=true;rival.human=false;rival.blood=29;rival.mode='seeking';rival.x=this.buildingById.market.spots[2].x;rival.y=this.buildingById.market.spots[2].y;
  this.npcs.filter(n=>n.job==='guard').forEach((n,i)=>{n.x=1100+i*28;n.y=370;n.mode='patrol';});
  // A real, interruptible evening walk near the inn gives the first hunt a readable opportunity.
  const first=this.npcs[1];first.x=217;first.y=350;first.wait=13;first.mode='strolling';first.nextDecision=13;
  this.playerLocation();this.log('You arrive in Bellwether. Somewhere, another vampire is already hungry.','arrival');
  if(saved)this.restore(saved);
 }
 rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 get day(){return Math.floor(this.time/24)+1;}get hour(){return((this.time%24)+24)%24;}get daylight(){return this.hour>=7&&this.hour<19;}
 clock(time=this.time){const h=((time%24)+24)%24;return `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor((h%1)*60)).padStart(2,'0')}`;}
 log(text,kind='town',actor=null){this.events.unshift({time:this.time,text,kind,actor});this.events=this.events.slice(0,100);}
 say(n,text,seconds=4){n.speech={text,until:this.elapsed+seconds};}
 notify(text,seconds=5){this.message={text,until:this.elapsed+seconds};}
 actor(id){return id==='player'?this.p:this.npcs.find(n=>n.id===id);}
 buildingAt(x,y){return this.buildings.find(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h)||null;}
 roomAt(x,y){const b=this.buildingAt(x,y);if(!b)return null;const tx=x/TILE,ty=y/TILE;const i=b.roomRects.findIndex(r=>tx>=r.x&&tx<r.x+r.w&&ty>=r.y&&ty<r.y+r.h);return i<0?null:{building:b.id,index:i,name:b.rooms[i]};}
 playerLocation(){this.p.location=this.buildingAt(this.p.x,this.p.y)?.id||null;this.p.room=this.roomAt(this.p.x,this.p.y);}
 walkable(x,y,r=3){for(const dx of [-r,r])for(const dy of [-r,r]){const tx=Math.floor((x+dx)/TILE),ty=Math.floor((y+dy)/TILE);if(tx<1||ty<1||tx>=COLS-1||ty>=ROWS-1||this.solid[ty*COLS+tx])return false;}return true;}
 move(n,dx,dy){if(this.walkable(n.x+dx,n.y))n.x+=dx;if(this.walkable(n.x,n.y+dy))n.y+=dy;if(Math.abs(dx)+Math.abs(dy)>.001){n.step+=Math.hypot(dx,dy);n.face=Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?0:1);}}
 los(a,b){if(dist(a,b)>250)return false;const steps=Math.max(1,Math.ceil(dist(a,b)/5));for(let i=1;i<steps;i++){const x=Math.floor((a.x+(b.x-a.x)*i/steps)/TILE),y=Math.floor((a.y+(b.y-a.y)*i/steps)/TILE);if(x<0||y<0||x>=COLS||y>=ROWS||this.opaque[y*COLS+x])return false;}return true;}
 canSee(a,b,omni=false){if(a.mode==='sleeping')return false;const d=dist(a,b);if(d>190||!this.los(a,b))return false;const nightRange=this.daylight?190:105;if(d>nightRange&&!this.lit(b))return false;if(omni||d<30)return true;const f=[[0,-1],[0,1],[-1,0],[1,0]][a.face];return((b.x-a.x)*f[0]+(b.y-a.y)*f[1])/Math.max(1,d)>-.1;}
 lit(n){return!!this.buildingAt(n.x,n.y)||this.lamps().some(p=>dist(p,n)<65);}
 shaded(n){if(this.buildingAt(n.x,n.y))return true;return this.buildings.some(b=>n.x>b.x-12&&n.x<b.x+b.w+14&&n.y>b.y+b.h&&n.y<b.y+b.h+27);}
 lamps(){if(!this._lamps){this._lamps=[];for(const y of [370,738,1100])for(const x of [112,365,480,733,848,1101,1216,1460])if(x<WIDTH-35&&y<HEIGHT-25)this._lamps.push({x,y});}return this._lamps;}
 route(a,b){
  const sx=clamp(Math.floor(a.x/TILE),1,COLS-2),sy=clamp(Math.floor(a.y/TILE),1,ROWS-2),ex=clamp(Math.floor(b.x/TILE),1,COLS-2),ey=clamp(Math.floor(b.y/TILE),1,ROWS-2),start=sy*COLS+sx,end=ey*COLS+ex,key=start+':'+end;
  if(this.pathCache.has(key))return this.pathCache.get(key).map(p=>({...p}));if(this.solid[end])return[];
  const open=[start],prev=new Int32Array(COLS*ROWS).fill(-1),cost=new Float32Array(COLS*ROWS).fill(Infinity),closed=new Uint8Array(COLS*ROWS);cost[start]=0;
  let found=false,budget=5500;
  while(open.length&&budget--){let best=0,bf=Infinity;for(let i=0;i<open.length;i++){const k=open[i],h=Math.abs(k%COLS-ex)+Math.abs(Math.floor(k/COLS)-ey),f=cost[k]+h;if(f<bf){bf=f;best=i;}}const cur=open.splice(best,1)[0];if(cur===end){found=true;break;}if(closed[cur])continue;closed[cur]=1;const cx=cur%COLS,cy=Math.floor(cur/COLS);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=cx+dx,y=cy+dy,k=y*COLS+x;if(x<1||y<1||x>=COLS-1||y>=ROWS-1||this.solid[k]||closed[k])continue;const c=cost[cur]+1;if(c<cost[k]){cost[k]=c;prev[k]=cur;open.push(k);}}}
  if(!found)return[];const result=[];for(let k=end;k!==start;k=prev[k]){if(k<0)return[];result.push({x:(k%COLS+.5)*TILE,y:(Math.floor(k/COLS)+.5)*TILE});}result.reverse();
  if(this.pathCache.size>700)this.pathCache.clear();this.pathCache.set(key,result);return result.map(p=>({...p}));
 }
 setGoal(n,point,label='walking'){if(!point)return;n.goal={x:point.x,y:point.y};n.path=this.route(n,point);n.travel=label;}
 walkRoute(n,dt,speed){let left=speed*dt;while(left>0&&n.path?.length){const p=n.path[0],d=dist(n,p);if(d<1){n.path.shift();continue;}const step=Math.min(left,d);const ox=n.x,oy=n.y;this.move(n,(p.x-n.x)/d*step,(p.y-n.y)/d*step);left-=step;if(dist(n,p)<1)n.path.shift();if(Math.hypot(n.x-ox,n.y-oy)<step*.2){n.path=[];n.nextDecision=0;break;}}}
 bloodDrain(n,dt){const sun=n.blood<50&&this.daylight&&!this.shaded(n);n.blood=Math.max(0,n.blood-RULES.bloodPerHour*dt/RULES.secondsPerHour*(sun?RULES.sunMultiplier:1));}
 canTouch(a,b){if(dist(a,b)>28)return false;const steps=Math.max(1,Math.ceil(dist(a,b)/3));for(let i=1;i<steps;i++){const x=Math.floor((a.x+(b.x-a.x)*i/steps)/TILE),y=Math.floor((a.y+(b.y-a.y)*i/steps)/TILE);if(this.solid[y*COLS+x])return false;}return true;}
 nearestHuman(a){return this.npcs.filter(n=>n.alive&&!n.vampire&&!n.heldBy&&dist(a,n)<27&&this.canTouch(a,n)).sort((x,y)=>dist(a,x)-dist(a,y))[0]||null;}
 startFeed(attacker,victim){if(!attacker.alive||!victim?.alive||victim.vampire||victim.heldBy||!this.canTouch(attacker,victim))return false;attacker.feed={target:victim.id,elapsed:0,witnesses:[]};victim.heldBy=attacker.id;victim.knowledge[attacker.id]=1;victim.lastSeen={target:attacker.id,x:attacker.x,y:attacker.y,time:this.elapsed};victim.path=[];attacker.path=[];if(attacker===this.p){this.feed=attacker.feed;this.selected=victim.id;}this.say(victim,'…!',2);return true;}
 cancelFeed(attacker,interrupted=true){const f=attacker.feed;if(!f)return;const v=this.actor(f.target);if(v?.alive){v.heldBy=null;if(interrupted)this.witness(v,attacker,'I was attacked!');}attacker.feed=null;if(attacker===this.p){this.feed=null;this.feedMustRelease=true;}}
 witness(who,attacker,text='A vampire! Help!'){
  if(!who.alive||who.vampire||who.id===attacker.id)return;const old=who.knowledge[attacker.id]||0;who.knowledge[attacker.id]=1;who.lastSeen={target:attacker.id,x:attacker.x,y:attacker.y,time:this.elapsed};
  if(old<1){this.say(who,text,5);this.log(`${who.name} witnessed ${attacker===this.p?'your':attacker.name+'’s'} attack.`, 'witness',who.id);this.fear=clamp(this.fear+5,0,100);if(dist(who,this.p)<430)this.notify(`${who.name.split(' ')[0]} saw the bite and is running to report it.`);}
  if(who.job==='guard'){this.report(attacker.id,who);return;}
  if(!who.report||who.report.target!==attacker.id){who.report={target:attacker.id,wait:0};who.mode='reporting';this.setGoal(who,this.buildingById.guards.spots[0],'running to the Watch House');}
 }
 feedStep(a,dt,local=true){const f=a.feed;if(!f)return;const v=this.actor(f.target);if(!v?.alive||v.vampire||!a.alive||dist(a,v)>36){this.cancelFeed(a,false);return;}f.elapsed+=dt;
  for(const w of this.npcs){if(!w.alive||w.vampire||w.mode==='sleeping'||w.id===v.id||w.id===a.id)continue;const sees=local?this.canSee(w,a):dist(w,a)<140&&this.los(w,a)&&(this.rand()<.24*dt);if(sees&&!f.witnesses.includes(w.id)){f.witnesses.push(w.id);this.witness(w,a);}}
  if(f.elapsed>=RULES.feedSeconds){v.heldBy=null;v.vampire=true;v.human=false;v.blood=RULES.newVampireBlood;v.feed=null;v.report=null;v.mode='recovering';v.wait=5;v.nextHunt=this.elapsed+15;v.nextDecision=this.elapsed+5;v.path=[];a.blood=100;a.feed=null;a.nextHunt=this.elapsed+30;this.stats.turned++;this.stats.meals++;this.log(`${a===this.p?'You':a.name} turned ${v.name} in ${this.buildingAt(v.x,v.y)?.name||'the street'}.`,'conversion',v.id);this.say(v,'What… happened?',4);this.effects.push({x:v.x,y:v.y,kind:'turn',until:this.elapsed+2});if(a===this.p){this.feed=null;this.feedMustRelease=true;this.notify(`${v.name} is now a vampire. Independent. They will need to feed.`);}}
 }
 report(target,source){const a=this.actor(target);if(!a)return;if(!this.wanted[target]){const seen=source.lastSeen?.target===target?source.lastSeen:a;this.wanted[target]={x:seen.x,y:seen.y,time:this.elapsed,name:a.name};this.fear=clamp(this.fear+18,0,100);this.log(`${source.name} identified ${target==='player'?'you':a.name}. Silver patrol dispatched.`,'report',target);if(target==='player'){this.notify('EXPOSED. The Watch knows your face. Run.',8);for(const n of this.npcs)if(n.alive)n.knowledge.player=1;}else if(dist(a,this.p)<600)this.notify(`The Watch is hunting ${a.name}.`);for(const g of this.npcs.filter(n=>n.job==='guard'&&n.alive&&!n.vampire)){g.knowledge[target]=1;g.nextDecision=0;}}
 }
 rumorStep(){
  for(const a of this.npcs){if(!a.alive||a.vampire||a.heldBy)continue;const others=this.npcs.filter(b=>b.alive&&!b.vampire&&!b.heldBy&&b.id!==a.id&&dist(a,b)<65&&this.los(a,b));if(!others.length)continue;const b=others[Math.floor(this.rand()*others.length)];const facts=Object.keys(a.knowledge).filter(k=>a.knowledge[k]>=.3);if(!facts.length)continue;const k=facts[Math.floor(this.rand()*facts.length)],confidence=Math.max(.3,a.knowledge[k]*.72),old=b.knowledge[k]||0;
   if(confidence>old+.04){b.knowledge[k]=Math.min(.79,confidence);b.knownSources[k]=a.id;const person=this.actor(k);if(person){this.say(a,`Be careful around ${person.name.split(' ')[0]}.`,4);this.rumors.unshift({time:this.time,from:a.id,to:b.id,target:k,confidence:b.knowledge[k]});this.rumors=this.rumors.slice(0,50);if(dist(a,this.p)<250)this.log(`${a.name.split(' ')[0]} warned ${b.name.split(' ')[0]} about ${person.name.split(' ')[0]}.`,'rumor',k);}}
  }
 }
 witnessCount(v,a){return this.npcs.filter(n=>n.alive&&!n.vampire&&n.id!==v.id&&n.id!==a.id&&dist(n,v)<125&&this.los(n,v)).length;}
 routine(n){const work=this.buildingById[n.work],home=this.buildingById[n.home],h=this.hour;let b=home,room=3,label='going home';if(h>=work.open&&h<work.close&&n.work!=='rowan'&&n.work!=='willow'){b=work;room=Math.floor(this.rand()*4);label=`working at ${b.name}`;if(h>12&&h<13.3&&n.work!=='cafe'&&n.work!=='froyo'&&n.work!=='guards'){b=this.buildingById.cafe;room=0;label='getting coffee';}}
  else if(h>=7&&h<21&&this.rand()<.3){b=this.buildingById[this.rand()<.6?'market':'froyo'];room=0;label='shopping';}else if(h>=7&&h<21){room=Math.floor(this.rand()*4);label='at home';}
  const p={...b.spots[room]};p.x+=(this.rand()-.5)*44;p.y+=(this.rand()-.5)*34;if(!this.walkable(p.x,p.y))Object.assign(p,b.spots[room]);if(!n.vampire&&this.fear>55&&h>=18&&n.job!=='guard'&&n.job!=='nurse'){b=home;room=0;Object.assign(p,home.spots[0]);label='sheltering at home';}n.mode='routine';n.wait=8+this.rand()*22;this.setGoal(n,p,label);n.sleepOnArrival=(h>=23||h<6)&&b===home;
 }
 decide(n){
  if(!n.alive||n.heldBy||n.feed)return;if(n.mode==='sleeping'){if(this.hour>=6&&this.hour<23){n.mode='routine';n.wait=0;}else if(!n.vampire||n.blood>=58)return;}
  if(n.report&&!n.vampire){n.mode='reporting';const g=this.npcs.find(g=>g.alive&&!g.vampire&&g.job==='guard'&&dist(n,g)<75&&this.los(n,g));if(g||dist(n,this.buildingById.guards.spots[0])<30){n.report.wait+=.7;if(n.report.wait>=RULES.reportSeconds){this.report(n.report.target,n);n.report=null;n.nextDecision=this.elapsed+2;}}else if(!n.path.length)this.setGoal(n,this.buildingById.guards.spots[0],'running to report an attack');return;}
  if(n.vampire){
   if(this.wanted[n.id]&&this.npcs.some(g=>g.alive&&!g.vampire&&g.job==='guard'&&dist(g,n)<210&&this.los(g,n))){n.mode='fleeing';const b=this.buildings[Math.floor(this.rand()*this.buildings.length)];this.setGoal(n,b.spots[3],'fleeing the Watch');return;}
   if(n.blood<58&&this.elapsed>=n.nextHunt){const candidates=this.npcs.filter(v=>v.alive&&!v.vampire&&v.job!=='guard'&&!v.heldBy&&dist(n,v)<(n.temperament==='reckless'?600:390));candidates.sort((a,b)=>{const score=v=>dist(n,v)+(this.witnessCount(v,n)*(n.temperament==='reckless'?18:95));return score(a)-score(b);});const v=candidates[0];if(v){n.mode='hunting';n.huntTarget=v.id;const witnesses=this.witnessCount(v,n);if(dist(n,v)<25&&(witnesses===0||n.temperament==='reckless'||n.blood<23)){this.startFeed(n,v);return;}if(!n.path.length||dist(n.goal||n,v)>40)this.setGoal(n,v,`following ${v.name.split(' ')[0]}`);return;}}
   if(!n.path.length&&n.wait<=0)this.routine(n);return;
  }
  if(n.job==='guard'){this.guardDecision(n);return;}
  const danger=this.npcs.filter(v=>v.alive&&((n.knowledge[v.id]||0)>=.3)&&dist(n,v)<120&&this.los(n,v));if((n.knowledge.player||0)>=.3&&dist(n,this.p)<120&&this.los(n,this.p))danger.push(this.p);
  if(danger.length){n.mode='fleeing';const safe=this.buildings.filter(b=>b.id==='guards'||b.id==='market'||b.id==='clinic').sort((a,b)=>dist(n,a.spots[0])-dist(n,b.spots[0]))[0];if(!n.path.length||n.travel!=='seeking safety')this.setGoal(n,safe.spots[0],'seeking safety');if(this.elapsed-(n.lastAlarm||0)>15){this.say(n,'Stay away!',3);n.lastAlarm=this.elapsed;}return;}
  if(this.fear>28&&!this.daylight&&!this.buildingAt(n.x,n.y)){const friend=this.npcs.find(v=>v.alive&&!v.vampire&&v.id!==n.id&&v.home===n.home&&dist(n,v)<170);if(friend&&dist(n,friend)>60&&this.rand()<.5){n.mode='waiting';n.wait=2;this.say(n,'Wait for me.',3);this.setGoal(n,friend,'walking together');return;}}
  if(!n.path.length&&n.wait<=0)this.routine(n);
 }
 guardDecision(g){const targets=Object.keys(this.wanted).map(id=>this.actor(id)).filter(a=>a?.alive);let target=targets.filter(a=>this.canSee(g,a,true)).sort((a,b)=>dist(g,a)-dist(g,b))[0];
  if(target){const fact=this.wanted[target.id];Object.assign(fact,{x:target.x,y:target.y,time:this.elapsed});g.mode='pursuing';g.target=target.id;if(dist(g,target)>RULES.guardRange*.8)this.setGoal(g,target,`hunting ${target.name.split(' ')[0]}`);else g.path=[];if(!g.speech||this.elapsed>g.speech.until+4)this.say(g,'VAMPIRE! Stand back!',3);return;}
  const fact=targets.map(a=>({...this.wanted[a.id],id:a.id})).sort((a,b)=>dist(g,a)-dist(g,b))[0];if(fact){g.mode='searching';g.target=fact.id;if(!g.path.length){const p=this.elapsed-fact.time<25?fact:{x:fact.x+(this.rand()-.5)*280,y:fact.y+(this.rand()-.5)*220};if(this.walkable(p.x,p.y))this.setGoal(g,p,'searching the last sighting');}g.aim=0;return;}
  g.mode='patrol';g.target=null;g.aim=0;if(!g.path.length){const p={x:[155,385,525,753,900,1120,1265,1480][Math.floor(this.rand()*8)],y:[365,735,1100][Math.floor(this.rand()*3)]};if(this.walkable(p.x,p.y))this.setGoal(g,p,'on patrol');}
 }
 guardStep(g,dt){if(g.mode!=='pursuing'||g.vampire||g.heldBy||!g.alive)return;const a=this.actor(g.target);if(!a?.alive||dist(g,a)>RULES.guardRange||!this.los(g,a)){g.aim=0;return;}g.face=Math.abs(a.x-g.x)>Math.abs(a.y-g.y)?(a.x<g.x?2:3):(a.y<g.y?0:1);g.aim+=dt;if(g.aim>=RULES.guardAim&&g.cooldown<=0){g.aim=0;g.cooldown=.9;this.stats.shots++;this.bullets.push({x:g.x,y:g.y-8,tx:a.x,ty:a.y-8,until:this.elapsed+.18});a.hp-=RULES.bulletDamage;if(a===this.p){this.effects.push({x:a.x,y:a.y,kind:'hit',until:this.elapsed+.4});this.notify('Silver. Find cover!',2);}if(a.hp<=0)this.kill(a,'silver bullets');}}
 kill(n,cause){if(!n.alive)return;this.cancelFeed(n,false);if(n.heldBy){const a=this.actor(n.heldBy);if(a)this.cancelFeed(a,false);}n.alive=false;n.path=[];n.heldBy=null;this.log(`${n===this.p?'You were':n.name+' was'} killed by ${cause}.`,'death',n.id);this.effects.push({x:n.x,y:n.y,kind:'death',until:this.elapsed+7});if(n===this.p){this.end={cause,time:this.time};this.notify('Your secret ends here.',8);}else{this.fear=clamp(this.fear+6,0,100);if(dist(n,this.p)<420)this.notify(`The Watch killed ${n.name}.`,5);}}
 step(dt,input={}){
  if(this.paused||this.end)return;if(this.waitingForFeedInput){if(!input.feed&&!input.x&&!input.y)return;this.waitingForFeedInput=false;}dt=Math.min(dt,.1)*this.speed;this.tick++;this.elapsed+=dt;this.time+=dt/RULES.secondsPerHour;this.bloodDrain(this.p,dt);
  if(this.p.blood<=0){this.kill(this.p,'starvation');return;}
  let mx=input.x||0,my=input.y||0;const m=Math.hypot(mx,my);if(m>1){mx/=m;my/=m;}if(m>.08&&this.p.feed)this.cancelFeed(this.p,true);
  if(!this.p.feed){const speed=input.run?87:56;this.move(this.p,mx*speed*dt,my*speed*dt);if(input.run&&m>.1)this.p.blood=Math.max(0,this.p.blood-.012*dt);}
  if(!input.feed)this.feedMustRelease=false;this.playerLocation();if(input.feed&&!this.p.feed&&!this.feedMustRelease&&m<=.08){const v=this.nearestHuman(this.p);if(v)this.startFeed(this.p,v);}else if(!input.feed&&this.p.feed)this.cancelFeed(this.p,true);
  if(this.p.feed)this.feedStep(this.p,dt,true);
  for(const n of this.npcs){if(!n.alive)continue;const local=dist(n,this.p)<(this.localRadius||RULES.localRadius);n.farDebt+=dt;if(!local&&n.farDebt<RULES.farTick)continue;const ndt=n.farDebt;n.farDebt=0;n.wasLocal=local;n.wait=Math.max(0,n.wait-ndt);n.cooldown=Math.max(0,n.cooldown-ndt);
   if(n.vampire){this.bloodDrain(n,ndt);if(n.blood<=0){this.kill(n,'starvation');continue;}}
   if(n.heldBy)continue;if(n.feed){this.feedStep(n,ndt,local);continue;}
   if(this.elapsed>=n.nextDecision){n.nextDecision=this.elapsed+(local?.7:3.5);this.decide(n);}
   const speed=n.mode==='reporting'?70:n.mode==='fleeing'?73:n.mode==='pursuing'?79:n.mode==='hunting'?48:n.job==='guard'?43:30;
   this.walkRoute(n,ndt,speed);if(!n.path.length&&n.sleepOnArrival&&!n.feed&&!n.report&&!n.heldBy&&n.mode==='routine'&&(this.hour>=23||this.hour<6)){n.mode='sleeping';n.travel='sleeping at home';}if(n.mode==='reporting'&&n.report){const guard=this.npcs.find(g=>g.alive&&!g.vampire&&g.job==='guard'&&dist(n,g)<60&&this.los(n,g));if(guard){this.report(n.report.target,n);n.report=null;n.nextDecision=0;}}
   if(n.job==='guard')this.guardStep(n,ndt);
  }
  if(this.elapsed-this.lastRumor>=RULES.rumorInterval){this.lastRumor=this.elapsed;this.rumorStep();}
  if(this.elapsed-this.lastFear>10){this.lastFear=this.elapsed;const nervous=this.npcs.filter(n=>n.alive&&Object.values(n.knowledge).some(x=>x>=.3)).length;this.fear=clamp(Math.max(this.fear-.15,nervous*1.5),0,100);}
  this.effects=this.effects.filter(e=>e.until>this.elapsed);this.bullets=this.bullets.filter(e=>e.until>this.elapsed);
 }
 snapshot(){return{version:1,time:this.time,elapsed:this.elapsed,seed:this.seed,p:this.p,npcs:this.npcs,events:this.events,rumors:this.rumors,wanted:this.wanted,fear:this.fear,stats:this.stats,end:this.end,lastRumor:this.lastRumor,lastFear:this.lastFear};}
 restore(s){if(s?.version!==1||!Array.isArray(s.npcs)||s.npcs.length!==36||!Number.isFinite(s.time)||!Number.isFinite(s.p?.x))throw Error('Unsupported village save');for(const k of ['time','elapsed','seed','p','npcs','events','rumors','wanted','fear','stats','end','lastRumor','lastFear'])if(s[k]!==undefined)this[k]=s[k];this.feed=this.p.feed||null;this.waitingForFeedInput=!!this.feed;this.playerLocation();}
}
root.VesperEngine={World,RULES,TILE,COLS,ROWS,WIDTH,HEIGHT,dist,clamp};
if(typeof module!=='undefined')module.exports=root.VesperEngine;
})(typeof window==='undefined'?globalThis:window);
