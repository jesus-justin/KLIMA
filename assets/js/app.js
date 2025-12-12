/* KLIMA Frontend Logic */
const state = {
  units: 'metric',
  location: null,
  weather: null,
  tzOffset: 0,
  loading: false,
  view: 'daily', // 'daily' or 'weekly'
  hourlyAutoScrolled: false,
  chartView: false,
  hourlyChart: null,
  confidence: null,
  aqi: null,
};

let userLocale = loadUserLocale();

function loadUserLocale(){
  try {
    return localStorage.getItem('klima:locale') || navigator.language || 'en-US';
  } catch(_) {
    return navigator.language || 'en-US';
  }
}

function resolveTimeZone(){
	return state.weather?.timezone || undefined;
}

const el = (id) => document.getElementById(id);

// Time helpers: prefer API timezone string; use Intl for locale-aware formatting.
function fmtDate(ts) {
  const tz = resolveTimeZone();
  return new Intl.DateTimeFormat(userLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz
  }).format(new Date(ts * 1000));
}
function fmtTime(ts) {
  const tz = resolveTimeZone();
  return new Intl.DateTimeFormat(userLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz
  }).format(new Date(ts * 1000));
}
function fmtHour(ts){
  const tz = resolveTimeZone();
  return new Intl.DateTimeFormat(userLocale, {
    hour: 'numeric',
    hour12: true,
    timeZone: tz
  }).format(new Date(ts * 1000));
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

function formatCachedAt(isoString){
  try {
    return new Intl.DateTimeFormat(userLocale, {
      month:'short', day:'numeric', hour:'numeric', minute:'2-digit',
      timeZone: resolveTimeZone(), hour12:true
    }).format(new Date(isoString));
  } catch(_) { return isoString; }
}

function setUserLocale(locale){
  userLocale = locale || navigator.language || 'en-US';
  try { localStorage.setItem('klima:locale', userLocale); } catch(_) {}
  if (state.weather) {
    renderCurrent();
    renderHourly();
    renderDaily();
    updateDateTime();
    updateNowBar();
  }
  const select = document.getElementById('language-select');
  if (select && select.value !== userLocale && Array.from(select.options).some(o => o.value === userLocale)) {
    select.value = userLocale;
  }
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
  // Precipitation (mm/h where available)
  const mmh = (typeof c.precip === 'number') ? c.precip : (c.rain?.['1h'] ?? null);
  el('precip').textContent = (mmh != null) ? (mmh.toFixed(1) + ' mm/h') : '0 mm/h';
  el('uvi').textContent = c.uvi;
  el('sunrise').textContent = fmtTime(c.sunrise);
  el('sunset').textContent = fmtTime(c.sunset);
  const icon = c.weather?.[0]?.icon;
  if (icon){
    const img = el('current-icon');
    img.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    img.alt = c.weather?.[0]?.main || '';
    // Update now-bar icon
    const nbIcon = document.getElementById('nowbar-icon');
    if (nbIcon){
      nbIcon.src = `https://openweathermap.org/img/wn/${icon}.png`;
      nbIcon.alt = c.weather?.[0]?.main || '';
    }
    
    // Trigger weather effects
    if (window.weatherEffects) {
      const isDay = c.dt > c.sunrise && c.dt < c.sunset;
      window.weatherEffects.setWeather(icon, isDay);
    }
  }
  updateNowBar();
  
  // Render UV index card
  if (window.renderUVIndexCard) {
    window.renderUVIndexCard();
  }
  
  // Analyze and render weather trends
  if (window.analyzeWeatherTrends && window.renderTrendIndicators) {
    const trends = window.analyzeWeatherTrends(state.weather, state.units);
    window.renderTrendIndicators(trends);
  }
  
  // Generate and render jog tips
  if (window.generateJogTips && window.renderJogTips) {
    const tips = window.generateJogTips(state.weather, state.units);
    window.renderJogTips(tips);
  }

  // Render new entertainment features
  if (window.renderAQIMeter) {
    window.renderAQIMeter();
  }
  if (window.renderWindCompass) {
    window.renderWindCompass();
  }
  if (window.renderHumidityMeter) {
    window.renderHumidityMeter();
  }
  if (window.renderGoldenHourCard) {
    window.renderGoldenHourCard();
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
  const offset = state.weather.timezone_offset || 0;
  const sunrise = state.weather.current.sunrise;
  const sunset = state.weather.current.sunset;
  let goodCount = 0, fairCount = 0, poorCount = 0;
  const nowUtc = Math.floor(Date.now()/1000);
  // Determine current local hour number at the location (robust vs rounding/edge cases)
  const nowLocalHour = Math.floor((nowUtc + offset)/3600) % 24;
  let nowEl = null;
  const debugEnabled = shouldDebugHourly();
  
  hourly.forEach(h => {
    const div = document.createElement('div');
    // Compare by local hour number rather than exact epoch to avoid off-by-one due to DST/rounding
    const hLocalHour = Math.floor((h.dt + offset)/3600) % 24;
    const isNowHour = hLocalHour === nowLocalHour;
    div.className = 'hour' + (isNowHour ? ' now-hour' : '');
    const isDay = h.dt > sunrise && h.dt < sunset;
    const tempC = state.units === 'metric' ? h.temp : (h.temp - 32) * 5/9;
    const windMs = state.units === 'metric' ? h.wind_speed : h.wind_speed / 2.23694;
    const score = jogScore(tempC, windMs, h.pop || 0, isDay);
    const mmh = (typeof h.precip === 'number') ? h.precip : (h.rain?.['1h'] ?? null);
    
    // Count for summary
    if (score.class === 'good') goodCount++;
    else if (score.class === 'fair') fairCount++;
    else poorCount++;
    
    div.innerHTML = `
      <div class="time">${fmtHour(h.dt)}</div>
      <img src="https://openweathermap.org/img/wn/${h.weather?.[0]?.icon}.png" alt="" />
      <div class="t">${Math.round(h.temp)}°</div>
      <div class="pop">Rain: ${(h.pop*100)|0}%${mmh!=null?` • ${mmh.toFixed(1)} mm/h`:''}</div>
      <div class="badge ${score.class}" title="Jog suitability">${score.rating}</div>
    `;
    if (debugEnabled) {
      div.title = `h.dt=${h.dt} | hLocalHour=${hLocalHour} | nowLocalHour=${nowLocalHour} | offset=${offset}${isNowHour?' | NOW':''}`;
    }
    cont.appendChild(div);
    if (isNowHour) nowEl = div;
  });
  
  updateJogSummary(goodCount, fairCount, poorCount);
  // Auto-scroll to the NOW tile once after a fresh fetch
  if (nowEl && !state.hourlyAutoScrolled) {
    try { nowEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } catch(_) {}
    state.hourlyAutoScrolled = true;
  }

  // Render precipitation timeline
  if (window.renderPrecipitationTimeline) {
    window.renderPrecipitationTimeline();
  }
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
      <div class="name">${new Intl.DateTimeFormat(userLocale, { weekday:'short', timeZone: state.weather?.timezone || undefined }).format(new Date(d.dt*1000))}</div>
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
  
  // Generate and render weekly heatmap
  if (window.generateWeeklyHeatmap && window.renderWeeklyHeatmap) {
    const heatmap = window.generateWeeklyHeatmap(state.weather, state.units);
    window.renderWeeklyHeatmap(heatmap);
  }

  // Render streak tracker and confetti celebration
  if (window.renderStreakTracker) {
    window.renderStreakTracker();
  }
  if (window.celebrateExcellentJog) {
    window.celebrateExcellentJog();
  }
}

function updateDateTime(){
  if (!state.weather) return;
  const offset = state.weather.timezone_offset;
  const nowTs = Math.floor(Date.now()/1000);
  el('date-time').textContent = fmtDate(nowTs);
  // Update footer data source
  const src = state.weather.source ? (state.weather.source === 'open-meteo' ? 'Open‑Meteo' : 'OpenWeather') : 'Unknown';
  const srcEl = document.getElementById('data-source');
  if (srcEl) srcEl.textContent = src;
  // Update alerts badge asynchronously
  if (state.location) updateAlertsBadge(state.location);
  updateNowBar();
  // Refresh hourly grid to keep NOW highlight aligned (only if hourly view visible)
  const hourlySection = document.querySelector('.hourly');
  if (hourlySection && hourlySection.style.display !== 'none') {
    renderHourly();
  }
}

async function fetchWeather(lat, lon){
  showError();
  state.loading = true;
  showSkeleton(true);
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
    const fromCache = r.headers.get('X-Klima-From-Cache') === 'true';
    const cachedAt = r.headers.get('X-Klima-Cached-At');
    const offline = r.headers.get('X-Klima-Offline') === 'true';
    state.weather = data;
  state.hourlyAutoScrolled = false;
    renderCurrent();
    renderJogNow();
    renderHourly();
    renderDaily();
    updateDateTime();
    updateNowBar();
    if (fromCache && cachedAt) {
      showStatus(`Offline: showing last saved forecast (${formatCachedAt(cachedAt)})`);
    } else if (offline) {
      showStatus('Offline: showing last saved forecast');
    } else {
      showStatus();
    }
    
    // Trigger premium features
    if (window.initPremiumFeatures) {
      window.initPremiumFeatures();
    }
    
    // Fetch additional data in parallel
    Promise.all([
      fetchConfidence(lat, lon),
      fetchAirQuality(lat, lon)
    ]).catch(e => console.warn('Additional data fetch failed:', e));
  } catch (e){
    showError(e.message || 'Unknown error while fetching weather');
    showStatus('Offline: data may be stale');
  } finally {
    state.loading = false;
    showSkeleton(false);
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
    // Add to recent searches
    FavoritesManager.addRecent(loc);
    updateQuickAccess();
    el('location-name').textContent = loc.name + (loc.country? ', ' + loc.country : '');
    updateFavoriteButton();
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
      state.hourlyAutoScrolled = false;
      FavoritesManager.addRecent(state.location);
      updateQuickAccess();
      updateFavoriteButton();
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
  
  // Favorite button
  document.getElementById('btn-favorite').addEventListener('click', () => {
    if (!state.location) return alert('Select a location first');
    const isFav = FavoritesManager.isFavorite(state.location.lat, state.location.lon);
    if (isFav) {
      FavoritesManager.removeFavorite(state.location.lat, state.location.lon);
    } else {
      FavoritesManager.addFavorite(state.location);
    }
    updateFavoriteButton();
    updateQuickAccess();
  });
  
  // Share button
  document.getElementById('btn-share').addEventListener('click', async () => {
    if (!state.location) return alert('Select a location first');
    const url = window.location.origin + window.location.pathname + `?loc=${encodeURIComponent(state.location.name)}`;
    const text = `Check the weather for ${state.location.name} on KLIMA`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'KLIMA Weather', text, url });
      } catch(_) {}
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch(_) {
        alert('Share URL: ' + url);
      }
    }
  });
  
  // Chart toggle
  const chartBtn = document.getElementById('toggle-chart');
  if (chartBtn) {
    chartBtn.addEventListener('click', () => {
      state.chartView = !state.chartView;
      toggleChartView();
    });
  }
  
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

  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    if (Array.from(langSelect.options).some(o => o.value === userLocale)) {
      langSelect.value = userLocale;
    }
    langSelect.addEventListener('change', (e) => setUserLocale(e.target.value));
  }
  
  // Swipe gestures for hourly grid
  setupSwipeGestures();
  
  setInterval(updateDateTime, 30000);
  setInterval(updateNowBar, 60000);
  updateView(); // Initialize view
  updateQuickAccess(); // Load favorites/recent on start
}

function shouldDebugHourly(){
  try {
    // Enable by adding ?debugHourly=1 to URL or localStorage.setItem('klima:debugHourly','1')
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debugHourly') === '1') return true;
    if (localStorage.getItem('klima:debugHourly') === '1') return true;
  } catch(_){ }
  return false;
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
  // Initialize settings first
  if (window.initSettings) {
    window.initSettings();
  }
  
  bindEvents();
  
  // Settings button listener
  const settingsBtn = document.getElementById('settings-button');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (window.renderSettingsPanel) window.renderSettingsPanel();
      if (window.openSettingsModal) window.openSettingsModal();
    });
  }
  
  // Close settings modal on background click
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal && window.closeSettingsModal) {
        window.closeSettingsModal();
      }
    });
  }
  
  // Check for URL parameter ?loc=CityName
  const urlParams = new URLSearchParams(window.location.search);
  const locParam = urlParams.get('loc');
  
  if (locParam) {
    searchLocation(locParam).catch(() => {
      // Fallback to default
      searchLocation('Manila').catch(()=>{});
    });
  } else {
    // Default load example city to show UI
    searchLocation('Manila').catch(()=>{});
  }
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

function showStatus(msg){
  const banner = document.getElementById('status-banner');
  if (!banner) return;
  if (!msg){
    banner.hidden = true;
    banner.textContent='';
    return;
  }
  banner.hidden = false;
  banner.textContent = msg;
}

// Alerts UI removed per request
async function updateAlertsBadge(loc){
  try {
    const r = await fetch(`api/alerts.php?lat=${loc.lat}&lon=${loc.lon}`);
    if (!r.ok) return;
    const data = await r.json();
    const badge = document.getElementById('alerts-badge');
    if (!badge) return;
    const count = data.count || (data.alerts?.length||0);
    if (count > 0){
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch(_){ /* ignore */ }
}

function updateNowBar(){
  if (!state.weather || !state.weather.current) return;
  const c = state.weather.current;
  const nowTs = Math.floor(Date.now()/1000);
  const timeStr = fmtTime(nowTs);
  const tempStr = Math.round(c.temp) + '°' + (state.units === 'metric' ? 'C' : 'F');
  const desc = c.weather?.[0]?.description || '—';
  const mmh = (typeof c.precip === 'number') ? c.precip : (c.rain?.['1h'] ?? null);
  const precipStr = (mmh != null) ? (mmh.toFixed(1) + ' mm/h') : '0 mm/h';
  const tEl = document.getElementById('nowbar-time');
  const dEl = document.getElementById('nowbar-desc');
  const tempEl = document.getElementById('nowbar-temp');
  const pEl = document.getElementById('nowbar-precip');
  if (tEl) tEl.textContent = timeStr;
  if (dEl) dEl.textContent = desc;
  if (tempEl) tempEl.textContent = tempStr;
  if (pEl) pEl.textContent = precipStr;
}

function updateQuickAccess() {
  const favs = FavoritesManager.getFavorites();
  const recent = FavoritesManager.getRecent();
  const qaEl = document.getElementById('quick-access');
  
  if (favs.length === 0 && recent.length === 0) {
    qaEl.style.display = 'none';
    return;
  }
  
  qaEl.style.display = 'grid';
  
  const favList = document.getElementById('favorites-list');
  const recList = document.getElementById('recent-list');
  
  if (favs.length === 0) {
    favList.innerHTML = '<div class="empty-state">No favorites yet</div>';
  } else {
    favList.innerHTML = favs.map(f => `
      <button class="quick-item" data-lat="${f.lat}" data-lon="${f.lon}" data-name="${f.name}" data-country="${f.country||''}">
        ${f.name}${f.country ? ', ' + f.country : ''}
      </button>
    `).join('');
  }
  
  if (recent.length === 0) {
    recList.innerHTML = '<div class="empty-state">No recent searches</div>';
  } else {
    recList.innerHTML = recent.map(r => `
      <button class="quick-item" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.name}" data-country="${r.country||''}">
        ${r.name}${r.country ? ', ' + r.country : ''}
      </button>
    `).join('');
  }
  
  // Bind click events
  document.querySelectorAll('.quick-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const loc = {
        name: btn.dataset.name,
        lat: parseFloat(btn.dataset.lat),
        lon: parseFloat(btn.dataset.lon),
        country: btn.dataset.country
      };
      state.location = loc;
      try { localStorage.setItem('klima:lastLocation', JSON.stringify(loc)); } catch(_) {}
      el('location-name').textContent = loc.name + (loc.country ? ', ' + loc.country : '');
      FavoritesManager.addRecent(loc);
      updateQuickAccess();
      updateFavoriteButton();
      fetchWeather(loc.lat, loc.lon);
    });
  });
}

function updateFavoriteButton() {
  const btn = document.getElementById('btn-favorite');
  if (!btn || !state.location) return;
  const isFav = FavoritesManager.isFavorite(state.location.lat, state.location.lon);
  btn.style.color = isFav ? 'var(--brand)' : 'var(--text)';
  btn.querySelector('svg').style.fill = isFav ? 'var(--brand)' : 'none';
}

// New helper functions for enhanced features

async function fetchConfidence(lat, lon) {
  try {
    const r = await fetch(`api/confidence.php?lat=${lat}&lon=${lon}&units=${state.units}`);
    if (!r.ok) return;
    const data = await r.json();
    state.confidence = data;
    renderConfidenceBadge(data);
  } catch(e) {
    console.warn('Confidence fetch failed:', e);
  }
}

async function fetchAirQuality(lat, lon) {
  try {
    const r = await fetch(`api/airquality.php?lat=${lat}&lon=${lon}`);
    if (!r.ok) return;
    const data = await r.json();
    if (data.aqi) {
      state.aqi = data;
      renderAQIBadge(data);
    }
  } catch(e) {
    console.warn('AQI fetch failed:', e);
  }
}

function renderConfidenceBadge(data) {
  const badge = document.getElementById('confidence-badge');
  if (!badge || !data.confidence) return;
  
  badge.textContent = `Confidence: ${data.confidence.toUpperCase()}`;
  badge.className = `meta-badge ${data.confidence}`;
  badge.title = `Based on ${data.sources_count} sources. Temp variance: ${data.temperature_variance}°`;
  badge.style.display = 'inline-block';
}

function renderAQIBadge(data) {
  const badge = document.getElementById('aqi-badge');
  if (!badge || !data.aqi) return;
  
  badge.textContent = `Air Quality: ${data.aqi_label}`;
  const labelMap = {
    'Good': 'aqi-good',
    'Fair': 'aqi-fair',
    'Moderate': 'aqi-moderate',
    'Poor': 'aqi-poor',
    'Very Poor': 'aqi-verypoor'
  };
  badge.className = `meta-badge ${labelMap[data.aqi_label] || 'aqi-moderate'}`;
  badge.style.display = 'inline-block';
}

function showSkeleton(show) {
  const skeleton = document.getElementById('hourly-skeleton');
  if (!skeleton) return;
  skeleton.style.display = show ? 'flex' : 'none';
}

function toggleChartView() {
  const chartContainer = document.getElementById('hourly-chart-container');
  const gridContainer = document.getElementById('hourly-grid');
  const chartBtn = document.getElementById('toggle-chart');
  
  if (!chartContainer || !gridContainer || !chartBtn) return;
  
  if (state.chartView) {
    chartContainer.style.display = 'block';
    gridContainer.style.display = 'none';
    chartBtn.textContent = 'Grid View';
    chartBtn.style.display = 'inline-block';
    renderHourlyChart();
  } else {
    chartContainer.style.display = 'none';
    gridContainer.style.display = 'grid';
    chartBtn.textContent = 'Chart View';
  }
}

function renderHourlyChart() {
  if (!state.weather || !state.weather.hourly) return;
  
  const ctx = document.getElementById('hourly-chart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (state.hourlyChart) {
    state.hourlyChart.destroy();
  }
  
  const hourly = state.weather.hourly.slice(0, 24);
  const labels = hourly.map(h => fmtHour(h.dt));
  const temps = hourly.map(h => Math.round(h.temp));
  const pops = hourly.map(h => (h.pop * 100));
  
  state.hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°' + (state.units === 'metric' ? 'C' : 'F') + ')',
          data: temps,
          borderColor: 'rgba(56, 189, 248, 1)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Rain Probability (%)',
          data: pops,
          borderColor: 'rgba(14, 165, 233, 0.6)',
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
            font: { size: 14 }
          }
        },
        tooltip: {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--panel').trim(),
          titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
          bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border').trim(),
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() },
          grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() },
          grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 100,
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
  
  // Show toggle button after first render
  const chartBtn = document.getElementById('toggle-chart');
  if (chartBtn) chartBtn.style.display = 'inline-block';
}

function setupSwipeGestures() {
  const grid = document.getElementById('hourly-grid');
  if (!grid) return;
  
  let startX = 0;
  let scrollLeft = 0;
  let isDown = false;
  
  grid.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - grid.offsetLeft;
    scrollLeft = grid.scrollLeft;
    grid.style.cursor = 'grabbing';
  });
  
  grid.addEventListener('mouseleave', () => {
    isDown = false;
    grid.style.cursor = 'grab';
  });
  
  grid.addEventListener('mouseup', () => {
    isDown = false;
    grid.style.cursor = 'grab';
  });
  
  grid.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - grid.offsetLeft;
    const walk = (x - startX) * 2;
    grid.scrollLeft = scrollLeft - walk;
  });
  
  // Touch events
  let touchStartX = 0;
  let touchScrollLeft = 0;
  
  grid.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX - grid.offsetLeft;
    touchScrollLeft = grid.scrollLeft;
  }, { passive: true });
  
  grid.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX - grid.offsetLeft;
    const walk = (x - touchStartX) * 2;
    grid.scrollLeft = touchScrollLeft - walk;
  }, { passive: true });
  
  grid.style.cursor = 'grab';
}

// Listen for service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_WEATHER' && state.location) {
      fetchWeather(state.location.lat, state.location.lon);
    }
  });
}
