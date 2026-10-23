document.documentElement.classList.add('js');
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const WA='96871187704'; // Rinad's WhatsApp (Oman +968)
const T=['10:00','12:00','14:00','16:00','18:00'];
const G=[['natural nails',[['gel polish',6],['gel polish + design',10],['gel + design + 3D',13],['removal',4]]],
['plastic extension',[['extension + gel',9],['extension + gel + design',13],['extension + gel + design + 3D',15],['removal',4]]],
['gel x',[['gel x + gel polish',13],['gel x + design',15],['gel x + design + 3D',18],['removal',4]]],
['refill',[['builder gel refill',15],['builder gel refill + design',18],['gel x refill',13],['gel x refill + design',15]]]];
document.querySelectorAll('.tz').forEach(t=>t.querySelectorAll('.rv').forEach((c,i)=>c.style.setProperty('--d',i*.15+'s')));
document.querySelectorAll('.pol,.pks,.gal').forEach(g=>[...g.children].forEach((c,i)=>{c.classList.add('rv');c.style.setProperty('--d',i*.12+'s')}));
const flow=()=>{const vh=innerHeight;document.querySelectorAll('.rv').forEach(el=>{if(!el.offsetParent)return;el.style.setProperty('--p',Math.min(1,Math.max(0,(vh*1.02-el.getBoundingClientRect().top)/(vh*.22))).toFixed(3))})};
addEventListener('scroll',flow,{passive:true});addEventListener('resize',flow);addEventListener('load',flow);requestAnimationFrame(flow);
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="/"]');if(!a||a.target||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();document.body.classList.add('out');setTimeout(()=>location.href=a.href,450)});
addEventListener('pageshow',e=>{if(e.persisted)document.body.classList.remove('out')});
if($('.hero')){
 const h=$('.hero'),mk=$('.mark'),cu=$('.curtain'),sb=$('.sub'),hb=$('.hbg');
 const tick=()=>{const r=h.getBoundingClientRect(),p=Math.min(1,Math.max(0,-r.top/(h.offsetHeight-innerHeight))),q=Math.min(1,Math.max(0,(p-.4)/.6));
  mk.style.setProperty('--ls',(-.02+p*.3)+'em');mk.style.opacity=Math.max(0,1-q*1.8);mk.style.transform='translateY('+(-q*10)+'vh) scale('+(1-p*.25)+')';
  cu.style.transform='translateY('+(1-q)*100+'%)';sb.style.opacity=Math.max(0,1-p*3);if(hb)hb.style.transform='scale('+(1.12-p*.1)+')'};
 addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);tick();
}
