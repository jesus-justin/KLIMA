/* Compare page logic */

const state = {
  location: null,
  sources: {},
  confidence: null,
  rainChart: null,
  mode: 'current'
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
  
  // WeatherAPI.com
  try {
    const r = await fetch(`api/weatherapi.php?lat=${loc.lat}&lon=${loc.lon}&units=metric`);
    const data = await r.json();
    if (!data.error) {
      state.sources.weatherapi = data;
      renderWeatherAPI(data);
    }
  } catch(e) {
    document.getElementById('wa-data').innerHTML = '<div class="error">Failed to load</div>';
  }
  
  // Weatherbit.io
  try {
    const r = await fetch(`api/weatherbit.php?lat=${loc.lat}&lon=${loc.lon}&units=metric`);
    const data = await r.json();
    if (!data.error) {
      state.sources.weatherbit = data;
      renderWeatherbit(data);
    }
  } catch(e) {
    document.getElementById('wb-data').innerHTML = '<div class="error">Failed to load</div>';
  }
  
  // Tomorrow.io
  try {
    const r = await fetch(`api/tomorrow.php?lat=${loc.lat}&lon=${loc.lon}&units=metric`);
    const data = await r.json();
    if (!data.error) {
      state.sources.tomorrow = data;
      renderTomorrow(data);
    }
  } catch(e) {
    document.getElementById('tm-data').innerHTML = '<div class="error">Failed to load</div>';
  }
  
  // Visual Crossing
  try {
    const r = await fetch(`api/visualcrossing.php?lat=${loc.lat}&lon=${loc.lon}&units=metric`);
    const data = await r.json();
    if (!data.error) {
      state.sources.visualcrossing = data;
      renderVisualCrossing(data);
    }
  } catch(e) {
    document.getElementById('vc-data').innerHTML = '<div class="error">Failed to load</div>';
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

  // Fetch confidence score after all sources attempted
  fetchConfidence(loc.lat, loc.lon);

  // Compute aggregates & rain chart
  computeAggregate();
  renderRainChart();
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

function renderWeatherAPI(data) {
  const c = data.current;
  const html = `
    <div class="metric"><span>Current Temp</span><strong>${Math.round(c.temp)}°C</strong></div>
    <div class="metric"><span>Feels Like</span><strong>${Math.round(c.feels_like)}°C</strong></div>
    <div class="metric"><span>Humidity</span><strong>${c.humidity}%</strong></div>
    <div class="metric"><span>Wind</span><strong>${c.wind_speed} m/s</strong></div>
    <div class="metric"><span>Description</span><strong>${c.weather?.[0]?.description || '—'}</strong></div>
    ${c.air_quality ? `<div class="metric"><span>AQI</span><strong>${Math.round(c.air_quality.aqi)}</strong></div>` : ''}
    <div class="metric"><span>Source</span><strong>WeatherAPI.com</strong></div>
  `;
  document.getElementById('wa-data').innerHTML = html;
}

function renderWeatherbit(data) {
  const c = data.current;
  const html = `
    <div class="metric"><span>Current Temp</span><strong>${Math.round(c.temp)}°C</strong></div>
    <div class="metric"><span>Feels Like</span><strong>${Math.round(c.feels_like)}°C</strong></div>
    <div class="metric"><span>Humidity</span><strong>${c.humidity}%</strong></div>
    <div class="metric"><span>Wind</span><strong>${c.wind_speed} m/s</strong></div>
    <div class="metric"><span>Description</span><strong>${c.weather?.[0]?.description || '—'}</strong></div>
    ${c.air_quality ? `<div class="metric"><span>AQI</span><strong>${Math.round(c.air_quality.aqi)}</strong></div>` : ''}
    <div class="metric"><span>Source</span><strong>Weatherbit.io</strong></div>
  `;
  document.getElementById('wb-data').innerHTML = html;
}

function renderTomorrow(data) {
  const c = data.current;
  const html = `
    <div class="metric"><span>Current Temp</span><strong>${Math.round(c.temp)}°C</strong></div>
    <div class="metric"><span>Feels Like</span><strong>${Math.round(c.feels_like)}°C</strong></div>
    <div class="metric"><span>Humidity</span><strong>${c.humidity}%</strong></div>
    <div class="metric"><span>Wind</span><strong>${c.wind_speed} m/s</strong></div>
    <div class="metric"><span>Description</span><strong>${c.weather?.[0]?.description || '—'}</strong></div>
    ${c.air_quality ? `<div class="metric"><span>AQI</span><strong>${Math.round(c.air_quality.aqi)}</strong></div>` : ''}
    ${c.fire_index ? `<div class="metric"><span>Fire Index</span><strong>${c.fire_index}</strong></div>` : ''}
    ${c.flood_index ? `<div class="metric"><span>Flood Index</span><strong>${c.flood_index}</strong></div>` : ''}
    <div class="metric"><span>Source</span><strong>Tomorrow.io (60+ data layers)</strong></div>
  `;
  document.getElementById('tm-data').innerHTML = html;
}

function renderVisualCrossing(data) {
  const c = data.current;
  const html = `
    <div class="metric"><span>Current Temp</span><strong>${Math.round(c.temp)}°C</strong></div>
    <div class="metric"><span>Feels Like</span><strong>${Math.round(c.feels_like)}°C</strong></div>
    <div class="metric"><span>Humidity</span><strong>${c.humidity}%</strong></div>
    <div class="metric"><span>Wind</span><strong>${c.wind_speed} m/s</strong></div>
    <div class="metric"><span>Description</span><strong>${c.weather?.[0]?.description || '—'}</strong></div>
    <div class="metric"><span>Visibility</span><strong>${c.visibility} km</strong></div>
    <div class="metric"><span>Source</span><strong>Visual Crossing (50+ years data)</strong></div>
  `;
  document.getElementById('vc-data').innerHTML = html;
  computeAggregate();
}

document.addEventListener('DOMContentLoaded', () => {
  const loc = loadLocation();
  if (loc) {
    state.location = loc;
    fetchAll(loc);
  }

  setupTabs();
});

function setupTabs(){
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.mode = tab.dataset.mode;
      // Future extension: re-render data sections per mode
    });
  });
}

function computeAggregate(){
  const currentEntries = Object.values(state.sources)
    .map(src => src.current)
    .filter(Boolean);
  if (!currentEntries.length) return;
  const temps = currentEntries.map(c => c.temp);
  const humidities = currentEntries.map(c => c.humidity).filter(h => typeof h === 'number');
  const winds = currentEntries.map(c => c.wind_speed).filter(w => typeof w === 'number');
  const avg = (arr) => arr.reduce((a,b)=>a+b,0) / arr.length;
  const min = (arr) => Math.min(...arr);
  const max = (arr) => Math.max(...arr);
  document.getElementById('summary-temp').textContent = Math.round(avg(temps)) + '°C';
  document.getElementById('summary-range').textContent = Math.round(min(temps)) + '° / ' + Math.round(max(temps)) + '°';
  if (humidities.length){
    document.getElementById('summary-humidity').textContent = Math.round(min(humidities)) + '% – ' + Math.round(max(humidities)) + '%';
  }
  if (winds.length){
    document.getElementById('summary-wind').textContent = Math.round(min(winds)) + ' – ' + Math.round(max(winds)) + ' m/s';
  }
  document.getElementById('summary-sources').textContent = currentEntries.length.toString();
  // Add variance badge
  const variance = computeVariance(temps);
  const varianceBadge = document.createElement('span');
  varianceBadge.className = 'badge';
  varianceBadge.textContent = 'Variance: ' + variance.toFixed(2);
  const badges = document.getElementById('summary-badges');
  const existing = badges.querySelectorAll('.badge');
  if (existing.length === 0) badges.appendChild(varianceBadge); else existing[0].textContent = varianceBadge.textContent;
}

function computeVariance(arr){
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
  const v = arr.reduce((acc,x)=>acc + Math.pow(x-mean,2),0)/arr.length;
  return v;
}

async function fetchConfidence(lat, lon){
  try {
    const r = await fetch(`api/confidence.php?lat=${lat}&lon=${lon}&units=metric`);
    const data = await r.json();
    if (!data.error){
      state.confidence = data;
      renderConfidence(data);
    }
  } catch(e){
    // silent fail
  }
}

function renderConfidence(data){
  const el = document.getElementById('summary-confidence');
  if (!el) return;
  el.textContent = data.confidence || '—';
  const desc = document.getElementById('summary-desc');
  if (desc){
    desc.textContent = `Temperature variance: ${data.variance.toFixed(2)} | Confidence ${data.confidence}`;
  }
}

function renderRainChart(){
  const canvas = document.getElementById('compare-rain-chart');
  if (!canvas || !Object.keys(state.sources).length) return;
  const ctx = canvas.getContext('2d');
  // collect hourly pops from sources that have hourly
  const hours = Array.from({length:6}, (_,i)=>i); // next 6 hours index
  const hourlyCollections = hours.map(h => {
    const pops = Object.values(state.sources).map(src => src.hourly?.[h]?.pop).filter(p => typeof p === 'number');
    if (!pops.length) return 0;
    return (pops.reduce((a,b)=>a+b,0)/pops.length) * 100; // percent
  });
  if (state.rainChart){ state.rainChart.destroy(); }
  state.rainChart = new Chart(ctx, {
    type:'bar',
    data:{
      labels: hours.map(h => '+'+h+'h'),
      datasets:[{label:'Avg POP', data:hourlyCollections, backgroundColor:'rgba(56,189,248,0.8)', borderRadius:6}]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{beginAtZero:true, max:100, ticks:{callback:v=>v+'%'}},
        x:{grid:{display:false}}
      }
    }
  });
}
