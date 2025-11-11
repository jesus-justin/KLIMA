/* Compare page logic */

const state = {
  location: null,
  sources: {}
};

function loadLocation() {
  try {
    const raw = localStorage.getItem('klima:lastLocation');
    if (!raw) {
      document.getElementById('compare-location').textContent = 'No location selected';
      return null;
    }
    const loc = JSON.parse(raw);
    document.getElementById('compare-location').textContent = loc.name + (loc.country ? ', ' + loc.country : '');
    return loc;
  } catch(_) {
    return null;
  }
}

async function fetchAll(loc) {
  // OpenWeather
  try {
    const r = await fetch(`api/weather.php?lat=${loc.lat}&lon=${loc.lon}&units=metric`);
    const data = await r.json();
    if (!data.error) {
      state.sources.openweather = data;
      renderOpenWeather(data);
    }
  } catch(e) {
    document.getElementById('ow-data').innerHTML = '<div class="error">Failed to load</div>';
  }
  
  // Open-Meteo
  try {
    const r = await fetch(`api/weather_free.php?lat=${loc.lat}&lon=${loc.lon}&units=metric`);
    const data = await r.json();
    if (!data.error) {
      state.sources.openmeteo = data;
      renderOpenMeteo(data);
    }
  } catch(e) {
    document.getElementById('om-data').innerHTML = '<div class="error">Failed to load</div>';
  }
  
  // PAGASA (only if Philippines)
  if (loc.country && (loc.country.toUpperCase() === 'PH' || loc.country.toUpperCase() === 'PHILIPPINES')) {
    document.getElementById('pagasa-card').style.display = 'block';
    try {
      const region = loc.name.toLowerCase().includes('manila') ? 'metro-manila' : 'metro-manila';
      const r = await fetch(`api/pagasa.php?region=${region}`);
      const data = await r.json();
      state.sources.pagasa = data;
      renderPAGASA(data);
    } catch(e) {
      document.getElementById('pagasa-data').innerHTML = '<div class="error">Failed to load PAGASA data</div>';
    }
  }
}

function renderOpenWeather(data) {
  const c = data.current;
  const html = `
    <div class="metric"><span>Current Temp</span><strong>${Math.round(c.temp)}°C</strong></div>
    <div class="metric"><span>Feels Like</span><strong>${Math.round(c.feels_like)}°C</strong></div>
    <div class="metric"><span>Humidity</span><strong>${c.humidity}%</strong></div>
    <div class="metric"><span>Wind</span><strong>${c.wind_speed} m/s</strong></div>
    <div class="metric"><span>Description</span><strong>${c.weather?.[0]?.description || '—'}</strong></div>
    <div class="metric"><span>Source</span><strong>OpenWeather API</strong></div>
  `;
  document.getElementById('ow-data').innerHTML = html;
}

function renderOpenMeteo(data) {
  const c = data.current;
  const html = `
    <div class="metric"><span>Current Temp</span><strong>${Math.round(c.temp)}°C</strong></div>
    <div class="metric"><span>Feels Like</span><strong>${Math.round(c.feels_like)}°C</strong></div>
    <div class="metric"><span>Humidity</span><strong>${c.humidity}%</strong></div>
    <div class="metric"><span>Wind</span><strong>${c.wind_speed} m/s</strong></div>
    <div class="metric"><span>Description</span><strong>${c.weather?.[0]?.description || '—'}</strong></div>
    <div class="metric"><span>Source</span><strong>Open-Meteo</strong></div>
  `;
  document.getElementById('om-data').innerHTML = html;
}

function renderPAGASA(data) {
  const today = data.forecast?.today;
  if (!today) {
    document.getElementById('pagasa-data').innerHTML = '<div class="error">No forecast available</div>';
    return;
  }
  const html = `
    <div class="metric"><span>Condition</span><strong>${today.condition}</strong></div>
    <div class="metric"><span>Temp Range</span><strong>${today.temp_min}°C – ${today.temp_max}°C</strong></div>
    <div class="metric"><span>Wind</span><strong>${today.wind}</strong></div>
    ${today.advisory ? `<div class="metric advisory"><span>Advisory</span><strong>${today.advisory}</strong></div>` : ''}
    <div class="metric"><span>Synopsis</span><em>${data.synopsis}</em></div>
    <div class="metric"><span>Source</span><strong>PAGASA (Official Philippine Weather Bureau)</strong></div>
    <div class="metric"><span>Issued</span><strong>${data.issued_at}</strong></div>
  `;
  document.getElementById('pagasa-data').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  const loc = loadLocation();
  if (loc) {
    state.location = loc;
    fetchAll(loc);
  }
});
