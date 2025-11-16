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
    el.addEventListener('click', ()=>{
      el.classList.add('pull');
      toggleTheme();
    });
    el.addEventListener('animationend', ()=>{
      el.classList.remove('pull');
    });
  }

  // Setup any bulb toggles on the page
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('#bulb-toggle').forEach(setupBulb);
  });
})();
