(function(){
  const THEME_KEY = 'klima_theme';
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const saved = localStorage.getItem(THEME_KEY);
  const initial = saved || (prefersLight ? 'light' : 'dark');
  const root = document.documentElement;
  if(initial === 'light') root.setAttribute('data-theme','light');

  function toggleTheme(){
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    root.setAttribute('data-theme', next === 'light' ? 'light' : 'dark');
    localStorage.setItem(THEME_KEY, next);
  }

  function setupBulb(el){
    if(!el) return;
    const line = el.querySelector('.rope-line');
    const knob = el.querySelector('.rope-knob');
    let dragging = false;
    let startY = 0;
    let dist = 0;
    const MAX_PULL = 30; // px
    const TOGGLE_THRESHOLD = 12; // px
    const CLICK_THRESHOLD = 4; // px

    function apply(d){
      if(line) line.style.transform = `scaleY(${1 + d/28})`;
      if(knob) knob.style.transform = `translateY(${d}px)`;
    }
    function reset(){
      if(line) line.style.transform = '';
      if(knob) knob.style.transform = '';
    }

    function startDrag(e){
      dragging = true;
      startY = (e.touches ? e.touches[0].clientY : e.clientY);
      dist = 0;
      el.classList.remove('pull','sway','sway-weak','sway-strong');
    }
    function moveDrag(e){
      if(!dragging) return;
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      dist = Math.max(0, Math.min(MAX_PULL, y - startY));
      apply(dist);
      if(e.cancelable) e.preventDefault();
    }
    function endDrag(){
      if(!dragging) return;
      dragging = false;
      // Decide action
      if(dist <= CLICK_THRESHOLD){
        // Treat as click pull
        el.classList.add('pull');
        toggleTheme();
      } else {
        if(dist >= TOGGLE_THRESHOLD){
          toggleTheme();
        }
        // Sway amplitude based on pull distance
        el.classList.remove('sway','sway-weak','sway-strong');
        if(dist < 10) el.classList.add('sway-weak');
        else if(dist > 22) el.classList.add('sway-strong');
        else el.classList.add('sway');
      }
      // Recoil back to rest using CSS transitions
      reset();
      dist = 0;
    }

    // Pointer/touch interactions
    el.addEventListener('pointerdown', (e)=>{ startDrag(e); el.setPointerCapture && el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', moveDrag);
    el.addEventListener('pointerup', (e)=>{ endDrag(); el.releasePointerCapture && el.releasePointerCapture(e.pointerId); });
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('touchstart', startDrag, {passive:false});
    el.addEventListener('touchmove', moveDrag, {passive:false});
    el.addEventListener('touchend', endDrag);

    // Keyboard accessibility
    el.setAttribute('tabindex','0');
    el.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        el.classList.add('pull');
        toggleTheme();
      }
    });

    // Cleanup animation classes after completion
    el.addEventListener('animationend', (e)=>{
      if(e.animationName === 'knob-pull'){
        el.classList.remove('pull');
      }
      if(e.animationName.startsWith('bulb-sway')){
        el.classList.remove('sway','sway-weak','sway-strong');
      }
    });
  }

  // Setup any bulb toggles on the page
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('#bulb-toggle').forEach(setupBulb);
  });
})();
