/* Update once at online startup. No polling, focus or reconnect update hooks. */
window.VESPER_BOOT=(async()=>{
 'use strict';const build=document.querySelector('meta[name="vesper-build"]').content;let installPrompt=null;
 const button=document.getElementById('install-button');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;button.hidden=false;});
 const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 if(!installed)button.hidden=false;button.onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else{const p=document.getElementById('panel');document.getElementById('panel-content').innerHTML='<h1>Keep Vesper nearby</h1><p>On iPhone or iPad: open this page in Safari, tap Share, then Add to Home Screen.</p><p>On Android or desktop: use your browser’s Install app or Add to Home Screen action when available. Private-site sign-in may affect installation support.</p><p>Your village is saved on this device. After one online visit, the game can run offline. Published updates are checked at online startup.</p>';p.showModal();window.Vesper?.world&&(window.Vesper.world.paused=true);}};
 window.addEventListener('appinstalled',()=>{button.hidden=true;});
 if(!('serviceWorker'in navigator))return;
 try{
  const hadController=!!navigator.serviceWorker.controller;let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;const guard='vesper-upgraded-'+build;if(sessionStorage.getItem(guard)||window.VESPER_ACTIVE)return;reloading=true;window.VESPER_SAVE?.();sessionStorage.setItem(guard,'1');location.reload();});
  const reg=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
  function apply(w){if(w)w.postMessage({type:'ACTIVATE'});}if(reg.waiting&&navigator.onLine)apply(reg.waiting);
  reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.onLine)apply(w);});});
  if(navigator.onLine)await Promise.race([reg.update(),new Promise(r=>setTimeout(r,1800))]);
 }catch(e){console.info('Offline installation is unavailable:',e.message);}
})();
