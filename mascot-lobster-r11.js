/* TBY chibi: horizontal patrol along the bottom of the viewport. */
(() => {
  'use strict';
  if (document.getElementById('tby-web-mascot')) return;
  const source = document.currentScript?.src || window.location.href;
  const duoPreview=document.currentScript?.dataset?.duoPreview==='true';
  const small = matchMedia('(max-width: 760px)');
  const mascot = document.createElement('div');
  mascot.id = 'tby-web-mascot';
  mascot.hidden = true;
  mascot.setAttribute('aria-hidden', 'true');
  const sprite = document.createElement('span');
  sprite.className = 'tby-mascot-sprite';
  mascot.append(sprite);
  document.body.append(mascot);
  const buddy = document.createElement('div');
  buddy.id='tby-mascot-buddy';buddy.hidden=true;buddy.setAttribute('aria-hidden','true');
  const buddySprite=document.createElement('span');buddySprite.className='tby-mascot-sprite';
  buddy.append(buddySprite);document.body.append(buddy);
  const shuttle=document.createElement('div');
  shuttle.id='tby-mascot-shuttle';shuttle.hidden=true;shuttle.setAttribute('aria-hidden','true');
  shuttle.innerHTML='<svg viewBox="0 0 32 24" width="26" height="20"><path d="M5 12 24 2 29 5 29 19 24 22Z" fill="white" stroke="#164a77" stroke-width="1.5"/><path d="m8 12 18-7M8 12h20M8 12l18 7" fill="none" stroke="#91b2c8"/><ellipse cx="6" cy="12" rx="4" ry="5" fill="#d6f56a" stroke="#164a77" stroke-width="1.5"/></svg>';
  document.body.append(shuttle);

  let x = 12, y = 12, facing = 0, gaitTime = 0;
  let ready = false, suspended = false, positioned = false;
  let frame = 0, timer = 0, route = null, last = null;
  let action = null, actionsReady = false, nextAction = 0;
  let scene=null,duoReady=false,restCount=0,nextDuo=duoPreview?1:3+Math.floor(Math.random()*2);
  const rallyURL=new URL('assets/tby-chibi-rally.png',source).href;
  const lobsterURL=new URL('assets/tby-chibi-lobster.png',source).href;
  let lobsterReady=false;
  const walkURL = new URL('assets/tby-chibi-walk.png',source).href;
  const actionURL = new URL('assets/tby-chibi-actions.png',source).href;
  const actions = [
    {row:0, sequence:[0,1,2,3,2,3,2,1,0], beat:210},
    {row:1, sequence:[0,1,2,3,2,3,2,1,0], beat:200},
    {row:2, sequence:[0,0,1,2,2,3,3], beat:140},
    {row:3, sequence:[0,0,1,1,2,2,2,1,3,3], beat:260}
  ];
  const size = () => small.matches ? 88 : 116;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function bounds() {
    const v = window.visualViewport;
    const width = v?.width || document.documentElement.clientWidth || innerWidth;
    const height = v?.height || document.documentElement.clientHeight || innerHeight;
    const left = v?.offsetLeft || 0, top = v?.offsetTop || 0;
    return { minX:left+12, maxX:left+Math.max(12,width-size()-12),
      minY:top+12, maxY:top+Math.max(12,height-size()-18) };
  }
  function pose(index = 1) {
    sprite.style.backgroundImage = `url("${walkURL}")`;
    sprite.style.backgroundSize = '400% 200%';
    // Separate left/right artwork keeps the TBY lettering readable.
    sprite.style.backgroundPosition = `${index * 100 / 3}% ${facing * 100}%`;
  }
  function place() {
    const b = bounds();
    x = clamp(x,b.minX,b.maxX); y = b.maxY;
    mascot.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
  }
  const available = () => ready && !suspended && !document.hidden;
  function stop() {
    cancelAnimationFrame(frame); clearTimeout(timer);
    frame = timer = 0; last = null; route = null; action = null;
    mascot.classList.remove('is-moving');
    mascot.classList.remove('is-acting');
    scene=null;buddy.hidden=true;shuttle.hidden=true;
    sprite.style.transform = '';
    pose();
  }
  function plan(delay = 1000 + Math.random() * 2200) {
    if (!available()) return;
    clearTimeout(timer);
    timer = setTimeout(walk,delay);
  }
  function act() {
    timer = 0;
    if (!available()) return;
    if (!actionsReady) {walk();return;}
    // Explicitly requested full animation: show all four gestures in turn.
    action = {...actions[nextAction],elapsed:0};
    nextAction = (nextAction+1)%actions.length;
    last = null;
    mascot.classList.add('is-acting');
    sprite.style.backgroundImage = `url("${actionURL}")`;
    sprite.style.backgroundSize = '400% 400%';
    sprite.style.backgroundPosition = `0% ${action.row*100/3}%`;
    frame = requestAnimationFrame(actionStep);
  }
  function actionStep(now) {
    frame = 0;
    if (!available() || !action) {stop();return;}
    action.elapsed += last===null ? 0 : Math.min(now-last,60);
    last = now;
    const index = Math.floor(action.elapsed/action.beat);
    if (index>=action.sequence.length) {
      stop();restCount++;
      if(duoReady && lobsterReady && restCount>=nextDuo) startDuo();else plan(450);
      return;
    }
    sprite.style.backgroundPosition = `${action.sequence[index]*100/3}% ${action.row*100/3}%`;
    frame = requestAnimationFrame(actionStep);
  }
  function step(now) {
    frame = 0;
    if (!available() || !route) {stop();return;}
    const delta = last===null ? 0 : Math.min(now-last,60);
    last = now; route.elapsed += delta;
    const u = Math.min(1,route.elapsed/route.duration);
    const ramp = Math.min(.2,800/route.duration);
    const eased = u<ramp ? u*u/(2*ramp*(1-ramp)) :
      u>1-ramp ? 1-(1-u)*(1-u)/(2*ramp*(1-ramp)) :
      (u-ramp/2)/(1-ramp);
    const nextX = route.sx+(route.ex-route.sx)*eased;
    x = nextX;
    // A steady gait clock keeps arms and legs active even near either edge.
    gaitTime += delta;
    const phase = gaitTime/640;
    pose(Math.floor(phase*4)%4);
    const bob = -Math.abs(Math.sin(phase*Math.PI*2))*1.4;
    sprite.style.transform = `translateY(${bob.toFixed(2)}px)`;
    place();
    if (u>=1) {
      stop();
      if(actionsReady) timer=setTimeout(act,250);
      else plan();
      return;
    }
    frame = requestAnimationFrame(step);
  }
  function walk() {
    timer = 0;
    if (!available()) return;
    place();
    const b = bounds();
    let ex = facing===0 ? b.maxX : b.minX;
    if(Math.abs(ex-x)<2) ex = facing===0 ? b.minX : b.maxX;
    const speed = small.matches ? 42 : 60;
    const remaining = Math.abs(ex-x);
    // Short routes ease to a natural stop mid-patrol; facing is preserved.
    const stretch = Math.min(speed*(3+Math.random()*3),
      (b.maxX-b.minX)*(.4+Math.random()*.2));
    if(actionsReady && remaining>stretch+speed*1.2) {
      ex=x+Math.sign(ex-x)*stretch;
    }
    const dx=ex-x,length=Math.abs(dx);
    if(length<2){plan(3000);return;}
    facing = dx < 0 ? 1 : 0;
    route={sx:x,ex,
      duration:Math.max(1900,length/speed*1000),elapsed:0};
    gaitTime=0;last=null;
    mascot.classList.add('is-moving');
    pose(0);
    frame=requestAnimationFrame(step);
  }
  function sync() {
    suspended=!!document.querySelector('dialog[open]') ||
      !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    mascot.hidden=!ready||suspended;
    if(!positioned){const b=bounds();x=b.minX;y=b.maxY;positioned=true;}
    place();
    if(!available()){stop();return;}
    if(scene && (scene.width!==bounds().maxX-bounds().minX || scene.size!==size())) stop();
    const b=bounds();
    if(route && (route.ex>b.maxX || route.sx>b.maxX || route.ex<b.minX || route.sx<b.minX)) stop();
    if(!frame&&!timer)plan(350);
  }
  function drawSprite(target,url,index,row,rows=2){
    target.style.backgroundImage=`url("${url}")`;
    target.style.backgroundSize=`400% ${rows*100}%`;
    target.style.backgroundPosition=`${index*100/3}% ${row*100/(rows-1)}%`;
    target.style.transform='';
  }
  function startDuo(){
    stop();if(!available()||!duoReady||!lobsterReady){plan();return;}
    const b=bounds(),span=b.maxX-b.minX;
    if(span<size()*1.35){plan();return;}
    const left=x<(b.minX+b.maxX)/2;
    const home=left?b.minX:b.maxX;
    const partner=home+(left?1:-1)*Math.min(span*.72,size()+250);
    const outside=left?b.maxX:b.minX;
    scene={phase:'corner',elapsed:0,start:x,home,partner,left,width:span,size:size(),
      outside,entryDuration:Math.max(1400,Math.min(6500,Math.abs(outside-partner)/90*1000)),
      duration:Math.max(800,Math.abs(home-x)/65*1000)};
    restCount=0;nextDuo=3+Math.floor(Math.random()*3);
    mascot.classList.add('is-moving');last=null;frame=requestAnimationFrame(duoStep);
  }
  function duoPhase(name){scene.phase=name;scene.elapsed=0;last=null;}
  function duoStep(now){
    frame=0;if(!available()||!scene){stop();return;}
    scene.elapsed+=last===null?0:Math.min(now-last,60);last=now;
    const d=scene,t=d.elapsed,s=size();
    if(d.phase==='corner'){
      const p=Math.min(1,t/d.duration),u=p*p*(3-2*p);
      x=d.start+(d.home-d.start)*u;facing=d.home<d.start?1:0;
      pose(Math.floor(t/160)%4);place();
      if(p===1){mascot.classList.remove('is-moving');mascot.classList.add('is-acting');duoPhase('invite');}
    }else if(d.phase==='invite'){
      drawSprite(sprite,actionURL,[0,1,2,3][Math.floor(t/180)%4],0,4);
      if(t>=1000){
        buddy.style.transform=`translate3d(${d.outside.toFixed(2)}px,${y.toFixed(2)}px,0)`;
        drawSprite(buddySprite,lobsterURL,0,d.left?1:0,4);
        buddy.style.opacity='0';buddy.hidden=false;duoPhase('enter');
      }
    }else if(d.phase==='enter'||d.phase==='leave'){
      const entering=d.phase==='enter',p=Math.min(1,t/d.entryDuration),u=p*p*(3-2*p);
      const bx=entering?d.outside+(d.partner-d.outside)*u:d.partner+(d.outside-d.partner)*u;
      buddy.style.opacity=String(entering?Math.min(1,p*5):Math.min(1,(1-p)*5));
      buddy.style.transform=`translate3d(${bx.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      drawSprite(buddySprite,lobsterURL,Math.floor(t/160)%4,entering?(d.left?1:0):(d.left?0:1),4);
      drawSprite(sprite,actionURL,Math.floor(t/200)%4,0,4);
      if(p===1){
        if(entering)buddy.style.opacity='1';
        if(entering){duoPhase('rally');}
        else {facing=d.left?0:1;stop();plan(600);return;}
      }
    }else if(d.phase==='rally'){
      const beat=900,hit=Math.floor(t/beat),p=(t%beat)/beat;
      const leftX=Math.min(d.home,d.partner),rightX=Math.max(d.home,d.partner);
      const from=leftX+s*.87,to=rightX+s*.13;
      const goRight=hit%2===0;
      const q=goRight?p:1-p;
      const sx=from+(to-from)*q,arc=Math.min(70,(to-from)*.36);
      const sy=y+s*.51-4*arc*p*(1-p);
      const angle=Math.atan2(-4*arc*(1-2*p),goRight?(to-from):-(to-from))*180/Math.PI+180;
      shuttle.style.transform=`translate3d(${(sx-13).toFixed(2)}px,${(sy-10).toFixed(2)}px,0) rotate(${angle.toFixed(1)}deg)`;
      shuttle.hidden=false;
      const outgoing=p<.14?2:p<.3?3:0,incoming=p>.78?1:0;
      drawSprite(sprite,rallyURL,(goRight===d.left)?outgoing:incoming,d.left?0:1);
      const buddyFrame=(goRight===d.left)?incoming:outgoing;
      drawSprite(buddySprite,lobsterURL,buddyFrame===3?2:buddyFrame,d.left?3:2,4);
      buddy.style.transform=`translate3d(${d.partner.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      if(t>=beat*8){shuttle.hidden=true;duoPhase('leave');}
    }
    frame=requestAnimationFrame(duoStep);
  }
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('focusin',sync);
  document.addEventListener('focusout',()=>queueMicrotask(sync));
  window.addEventListener('resize',sync,{passive:true});
  window.addEventListener('pageshow',sync);
  window.addEventListener('pagehide',stop);
  window.visualViewport?.addEventListener('resize',sync,{passive:true});
  window.visualViewport?.addEventListener('scroll',sync,{passive:true});
  new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  const sheet = new Image();
  sheet.onload=()=>{
    if(sheet.naturalWidth<4||sheet.naturalHeight<2)return;
    sprite.style.backgroundImage=`url("${sheet.src}")`;
    ready=true;sync();
  };
  sheet.onerror=()=>{stop();ready=false;mascot.hidden=true;};
  sheet.src=walkURL;
  const actionSheet = new Image();
  actionSheet.onload=()=>{actionsReady=actionSheet.naturalWidth>=4 && actionSheet.naturalHeight>=4;};
  actionSheet.onerror=()=>{actionsReady=false;};
  actionSheet.src=actionURL;
  const rallySheet=new Image();
  rallySheet.onload=()=>{duoReady=rallySheet.naturalWidth>=4&&rallySheet.naturalHeight>=2;};
  rallySheet.onerror=()=>{duoReady=false;};
  rallySheet.src=rallyURL;
  const lobsterSheet=new Image();
  lobsterSheet.onload=()=>{lobsterReady=lobsterSheet.naturalWidth>=4&&lobsterSheet.naturalHeight>=4;};
  lobsterSheet.onerror=()=>{lobsterReady=false;};
  lobsterSheet.src=lobsterURL;
})();
