// KLIMA Performance Metrics (LCP, CLS, FID/TTFB)
(function(){
  const perf = {
    lcp: null,
    cls: 0,
    fid: null,
    ttfb: null
  };

  function save(){
    try {
      localStorage.setItem('klima:perf', JSON.stringify({
        ts: Date.now(),
        metrics: perf
      }));
    } catch(_) {}
  }

  // Largest Contentful Paint
  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        perf.lcp = Math.round(lastEntry.startTime);
        console.info('[KLIMA] LCP:', perf.lcp, 'ms');
        save();
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch(_) {}

  // Cumulative Layout Shift
  try {
    let sessionValue = 0;
    let sessionEntries = [];
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
          perf.cls = Number(sessionValue.toFixed(3));
          console.info('[KLIMA] CLS:', perf.cls);
          save();
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch(_) {}

  // First Input Delay
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const e = entries[0];
        perf.fid = Math.round(e.processingStart - e.startTime);
        console.info('[KLIMA] FID:', perf.fid, 'ms');
        save();
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch(_) {}

  // Time To First Byte (from navigation timing)
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      perf.ttfb = Math.round(nav.responseStart);
      console.info('[KLIMA] TTFB:', perf.ttfb, 'ms');
      save();
    }
  } catch(_) {}

  // Expose a helper to read metrics
  window.KlimaPerformance = {
    get: () => ({ ...perf })
  };
})();
