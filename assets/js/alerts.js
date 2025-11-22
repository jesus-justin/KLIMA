/* KLIMA Alerts Page Logic */

const listEl = document.getElementById('alerts-list');
const summaryEl = document.getElementById('alerts-summary');
const locSummaryEl = document.getElementById('summary-location');
const metrics = {
  total: document.getElementById('alerts-total'),
  extreme: document.getElementById('alerts-extreme'),
  severe: document.getElementById('alerts-severe'),
  moderate: document.getElementById('alerts-moderate'),
  minor: document.getElementById('alerts-minor')
};

function loadStoredLocation(){
  try {
    const raw = localStorage.getItem('klima:lastLocation');
    if (!raw) return null;
    const loc = JSON.parse(raw);
    if (loc && loc.lat && loc.lon) return loc;
  } catch(_) {}
  return null;
}

function severityClass(event){
  const e = event.toLowerCase();
  if (/hurricane|tornado|tsunami|extreme/.test(e)) return 'extreme';
  if (/storm|severe|warning|cyclone|typhoon/.test(e)) return 'severe';
  if (/watch|advisory|wind|rain|flood/.test(e)) return 'moderate';
  return 'minor';
}

function renderAlerts(data){
  listEl.innerHTML = '';
  const alerts = data.alerts || [];
  if (alerts.length === 0){
    listEl.innerHTML = '<div class="empty">No active weather alerts. Clear conditions. Enjoy your activities!</div>';
    summaryEl.textContent = 'No active alerts at this time.';
    Object.keys(metrics).forEach(k => metrics[k].textContent = '0');
    return;
  }
  const counts = {extreme:0,severe:0,moderate:0,minor:0};
  alerts.forEach(a => counts[a.severity] = (counts[a.severity]||0)+1);
  metrics.total.textContent = alerts.length.toString();
  metrics.extreme.textContent = counts.extreme.toString();
  metrics.severe.textContent = counts.severe.toString();
  metrics.moderate.textContent = counts.moderate.toString();
  metrics.minor.textContent = counts.minor.toString();
  summaryEl.textContent = `Extreme ${counts.extreme} • Severe ${counts.severe} • Moderate ${counts.moderate} • Minor ${counts.minor}`;  
  data.alerts.forEach(alert => {
    const div = document.createElement('div');
    div.className = `alert-item ${alert.severity}`;
    const start = alert.start ? new Date(alert.start*1000).toLocaleString([], { hour12:true }) : 'Now';
    const end = alert.end ? new Date(alert.end*1000).toLocaleString([], { hour12:true }) : 'Ongoing';
    div.innerHTML = `
      <h3>${alert.event} <span class="badge ${alert.severity}">${alert.severity}</span></h3>
      <div class="meta"><strong>Active:</strong> ${start} — ${end}</div>
      <div class="meta"><strong>Source:</strong> ${alert.sender} (${alert.source})</div>
      <div class="desc">${alert.description || 'No description provided.'}</div>
    `;
    listEl.appendChild(div);
  });
}

async function fetchAlerts(loc){
  listEl.innerHTML = '<div class="loader">Loading alerts...</div>';
  summaryEl.textContent = 'Fetching alerts...';
  try {
    const r = await fetch(`api/alerts.php?lat=${loc.lat}&lon=${loc.lon}`);
    if (!r.ok) throw new Error('HTTP '+ r.status);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    renderAlerts(data);
  } catch(e){
    listEl.innerHTML = `<div class=\"empty\" style=\"color:#dc2626\">Failed to load alerts: ${e.message}</div>`;
    summaryEl.textContent = 'Error loading alerts.';
  }
}

function init(){
  const loc = loadStoredLocation();
  if (!loc){
    listEl.innerHTML = '<div class="empty">No saved location. Go back and select a city first.</div>';
    summaryEl.textContent = 'No location selected.';
    if (locSummaryEl) locSummaryEl.textContent = '—';
    return;
  }
  if (locSummaryEl) locSummaryEl.textContent = `${loc.name}${loc.country ? ', ' + loc.country : ''}`;
  summaryEl.textContent = 'Loading alerts…';
  fetchAlerts(loc);
}

document.addEventListener('DOMContentLoaded', init);
