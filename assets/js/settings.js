/* KLIMA Settings Panel */

const settingsDefaults = {
  notifications: true,
  refreshRate: 10, // minutes
  tempUnit: 'metric',
  windUnit: 'metric',
  theme: 'dark',
  locale: 'en-US',
  animationsEnabled: true
};

function initSettings() {
  const savedSettings = loadSettings();
  Object.assign(state, { settings: savedSettings });
  applyAnimationPreference(savedSettings.animationsEnabled !== false);
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('klima:settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch(_) {}
  return { ...settingsDefaults };
}

function saveSettings(settings) {
  try {
    localStorage.setItem('klima:settings', JSON.stringify(settings));
    state.settings = settings;
  } catch(_) {}
}

function updateSetting(key, value) {
  const settings = state.settings || loadSettings();
  settings[key] = value;
  saveSettings(settings);
  
  // Apply setting changes
  if (key === 'refreshRate') {
    updateRefreshRate(value);
  } else if (key === 'notifications') {
    updateNotificationsSetting(value);
  } else if (key === 'animationsEnabled') {
    applyAnimationPreference(value);
  }
}

function updateRefreshRate(minutes) {
  // Cancel existing interval if any
  if (window.weatherUpdateInterval) {
    clearInterval(window.weatherUpdateInterval);
  }
  // Set new interval (in milliseconds)
  window.weatherUpdateInterval = setInterval(() => {
    if (state.location && state.weather) {
      fetchWeather(state.location.lat, state.location.lon);
    }
  }, minutes * 60 * 1000);
}

function updateNotificationsSetting(enabled) {
  if (!enabled) return;
  
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    // Already granted
    return;
  } else if (Notification.permission !== 'denied') {
    // Ask for permission
    Notification.requestPermission().catch(err => console.warn('Notification permission denied', err));
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.hidden = false;
    modal.style.display = 'flex';
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.hidden = true;
    modal.style.display = 'none';
  }
}

function renderSettingsPanel() {
  const settings = state.settings || loadSettings();
  const html = `
    <div class="settings-group">
      <h3>Display</h3>
      <label class="setting-item">
        <span>Temperature Unit</span>
        <select id="setting-temp-unit" data-key="tempUnit">
          <option value="metric" ${settings.tempUnit === 'metric' ? 'selected' : ''}>Celsius (°C)</option>
          <option value="imperial" ${settings.tempUnit === 'imperial' ? 'selected' : ''}>Fahrenheit (°F)</option>
        </select>
      </label>
      <label class="setting-item">
        <span>Wind Unit</span>
        <select id="setting-wind-unit" data-key="windUnit">
          <option value="metric" ${settings.windUnit === 'metric' ? 'selected' : ''}>m/s</option>
          <option value="imperial" ${settings.windUnit === 'imperial' ? 'selected' : ''}>mph</option>
        </select>
      </label>
    </div>
    
    <div class="settings-group">
      <h3>Behavior</h3>
      <label class="setting-item">
        <span>Refresh Rate</span>
        <select id="setting-refresh-rate" data-key="refreshRate">
          <option value="5" ${settings.refreshRate === 5 ? 'selected' : ''}>Every 5 minutes</option>
          <option value="10" ${settings.refreshRate === 10 ? 'selected' : ''}>Every 10 minutes</option>
          <option value="30" ${settings.refreshRate === 30 ? 'selected' : ''}>Every 30 minutes</option>
          <option value="60" ${settings.refreshRate === 60 ? 'selected' : ''}>Every hour</option>
        </select>
      </label>
      <label class="setting-item checkbox">
        <input type="checkbox" id="setting-animations" data-key="animationsEnabled" ${settings.animationsEnabled !== false ? 'checked' : ''} />
        <span>Enable Animations</span>
      </label>
      <label class="setting-item checkbox">
        <input type="checkbox" id="setting-notifications" data-key="notifications" ${settings.notifications ? 'checked' : ''} />
        <span>Enable Notifications</span>
      </label>
    </div>
    
    <div class="settings-group">
      <h3>About</h3>
      <div class="about-info">
        <p><strong>KLIMA v2.0</strong></p>
        <p>Professional weather & jog planner with multi-source integration</p>
        <p style="font-size: 12px; color: var(--muted); margin-top: 8px;">Data from: OpenWeather, Open-Meteo, WeatherAPI, Weatherbit, Tomorrow.io, Visual Crossing</p>
      </div>
    </div>
  `;
  
  const container = document.getElementById('settings-content');
  if (container) {
    container.innerHTML = html;
    attachSettingsListeners();
  }
}

function attachSettingsListeners() {
  document.querySelectorAll('select[data-key]').forEach(select => {
    select.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const value = key === 'refreshRate' ? parseInt(e.target.value) : e.target.value;
      updateSetting(key, value);
    });
  });
  
  document.querySelectorAll('input[type="checkbox"][data-key]').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const value = e.target.id === 'setting-animations' ? e.target.checked : e.target.checked;
      updateSetting(key, value);
    });
  });
}

function applyAnimationPreference(enabled) {
  const root = document.documentElement;
  if (!enabled) {
    root.classList.add('no-animations');
  } else {
    root.classList.remove('no-animations');
  }
}

if (typeof window !== 'undefined') {
  window.initSettings = initSettings;
  window.openSettingsModal = openSettingsModal;
  window.closeSettingsModal = closeSettingsModal;
  window.renderSettingsPanel = renderSettingsPanel;
  window.applyAnimationPreference = applyAnimationPreference;
}
