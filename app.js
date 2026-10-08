(() => {
  'use strict';
  const root = document.documentElement;
  const story = document.querySelector('.story');
  const screen = document.querySelector('.story-screen');
  const stage = document.querySelector('.dental-stage');
  const scenes = Array.from(document.querySelectorAll('[data-scene]'));
  const sceneButtons = Array.from(document.querySelectorAll('[data-scene-link]'));
  const sceneTracks = Array.from(document.querySelectorAll('.scene-track i'));
  const mobile = matchMedia('(max-width:760px)');
  const reducePreference = matchMedia('(prefers-reduced-motion:reduce)');
  const motionButton = document.querySelector('.motion-control');
  let stored = null;
  try { stored = localStorage.getItem('sonrisa-total-motion'); } catch (_) {}
  let reduced = stored === 'off' || (stored === null && reducePreference.matches);
  let frame = false, activeScene = -1;
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const span = (x,a,b) => clamp((x-a)/(b-a));
  const ease = x => x*x*(3-2*x);
  const progress = document.querySelector('.page-progress');
  const portrait = document.querySelector('.portrait-wrap');
  const portraitImage = portrait.querySelector('img');
  const background = document.querySelector('.scene-background');

  function selectScene(index) {
    if (index === activeScene) return;
    activeScene=index;
    scenes.forEach((scene,i) => {
      scene.inert=i!==index;
      scene.setAttribute('aria-hidden',String(i!==index));
      scene.style.pointerEvents=i===index ? 'auto':'none';
    });
    sceneButtons.forEach((button,i) => {
      button.classList.toggle('active',i===index);
      if (i===index) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
    });
  }
  function update() {
    frame=false;
    const y=window.scrollY, vh=window.innerHeight;
    const travel=Math.max(1,story.offsetHeight-screen.offsetHeight);
    const p=clamp((y-story.offsetTop)/travel);
    const documentTravel=document.documentElement.scrollHeight-vh;
    progress.style.transform=`scaleX(${documentTravel>0 ? clamp(y/documentTravel):0})`;
    if (!reduced) {
      const entry=ease(span(p,.18,.38)), exit=ease(span(p,.58,.79));
      const opacity=[1-ease(span(p,.16,.28)),ease(span(p,.3,.4))*(1-ease(span(p,.57,.68))),ease(span(p,.7,.82))];
      selectScene(p<.3 ? 0 : p<.7 ? 1:2);
      scenes.forEach((scene,i)=>{
        scene.style.opacity=opacity[i].toFixed(3);
        scene.style.transform=`translateY(${(1-opacity[i])*(i===0 ? -28:25)}px)`;
      });
      if (mobile.matches) {
        const entered=ease(span(p,.18,.36));
        const px=entered*23-exit*2;
        const py=entered*21-exit*1;
        const scale=1-entered*.49+exit*.03;
        stage.style.transform=`translate(calc(-50% + ${px}vw),calc(-50% + ${py}vh)) rotate(${entry*17-exit*28}deg) scale(${scale})`;
      } else {
        const x=entry*22-exit*45;
        const scale=1+entry*.18-exit*.1;
        stage.style.transform=`translate(calc(-50% + ${x}vw),calc(-50% - ${entry*9}vh)) rotate(${entry*17-exit*31}deg) scale(${scale})`;
      }
      background.style.transform=`translateX(${p*-4}%) scale(${1+p*.07})`;
      sceneTracks[0].style.transform=`scaleX(${span(p,0,.48)})`;
      sceneTracks[1].style.transform=`scaleX(${span(p,.48,.95)})`;
      const rect=portrait.getBoundingClientRect();
      if (rect.top<vh && rect.bottom>0) portraitImage.style.transform=`translateY(${(clamp((vh-rect.top)/(vh+rect.height))-.5)*9}%)`;
    } else {
      selectScene(0); scenes[0].style.opacity='1';
    }
  }
  function requestUpdate() { if (!frame) { frame=true;requestAnimationFrame(update); } }
  function applyMotion() {
    root.classList.toggle('reduced',reduced);
    motionButton.setAttribute('aria-pressed',String(reduced));
    motionButton.setAttribute('aria-label',reduced?'Activar efectos':'Pausar efectos');
    motionButton.querySelector('.motion-text').textContent=reduced?'Activar efectos':'Pausar efectos';
    requestUpdate();
  }
  motionButton.addEventListener('click',()=>{
    const inside=scrollY<story.offsetTop+story.offsetHeight;
    reduced=!reduced;stored=reduced?'off':'on';
    try {localStorage.setItem('sonrisa-total-motion',stored);} catch (_) {}
    applyMotion();
    if(inside) window.scrollTo({top:story.offsetTop,behavior:'instant'});
  });
  reducePreference.addEventListener('change',event=>{if(stored===null){reduced=event.matches;applyMotion();}});
  sceneButtons.forEach(button=>button.addEventListener('click',()=>{
    const positions=[0,.49,.93];
    const destination=story.offsetTop+positions[Number(button.dataset.sceneLink)]*(story.offsetHeight-screen.offsetHeight);
    window.scrollTo({top:destination,behavior:reduced?'instant':'smooth'});
  }));

  const tabs=Array.from(document.querySelectorAll('[data-care]'));
  const panels=Array.from(document.querySelectorAll('[role=tabpanel]'));
  function selectTab(index,focus=false) {
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    panels.forEach((panel,i)=>{panel.hidden=i!==index;panel.classList.toggle('active',i===index);});
    if(focus) tabs[index].focus();
    requestUpdate();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>selectTab(i));
    tab.addEventListener('keydown',event=>{
      let target=null;
      if(event.key==='ArrowDown'||event.key==='ArrowRight')target=(i+1)%tabs.length;
      if(event.key==='ArrowUp'||event.key==='ArrowLeft')target=(i-1+tabs.length)%tabs.length;
      if(event.key==='Home')target=0;
      if(event.key==='End')target=tabs.length-1;
      if(target!==null){event.preventDefault();selectTab(target,true);}
    });
  });
  const menuToggle=document.querySelector('.menu-toggle');
  const menu=document.querySelector('#mobile-nav');
  function toggleMenu(open) {
    menu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
    document.body.classList.toggle('menu-open',open);
  }
  menuToggle.addEventListener('click',()=>toggleMenu(menu.hidden));
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>toggleMenu(false)));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu.hidden){toggleMenu(false);menuToggle.focus();}
    if(event.key==='Tab'&&!menu.hidden){
      const last=menu.querySelector('a:last-child');
      if(event.shiftKey&&document.activeElement===menuToggle){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();menuToggle.focus();}
    }
  });
  mobile.addEventListener('change',()=>{toggleMenu(false);requestUpdate();});
  const pointer=document.querySelector('.arch-pointer');
  let pointerFrame=false, pointerX=0,pointerY=0;
  screen.addEventListener('pointermove',event=>{
    if(reduced||mobile.matches||event.pointerType==='touch')return;
    pointerX=(event.clientX/innerWidth-.5)*12;pointerY=(event.clientY/innerHeight-.5)*-9;
    if(!pointerFrame){pointerFrame=true;requestAnimationFrame(()=>{pointer.style.transform=`perspective(900px) rotateX(${pointerY}deg) rotateY(${pointerX}deg)`;pointerFrame=false;});}
  },{passive:true});
  screen.addEventListener('pointerleave',()=>{pointer.style.transform='none';});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.09,rootMargin:'0px 0px -15px 0px'});
    document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));
    root.classList.add('js');
  }
  document.querySelectorAll('details').forEach(detail=>detail.addEventListener('toggle',requestUpdate));
  document.querySelector('#year').textContent=String(new Date().getFullYear());
  window.addEventListener('scroll',requestUpdate,{passive:true});
  window.addEventListener('resize',requestUpdate,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestUpdate();});
  applyMotion();update();
})();
