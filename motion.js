/* TBY — chuyển cảnh mượt khi cuộn (kiểu Morph của PowerPoint)
   Ý tưởng: 2 hình (tròn xanh lá + khung xanh dương, lấy từ logo) nằm cố định phía sau.
   Mỗi phần của trang là một "slide" với vị trí/kích cỡ/màu riêng; khi cuộn qua ranh giới
   giữa 2 phần, hình + màu nền + màu chữ được nội suy mượt sang slide kế tiếp. */
(()=>{
  'use strict';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const smooth=t=>t*t*(3-2*t);
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));

  /* Mỗi keyframe: fill=[x vw, y vh, w vmin, h vmin, bo góc %, xoay°, độ đậm, màu]
                    line=[... như trên, + độ đậm vạch sân, màu]  */
  const GREEN='#10a94f',BLUE='#0759ad',NAVY='#061b33',WHITE='#ffffff';
  const K=[
    {id:'heroSection',     bg:NAVY,      fg:WHITE, f:[78,48,64,64,50,0,1,GREEN],      l:[22,82,90,90,50,0,.22,0,WHITE]},
    {id:'keo',             bg:'#eef3f8', fg:NAVY,  f:[95,46,28,28,50,0,.9,GREEN],      l:[50,55,150,92,2,0,.14,1,BLUE]},
    {id:'tra-cuu-dang-ky', bg:'#dce8f4', fg:NAVY,  f:[12,70,40,40,50,0,.95,GREEN],     l:[88,26,56,56,50,0,.25,0,BLUE]},
    {id:'video',           bg:NAVY,      fg:WHITE, f:[50,50,46,82,9,0,.45,BLUE],       l:[50,50,64,104,9,-6,.5,0,GREEN]},
    {id:'noiquy',          bg:BLUE,      fg:WHITE, f:[92,18,58,58,50,0,.9,GREEN],      l:[8,86,110,110,50,0,.22,1,WHITE]},
    {id:'lien-he',         bg:NAVY,      fg:WHITE, f:[50,52,80,80,50,0,1,GREEN],       l:[50,52,112,112,50,0,.25,0,WHITE]},
  ].map(k=>({id:k.id,v:[...k.f.slice(0,7),...hex(k.f[7]),...k.l.slice(0,7),k.l[7],...hex(k.l[8]),...hex(k.bg),...hex(k.fg)]}));
  const N=K.length, L=K[0].v.length;

  const secs=K.map(k=>document.getElementById(k.id));
  if(secs.some(s=>!s)) return;
  const fillEl=$('.m-fill'), lineEl=$('.m-line'), rootEl=document.documentElement;
  const topbar=$('#topbar'), bar=$('#scrollBar'), heroIn=$('#heroInner');
  const nav=$('#mainNav'), pill=$('#navPill'), links=$$('#mainNav a');
  const rgb=(a,i)=>`rgb(${a[i]|0},${a[i+1]|0},${a[i+2]|0})`;

  /* ----- Tiêu đề: tách thành dòng có mặt nạ, trồi lên khi vào màn hình ----- */
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.35});
  $$('h2[data-split]').forEach(h=>{h.innerHTML=`<span class="ln"><span>${h.innerHTML}</span></span>`;io.observe(h);});

  /* ----- Các khối có tiến độ cuộn --p (thẻ kèo, video, nội quy... được vẽ sau bởi app.js) ----- */
  const SEL='.event-card,.lookup-card,.video-card,.rule-grid article,.follow-inner';
  let items=[], scanQueued=false;
  const scan=()=>{scanQueued=false;$$(SEL).forEach(el=>{if(!('sl' in el.dataset))el.dataset.sl='';});items=$$('[data-sl]');dirty=true;};
  const queueScan=()=>{if(!scanQueued){scanQueued=true;requestAnimationFrame(scan);}};
  new MutationObserver(queueScan).observe($('main'),{childList:true,subtree:true});

  /* ----- Vòng lặp chính ----- */
  let cur=null, last=performance.now(), lastY=-1, dirty=true, activeIdx=-1;
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000); last=now;
    const y=scrollY, vh=innerHeight;
    const moved=y!==lastY; lastY=y;

    /* f = vị trí phân số giữa các slide; mỗi ranh giới chạy trong 60% chiều cao màn hình */
    let f=0;
    for(let k=0;k<N-1;k++){
      const top=secs[k+1].getBoundingClientRect().top;
      f+=smooth(clamp((vh*.92-top)/(vh*.6)));
    }
    const i=Math.min(Math.floor(f),N-2), t=f-i;
    const A=K[i].v,B=K[i+1].v,tgt=new Array(L);
    const tf=smooth(clamp((t-.35)/.3));          /* chữ đổi màu nhanh quanh giữa chặng */
    for(let j=0;j<L;j++){const u=j>=24?tf:t;tgt[j]=A[j]+(B[j]-A[j])*u;}
    if(!cur)cur=tgt.slice();
    const a=reduce?1:1-Math.exp(-dt*9);   /* làm mượt thêm để chuyển động có quán tính */
    let diff=0;
    for(let j=0;j<L;j++){const d=tgt[j]-cur[j];cur[j]+=d*a;diff=Math.max(diff,Math.abs(d));}

    if(moved||diff>.01||dirty){
      dirty=false;
      const c=cur;
      fillEl.style.cssText=`width:${c[2]}vmin;height:${c[3]}vmin;border-radius:${c[4]}%;opacity:${c[6]};background:${rgb(c,7)};`+
        `transform:translate3d(${c[0]}vw,${c[1]}vh,0) translate(-50%,-50%) rotate(${c[5]}deg)`;
      lineEl.style.cssText=`width:${c[12]}vmin;height:${c[13]}vmin;border-radius:${c[14]}%;opacity:${c[16]};--ln:${c[17]};color:${rgb(c,18)};border-color:${rgb(c,18)};`+
        `transform:translate3d(${c[10]}vw,${c[11]}vh,0) translate(-50%,-50%) rotate(${c[15]}deg)`;
      rootEl.style.setProperty('--bg',rgb(c,21));
      rootEl.style.setProperty('--fg',rgb(c,24));

      /* thanh trên cùng + tiến độ cuộn */
      topbar.classList.toggle('scrolled',y>30);
      bar.style.transform=`scaleX(${clamp(y/Math.max(1,document.documentElement.scrollHeight-vh))})`;

      /* hero trôi lên, mờ và nhòe dần khi cuộn đi */
      const hp=clamp(y/(vh*.7));
      heroIn.style.transform=`translate3d(0,${y*.2}px,0) scale(${1-.08*hp})`;
      heroIn.style.opacity=1-hp;

      /* tiến độ --p của từng khối */
      for(const el of items){
        const r=el.getBoundingClientRect();
        if(r.bottom<-300||r.top>vh+300)continue;
        const p=smooth(clamp((vh*.97-r.top)/(vh*.5)));
        el.style.setProperty('--p',p.toFixed(3));
      }

      /* viên thuốc trượt theo mục đang xem */
      const idx=Math.round(f);
      if(idx!==activeIdx){
        activeIdx=idx;
        const link=links.find(l=>l.getAttribute('href')==='#'+K[idx].id);
        links.forEach(l=>l.classList.toggle('active',l===link));
        if(link){pill.style.opacity=1;pill.style.left=link.offsetLeft+'px';pill.style.width=link.offsetWidth+'px';}
        else pill.style.opacity=0;
      }
    }
    requestAnimationFrame(frame);
  }

  addEventListener('resize',()=>{dirty=true;activeIdx=-1;},{passive:true});
  addEventListener('load',()=>{dirty=true;});
  scan();
  requestAnimationFrame(frame);
})();
