/* html-ppt :: runtime.js
 * Offline-compatible runtime preserving the skill's keyboard-first contract:
 * arrows/space navigation, F fullscreen, S presenter, N notes, O overview,
 * T theme cycle, A animation cycle, #/N deep links, progress bar, counter-up.
 * Structure and behavior follow the upstream html-ppt-skill runtime contract.
 */
(function(){
  'use strict';
  const ANIMS=['fade-up','fade-down','fade-left','fade-right','rise-in','drop-in','zoom-pop','blur-in','glitch-in','typewriter','neon-glow','shimmer-sweep','gradient-flow','stagger-list','counter-up','path-draw','parallax-tilt','card-flip-3d','cube-rotate-3d','page-turn-3d','perspective-zoom','marquee-scroll','kenburns','confetti-burst','spotlight','morph-shape','ripple-reveal'];
  const ready=fn=>document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn);
  ready(()=>{
    const root=document.documentElement, deck=document.querySelector('.deck');
    if(!deck) return;
    const slides=[...deck.querySelectorAll('.slide')]; if(!slides.length)return;
    const total=slides.length;
    const preview=new URLSearchParams(location.search).get('preview');
    if(preview){
      const n=Math.max(0,Math.min(total-1,parseInt(preview,10)-1));
      slides.forEach((s,i)=>{s.classList.toggle('is-active',i===n);s.style.display=i===n?'':'none';if(i===n){s.style.opacity='1';s.style.transform='none';s.style.pointerEvents='auto'}});
      document.querySelectorAll('.notes,.progress-bar,.overview,.notes-overlay').forEach(e=>e.style.display='none');
      return;
    }
    let idx=0, themeIdx=0, animIdx=0;
    const themeNames=(document.body.dataset.themes||root.dataset.themes||'').split(',').map(s=>s.trim()).filter(Boolean);
    const themeBase=document.body.dataset.themeBase||root.dataset.themeBase||'assets/themes/';
    const themeLink=document.getElementById('theme-link');
    function applyTheme(name){if(themeLink){themeLink.href=themeBase+name+'.css';}root.dataset.theme=name;document.body.dataset.theme=name;}
    if(themeNames.length){const initial=themeLink?.getAttribute('href')?.split('/').pop()?.replace('.css','');themeIdx=Math.max(0,themeNames.indexOf(initial));applyTheme(themeNames[themeIdx]);}

    let bar=document.querySelector('.progress-bar');
    if(!bar){bar=document.createElement('div');bar.className='progress-bar';bar.innerHTML='<span></span>';document.body.appendChild(bar)}
    const barFill=bar.querySelector('span');
    let notesOverlay=document.querySelector('.notes-overlay');
    if(!notesOverlay){notesOverlay=document.createElement('div');notesOverlay.className='notes-overlay';document.body.appendChild(notesOverlay)}

    function renderNotes(){const n=slides[idx].querySelector('.notes,aside.notes,.speaker-notes');notesOverlay.innerHTML=n?n.innerHTML:''}
    function animateCurrent(){slides[idx].querySelectorAll('[data-anim]').forEach(el=>{const a=el.dataset.anim;el.classList.remove('anim-'+a);void el.offsetWidth;el.classList.add('anim-'+a)});slides[idx].querySelectorAll('.counter').forEach(el=>{const target=parseFloat(el.dataset.to||el.textContent||0);const dur=parseInt(el.dataset.dur||'1200',10);const start=performance.now();function tick(now){const t=Math.min(1,(now-start)/dur);const v=target*(1-Math.pow(1-t,3));el.textContent=Number.isInteger(target)?Math.round(v):v.toFixed(1);if(t<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)})}
    function go(n,remote){idx=Math.max(0,Math.min(total-1,n));slides.forEach((s,i)=>{s.classList.toggle('is-active',i===idx);s.classList.toggle('is-prev',i<idx)});barFill.style.width=((idx+1)/total*100)+'%';const num=document.querySelector('.slide-number');if(num){num.dataset.current=idx+1;num.dataset.total=total}renderNotes();history.replaceState(null,'','#/'+(idx+1));animateCurrent();if(!remote&&bc)bc.postMessage({type:'go',idx})}

    let bc=null;try{bc=new BroadcastChannel('html-ppt-presenter-'+location.pathname)}catch(e){}
    if(bc)bc.onmessage=e=>{if(e.data?.type==='go')go(e.data.idx,true);if(e.data?.type==='theme'&&themeNames.includes(e.data.name)){themeIdx=themeNames.indexOf(e.data.name);applyTheme(e.data.name)}};

    function toggleNotes(force){notesOverlay.classList.toggle('open',force===undefined?!notesOverlay.classList.contains('open'):force)}
    let overview=document.querySelector('.overview');
    function buildOverview(){
      if(overview)return;
      overview=document.createElement('div');overview.className='overview';
      slides.forEach((s,i)=>{const t=document.createElement('div');t.className='thumb';const mini=document.createElement('div');mini.className='mini-slide';mini.style.cssText='position:absolute;inset:0;width:1920px;height:1080px;transform-origin:top left;pointer-events:none';const clone=s.cloneNode(true);clone.className='slide is-active';clone.style.cssText='position:absolute;inset:0;opacity:1;transform:none;pointer-events:auto;padding:72px 96px';mini.appendChild(clone);t.appendChild(mini);const label=document.createElement('div');label.className='t';label.textContent=(s.dataset.title||'Slide '+(i+1));t.appendChild(label);t.addEventListener('click',()=>{go(i);toggleOverview(false)});overview.appendChild(t)});document.body.appendChild(overview)
    }
    function toggleOverview(force){buildOverview();const open=force===undefined?!overview.classList.contains('open'):force;overview.classList.toggle('open',open);if(open){requestAnimationFrame(()=>{const scale=overview.querySelector('.thumb').clientWidth/1920;overview.querySelectorAll('.mini-slide').forEach(m=>m.style.transform='scale('+scale+')')})}}

    function presenter(){
      const win=window.open('','html-ppt-presenter','width=1200,height=780');if(!win)return;
      const cur=idx+1,next=idx<total-1?idx+2:null;const notes=slides[idx].querySelector('.notes')?.innerHTML||'';const url=location.href.split('#')[0];
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Presenter View</title><style>html,body{margin:0;height:100%;background:#08080f;color:#eee;font-family:system-ui,sans-serif}body{display:grid;grid-template-columns:2fr 1fr;gap:14px;padding:14px;box-sizing:border-box}.card{background:#111322;border:1px solid #33384d;border-radius:12px;overflow:hidden}.head{padding:8px 12px;border-bottom:1px solid #2a2f42;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.preview{width:100%;height:calc(100% - 35px);border:0;background:#000}.notes{padding:18px;line-height:1.65;overflow:auto}.meta{padding:10px 14px;color:#8d93aa;font-size:12px}.btns{display:flex;gap:8px;padding:10px 14px}.btns button{background:#181c2b;color:#fff;border:1px solid #424963;border-radius:8px;padding:8px 12px;cursor:pointer}</style></head><body><div class="card"><div class="head">CURRENT · ${cur}/${total}</div><iframe class="preview" src="${url}?preview=${cur}"></iframe></div><div style="display:grid;grid-template-rows:1fr auto" class="card"><div><div class="head">SPEAKER SCRIPT</div><div class="notes">${notes||'<span class="meta">No speaker notes.</span>'}</div></div><div><div class="meta">NEXT: ${next?next+'/'+total:'END'}</div><div class="btns"><button onclick="window.opener.postMessage({type:'prev'},'*')">← Prev</button><button onclick="window.opener.postMessage({type:'next'},'*')">Next →</button></div></div></div></body></html>`);win.document.close();
      window.addEventListener('message',e=>{if(e.data?.type==='next')go(idx+1);if(e.data?.type==='prev')go(idx-1)},{once:false});
    }

    function key(e){if(['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName)&&e.key!=='Escape')return;const k=e.key.toLowerCase();if(k==='arrowright'||k==='pagedown'||k===' '){e.preventDefault();go(idx+1)}else if(k==='arrowleft'||k==='pageup'){e.preventDefault();go(idx-1)}else if(k==='home'){go(0)}else if(k==='end'){go(total-1)}else if(k==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}else if(k==='s'){presenter()}else if(k==='n'){toggleNotes()}else if(k==='o'){toggleOverview()}else if(k==='t'&&themeNames.length){themeIdx=(themeIdx+1)%themeNames.length;applyTheme(themeNames[themeIdx]);bc?.postMessage({type:'theme',name:themeNames[themeIdx]})}else if(k==='a'){const el=slides[idx].querySelector('h1,h2,.gd-glass,.answer-btn');if(el){const a=ANIMS[animIdx++%ANIMS.length];el.classList.remove(...ANIMS.map(x=>'anim-'+x));void el.offsetWidth;el.classList.add('anim-'+a)}}else if(k==='escape'){toggleNotes(false);toggleOverview(false)}}
    document.addEventListener('keydown',key);
    window.__hpxGo=go; window.__hpxGetIndex=()=>idx; window.__hpxGetSlides=()=>slides;
    window.addEventListener('hashchange',()=>{const m=location.hash.match(/#\/(\d+)/);if(m)go(parseInt(m[1],10)-1,true)});
    const m=location.hash.match(/#\/(\d+)/);if(m)idx=Math.max(0,Math.min(total-1,parseInt(m[1],10)-1));go(idx,true);
  });
})();