/* KLIMA Frontend Logic */
const state = {
  units: 'metric',
  location: null,
  weather: null,
  tzOffset: 0,
  loading: false,
  view: 'daily', // 'daily' or 'weekly'
};

const el = (id) => document.getElementById(id);

// Time helpers: prefer the API's timezone string if present (OpenWeather provides 'timezone').
function fmtDate(ts) {
  const tz = state.weather?.timezone;
  const d = new Date(ts * 1000);
  return d.toLocaleString([], tz ? { hour12: true, timeZone: tz } : { hour12: true });
}
function fmtTime(ts) {
  const tz = state.weather?.timezone;
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], tz ? { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz } : { hour: 'numeric', minute: '2-digit', hour12: true });
}
function fmtHour(ts){
  const tz = state.weather?.timezone;
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], tz ? { hour: 'numeric', hour12: true, timeZone: tz } : { hour: 'numeric', hour12: true });
}

function jogScore(tempC, windMs, pop, isDaylight){
  // Simple heuristic: prefer 15-26°C, low wind, low precipitation chance, daylight
  let score = 100;
  if (!isDaylight) score -= 30;
  if (tempC < 10) score -= (10 - tempC) * 4; // cold penalty
  if (tempC > 28) score -= (tempC - 28) * 5; // heat penalty
  if (windMs > 6) score -= (windMs - 6) * 3; // wind penalty
  score -= pop * 35; // precipitation probability penalty
  if (score >= 65) return { rating: 'Good', class: 'good' };
  if (score >= 40) return { rating: 'Fair', class: 'fair' };
  return { rating: 'Poor', class: 'poor' };
}

function renderCurrent(){
  if (!state.weather || !state.weather.current) return;
  const c = state.weather.current;
  el('current-temp').textContent = Math.round(c.temp) + '°';
  el('current-desc').textContent = c.weather?.[0]?.description || '—';
  el('feels-like').textContent = Math.round(c.feels_like) + '°';
  el('humidity').textContent = c.humidity + '%';
  const windUnit = state.units === 'metric' ? 'm/s' : 'mph';
  el('wind').textContent = c.wind_speed + ' ' + windUnit;
  el('uvi').textContent = c.uvi;
  el('sunrise').textContent = fmtTime(c.sunrise);
  el('sunset').textContent = fmtTime(c.sunset);
  const icon = c.weather?.[0]?.icon;
  if (icon){
    const img = el('current-icon');
    img.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    img.alt = c.weather?.[0]?.main || '';
  }
}

function renderJogNow(){
  const c = state.weather.current;
  const tempC = state.units === 'metric' ? c.temp : (c.temp - 32) * 5/9;
  const windMs = state.units === 'metric' ? c.wind_speed : c.wind_speed / 2.23694;
  const isDay = c.dt > c.sunrise && c.dt < c.sunset;
  const score = jogScore(tempC, windMs, state.weather.hourly[0]?.pop || 0, isDay);
  const box = el('jog-now');
  box.textContent = `Jog Now: ${score.rating}`;
  box.className = 'jog-now jog-' + score.class;
}

function renderHourly(){
  const cont = el('hourly-grid');
  cont.innerHTML = '';
  const hourly = state.weather.hourly.slice(0, 24);
  const offset = state.weather.timezone_offset;
  const sunrise = state.weather.current.sunrise;
  const sunset = state.weather.current.sunset;
  let goodCount = 0, fairCount = 0, poorCount = 0;
  
  hourly.forEach(h => {
    const div = document.createElement('div');
    div.className = 'hour';
    const isDay = h.dt > sunrise && h.dt < sunset;
    const tempC = state.units === 'metric' ? h.temp : (h.temp - 32) * 5/9;
    const windMs = state.units === 'metric' ? h.wind_speed : h.wind_speed / 2.23694;
    const score = jogScore(tempC, windMs, h.pop || 0, isDay);
    
    // Count for summary
    if (score.class === 'good') goodCount++;
    else if (score.class === 'fair') fairCount++;
    else poorCount++;
    
    div.innerHTML = `
  <div class="time">${fmtHour(h.dt)}</div>
      <img src="https://openweathermap.org/img/wn/${h.weather?.[0]?.icon}.png" alt="" />
      <div class="t">${Math.round(h.temp)}°</div>
      <div class="pop">Rain: ${(h.pop*100)|0}%</div>
      <div class="badge ${score.class}" title="Jog suitability">${score.rating}</div>
    `;
    cont.appendChild(div);
  });
  
  updateJogSummary(goodCount, fairCount, poorCount);
}

function renderDaily(){
  const cont = el('daily-grid');
  cont.innerHTML='';
  const daily = state.weather.daily.slice(0,7);
  const offset = state.weather.timezone_offset;
  let goodCount = 0, fairCount = 0, poorCount = 0;
  
  daily.forEach(d => {
    const div = document.createElement('div');
    div.className='day';
    const tempC = state.units === 'metric' ? d.temp.day : (d.temp.day - 32) * 5/9;
    const windMs = state.units === 'metric' ? d.wind_speed : d.wind_speed / 2.23694;
    const isDaylight = true; // daily aggregated, assume potential daylight
    const score = jogScore(tempC, windMs, d.pop || 0, isDaylight);
    
    // Count for weekly summary
    if (score.class === 'good') goodCount++;
    else if (score.class === 'fair') fairCount++;
    else poorCount++;
    
    div.innerHTML = `
  <div class="name">${new Date(d.dt*1000).toLocaleDateString([], state.weather?.timezone ? { weekday:'short', timeZone: state.weather.timezone } : { weekday:'short' })}</div>
      <img src="https://openweathermap.org/img/wn/${d.weather?.[0]?.icon}.png" alt="" />
      <div class="range">${Math.round(d.temp.min)}° / ${Math.round(d.temp.max)}°</div>
      <div class="pop">Rain: ${(d.pop*100)|0}%</div>
      <div class="badge ${score.class}" title="Jog suitability">${score.rating}</div>
    `;
    cont.appendChild(div);
  });
  
  // Update summary if in weekly view
  if (state.view === 'weekly') {
    updateJogSummary(goodCount, fairCount, poorCount);
  }
}

function updateDateTime(){
  if (!state.weather) return;
  const offset = state.weather.timezone_offset;
  const nowTs = Math.floor(Date.now()/1000);
  el('date-time').textContent = fmtDate(nowTs);
}

async function fetchWeather(lat, lon){
  showError();
  state.loading = true;
  try {
    let r = await fetch(`api/weather.php?lat=${lat}&lon=${lon}&units=${state.units}`);
    if (!r.ok) {
      // Attempt fallback if API key not configured
      const body = await r.text();
      if (body.includes('API key not configured')) {
        r = await fetch(`api/weather_free.php?lat=${lat}&lon=${lon}&units=${state.units}`);
      } else {
        throw new Error('Weather fetch failed: ' + r.status + ' ' + body);
      }
    }
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    state.weather = data;
    renderCurrent();
    renderJogNow();
    renderHourly();
    renderDaily();
    updateDateTime();
  } catch (e){
    showError(e.message || 'Unknown error while fetching weather');
  } finally {
    state.loading = false;
  }
}

async function searchLocation(q){
  showError();
  try {
    const r = await fetch(`api/geocode.php?q=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error('Location not found');
    const loc = await r.json();
    if (loc.error) throw new Error(loc.error);
    if (!loc.lat || !loc.lon) throw new Error('Invalid coordinates');
  state.location = loc;
  // persist location for alerts page
  try { localStorage.setItem('klima:lastLocation', JSON.stringify(loc)); } catch(_) {}
    el('location-name').textContent = loc.name + (loc.country? ', ' + loc.country : '');
    await fetchWeather(loc.lat, loc.lon);
  } catch (e){
    showError(e.message || 'Search error');
  }
}

function useGeolocation(){
  if (!navigator.geolocation) return alert('Geolocation not available');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      state.location = { name: 'My Location', lat: pos.coords.latitude, lon: pos.coords.longitude };
      el('location-name').textContent = 'My Location';
      try { localStorage.setItem('klima:lastLocation', JSON.stringify(state.location)); } catch(_) {}
      await fetchWeather(pos.coords.latitude, pos.coords.longitude);
    } catch (e){
      showError(e.message || 'Geolocation weather fetch failed');
    }
  }, (err) => {
    showError('Failed to get location: ' + err.message);
  });
}

function bindEvents(){
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('search-input').value.trim();
    if (val) searchLocation(val).catch(err => alert(err.message));
  });
  document.getElementById('btn-geolocate').addEventListener('click', useGeolocation);
  
  document.querySelectorAll('.unit').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.unit').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.units = btn.dataset.unit;
      if (state.location){
        fetchWeather(state.location.lat, state.location.lon);
      }
    });
  });
  
  // View toggle buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.view = btn.dataset.view;
      updateView();
    });
  });
  
  setInterval(updateDateTime, 30000);
  updateView(); // Initialize view
}

function updateJogSummary(good, fair, poor) {
  el('good-count').textContent = good;
  el('fair-count').textContent = fair;
  el('poor-count').textContent = poor;
}

function updateView() {
  const hourlySection = document.querySelector('.hourly');
  const dailySection = document.querySelector('.daily');
  
  if (state.view === 'daily') {
    hourlySection.style.display = 'block';
    dailySection.style.display = 'none';
    // Re-render hourly to update summary
    if (state.weather) renderHourly();
  } else {
    hourlySection.style.display = 'none';
    dailySection.style.display = 'block';
    // Re-render daily to update summary
    if (state.weather) renderDaily();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  // Default load example city to show UI
  searchLocation('Manila').catch(()=>{});
});

function showError(msg){
  const banner = document.getElementById('error-banner');
  if (!msg){
    banner.hidden = true;
    banner.textContent='';
    return;
  }
  banner.hidden = false;
  banner.textContent = msg;
}

// Alerts UI removed per request
