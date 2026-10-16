/* TBY chibi: horizontal patrol along the bottom of the viewport. */
(() => {
  'use strict';
  if (document.getElementById('tby-web-mascot')) return;
  const source = document.currentScript?.src || window.location.href;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 760px)');
  const mascot = document.createElement('div');
  mascot.id = 'tby-web-mascot';
  mascot.hidden = true;
  mascot.setAttribute('aria-hidden', 'true');
  const sprite = document.createElement('span');
  sprite.className = 'tby-mascot-sprite';
  mascot.append(sprite);
  document.body.append(mascot);

  let x = 12, y = 12, facing = 0, distanceWalked = 0;
  let ready = false, suspended = false, positioned = false;
  let frame = 0, timer = 0, route = null, last = null;
  let action = null, actionsReady = false, walksSinceAction = 1;
  let actionBag = [];
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
    if (!available() || reduced.matches) return;
    if (!actionsReady) {walk();return;}
    // Show every gesture before refilling the shuffled bag.
    if (!actionBag.length) {
      actionBag = [0,1,2,3];
      for (let i=3;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [actionBag[i],actionBag[j]]=[actionBag[j],actionBag[i]];
      }
    }
    action = {...actions[actionBag.shift()],elapsed:0};
    walksSinceAction = 0; last = null;
    mascot.classList.add('is-acting');
    sprite.style.backgroundImage = `url("${actionURL}")`;
    sprite.style.backgroundSize = '400% 400%';
    sprite.style.backgroundPosition = `0% ${action.row*100/3}%`;
    frame = requestAnimationFrame(actionStep);
  }
  function actionStep(now) {
    frame = 0;
    if (!available() || reduced.matches || !action) {stop();return;}
    action.elapsed += last===null ? 0 : Math.min(now-last,60);
    last = now;
    const index = Math.floor(action.elapsed/action.beat);
    if (index>=action.sequence.length) {stop();plan(1100);return;}
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
    distanceWalked += Math.abs(nextX-x);
    x = nextX;
    const phase = distanceWalked/(size()*.31);
    pose(Math.floor(phase*4)%4);
    const bob = reduced.matches ? 0 : -Math.abs(Math.sin(phase*Math.PI*2))*1.4;
    sprite.style.transform = `translateY(${bob.toFixed(2)}px)`;
    place();
    if (u>=1) {
      stop(); walksSinceAction++;
      if(actionsReady && !reduced.matches && walksSinceAction>=2) timer=setTimeout(act,650);
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
    const dx=ex-x,length=Math.abs(dx);
    if(length<2){plan(3000);return;}
    facing = dx < 0 ? 1 : 0;
    route={sx:x,ex,
      duration:Math.max(1900,length/(reduced.matches?24:small.matches?42:60)*1000),elapsed:0};
    distanceWalked=0;last=null;
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
    const b=bounds();
    if(route && (route.ex>b.maxX || route.sx>b.maxX || route.ex<b.minX || route.sx<b.minX)) stop();
    if(action && reduced.matches) stop();
    if(!frame&&!timer)plan(350);
  }
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('focusin',sync);
  document.addEventListener('focusout',()=>queueMicrotask(sync));
  window.addEventListener('resize',sync,{passive:true});
  window.addEventListener('pageshow',sync);
  window.addEventListener('pagehide',stop);
  window.visualViewport?.addEventListener('resize',sync,{passive:true});
  window.visualViewport?.addEventListener('scroll',sync,{passive:true});
  reduced.addEventListener('change',sync);
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
})();
