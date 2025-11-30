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

// Dynamic UI references
const severityTimelineEl = document.getElementById('severity-timeline');
const filterCounts = {
  all: document.getElementById('filter-count-all'),
  extreme: document.getElementById('filter-count-extreme'),
  severe: document.getElementById('filter-count-severe'),
  moderate: document.getElementById('filter-count-moderate'),
  minor: document.getElementById('filter-count-minor')
};
const filterChips = () => Array.from(document.querySelectorAll('.alerts-filters .chip'));

// Cache & state
let _allAlerts = [];
let _activeFilter = 'all';

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
  _allAlerts = alerts;
  if (alerts.length === 0){
    listEl.innerHTML = '<div class="empty">No active weather alerts. Clear conditions. Enjoy your activities!</div>';
    summaryEl.textContent = 'No active alerts at this time.';
    Object.keys(metrics).forEach(k => metrics[k].textContent = '0');
    Object.keys(filterCounts).forEach(k => filterCounts[k].textContent = '0');
    if (severityTimelineEl) severityTimelineEl.innerHTML = '';
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
  // Update chip counts
  filterCounts.all.textContent = alerts.length.toString();
  filterCounts.extreme.textContent = counts.extreme.toString();
  filterCounts.severe.textContent = counts.severe.toString();
  filterCounts.moderate.textContent = counts.moderate.toString();
  filterCounts.minor.textContent = counts.minor.toString();
  renderSeverityTimeline(counts, alerts.length);
  renderFilteredAlerts();
  attachExpansionHandlers();
}

function renderSeverityTimeline(counts,total){
  if (!severityTimelineEl) return;
  if (total === 0){severityTimelineEl.innerHTML='';return;}
  const segs = ['extreme','severe','moderate','minor'].filter(s=>counts[s]>0);
  severityTimelineEl.innerHTML = segs.map(sev => {
    const pct = (counts[sev]/total)*100;
    return `<div class="seg ${sev}" style="flex:${counts[sev]}" aria-label="${sev} ${counts[sev]} (${pct.toFixed(0)}%)"><span>${pct.toFixed(0)}%</span></div>`;
  }).join('');
}

function renderFilteredAlerts(){
  listEl.innerHTML = '';
  const subset = _activeFilter === 'all' ? _allAlerts : _allAlerts.filter(a => a.severity === _activeFilter);
  if (subset.length === 0){
    listEl.innerHTML = '<div class="empty">No alerts for selected filter.</div>';
    return;
  }
  subset.forEach(alert => {
    const div = document.createElement('div');
    div.className = `alert-item ${alert.severity}`;
    const start = alert.start ? new Date(alert.start*1000).toLocaleString([], { hour12:true }) : 'Now';
    const end = alert.end ? new Date(alert.end*1000).toLocaleString([], { hour12:true }) : 'Ongoing';
    const fullDesc = alert.description || 'No description provided.';
    const shortDesc = fullDesc.length > 180 ? fullDesc.slice(0,180).trim() + '…' : fullDesc;
    div.innerHTML = `
      <h3>${alert.event} <span class="badge ${alert.severity}">${alert.severity}</span> <span class="toggle-arrow" aria-hidden="true">▼</span></h3>
      <div class="meta"><strong>Active:</strong> ${start} — ${end}</div>
      <div class="meta"><strong>Source:</strong> ${alert.sender} (${alert.source})</div>
      <div class="desc" data-full="${escapeHtml(fullDesc)}" data-short="${escapeHtml(shortDesc)}">${shortDesc}</div>
    `;
    listEl.appendChild(div);
  });
}

function attachExpansionHandlers(){
  listEl.querySelectorAll('.alert-item h3').forEach(h => {
    h.addEventListener('click', () => {
      const parent = h.parentElement;
      const desc = parent.querySelector('.desc');
      if (!desc) return;
      const expanded = parent.classList.toggle('expanded');
      desc.textContent = expanded ? desc.dataset.full : desc.dataset.short;
      if (expanded){
        desc.style.maxHeight = desc.scrollHeight + 'px';
      } else {
        desc.style.maxHeight = '0px';
      }
    });
  });
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function initFilters(){
  filterChips().forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips().forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed','false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed','true');
      _activeFilter = chip.dataset.filter;
      renderFilteredAlerts();
      attachExpansionHandlers();
    });
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
  initFilters();
  fetchAlerts(loc);
}

document.addEventListener('DOMContentLoaded', init);
