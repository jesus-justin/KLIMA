/* Sunrise/Sunset Golden Hour Visualization */

function renderGoldenHourCard() {
  if (!state.weather || !state.weather.current) return;
  
  const current = state.weather.current;
  const now = new Date();
  
  // Parse sunrise/sunset timestamps
  const sunriseTime = new Date(current.sunrise * 1000);
  const sunsetTime = new Date(current.sunset * 1000);
  
  // Calculate times to sunrise/sunset
  const msToSunrise = sunriseTime - now;
  const msToSunset = sunsetTime - now;
  
  const toSunriseHours = Math.floor(msToSunrise / (1000 * 60 * 60));
  const toSunriseMins = Math.floor((msToSunrise % (1000 * 60 * 60)) / (1000 * 60));
  
  const toSunsetHours = Math.floor(msToSunset / (1000 * 60 * 60));
  const toSunsetMins = Math.floor((msToSunset % (1000 * 60 * 60)) / (1000 * 60));
  
  // Golden hour is 60 minutes before/after sunrise/sunset
  const goldenHourBeforeSunrise = new Date(sunriseTime - 60 * 60 * 1000);
  const goldenHourAfterSunrise = new Date(sunriseTime.getTime() + 60 * 60 * 1000);
  
  const goldenHourBeforeSunset = new Date(sunsetTime - 60 * 60 * 1000);
  const goldenHourAfterSunset = new Date(sunsetTime.getTime() + 60 * 60 * 1000);
  
  // Determine current golden hour status
  let goldenHourStatus = '—';
  let goldenIcon = '🌅';
  if (now >= goldenHourBeforeSunrise && now <= goldenHourAfterSunrise) {
    goldenHourStatus = 'Morning Golden Hour';
    goldenIcon = '🌅';
  } else if (now >= goldenHourBeforeSunset && now <= goldenHourAfterSunset) {
    goldenHourStatus = 'Evening Golden Hour';
    goldenIcon = '🌅';
  } else if (msToSunrise > 0 && msToSunrise < 2 * 60 * 60 * 1000) {
    goldenHourStatus = 'Golden Hour Approaching';
    goldenIcon = '✨';
  } else if (msToSunset > 0 && msToSunset < 2 * 60 * 60 * 1000) {
    goldenHourStatus = 'Golden Hour Soon';
    goldenIcon = '✨';
  } else {
    goldenHourStatus = 'No Golden Hour';
    goldenIcon = '🌞';
  }
  
  // Is daytime
  const isDaytime = current.is_day !== 0;

  const card = document.getElementById('golden-hour-card');
  if (!card) return;

  card.innerHTML = `
    <div class="golden-hour-container">
      <div class="golden-hour-header">
        <h3 class="golden-hour-title">Sun Schedule</h3>
        <span class="golden-hour-status-badge">${goldenIcon} ${goldenHourStatus}</span>
      </div>

      <div class="sun-timeline">
        <!-- Timeline bar -->
        <div class="timeline-bar">
          <!-- Sunrise marker -->
          <div class="timeline-marker sunrise-marker">
            <div class="marker-dot"></div>
            <span class="marker-label">Sunrise</span>
          </div>

          <!-- Current time position -->
          <div class="timeline-marker current-marker" style="opacity: ${isDaytime ? 1 : 0.5}">
            <div class="marker-dot current"></div>
            <span class="marker-label">Now</span>
          </div>

          <!-- Sunset marker -->
          <div class="timeline-marker sunset-marker">
            <div class="marker-dot"></div>
            <span class="marker-label">Sunset</span>
          </div>
        </div>

        <!-- Day/Night indicator -->
        <div class="day-night-indicator" style="background: ${isDaytime ? 'linear-gradient(90deg, #fbbf24 0%, #60a5fa 100%)' : 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)'};">
          <span class="day-night-label">${isDaytime ? '☀️ Daytime' : '🌙 Nighttime'}</span>
        </div>
      </div>

      <div class="sun-times-grid">
        <div class="sun-time-card sunrise">
          <div class="time-icon">🌅</div>
          <div class="time-value">${fmtTime(current.sunrise)}</div>
          <div class="time-label">Sunrise</div>
          ${msToSunrise > 0 ? `<div class="time-until">In ${toSunriseHours}h ${toSunriseMins}m</div>` : `<div class="time-until" style="color: #f87171;">Already risen</div>`}
        </div>

        <div class="sun-time-card sunset">
          <div class="time-icon">🌇</div>
          <div class="time-value">${fmtTime(current.sunset)}</div>
          <div class="time-label">Sunset</div>
          ${msToSunset > 0 ? `<div class="time-until">In ${toSunsetHours}h ${toSunsetMins}m</div>` : `<div class="time-until" style="color: #f87171;">Already set</div>`}
        </div>

        <div class="sun-time-card daylight">
          <div class="time-icon">⏱️</div>
          <div class="time-value">${Math.floor((sunsetTime - sunriseTime) / (1000 * 60 * 60))}h ${Math.floor(((sunsetTime - sunriseTime) % (1000 * 60 * 60)) / (1000 * 60))}m</div>
          <div class="time-label">Daylight Hours</div>
          <div class="time-until">Daily duration</div>
        </div>
      </div>

      <div class="golden-hour-info">
        <p class="info-text">
          <strong>Golden Hour:</strong> The period 1 hour before/after sunrise/sunset offers ideal lighting conditions for outdoor photography and comfortable jogging temperatures.
        </p>
      </div>
    </div>
  `;

  document.getElementById('golden-hour-card').style.display = 'block';
}

window.renderGoldenHourCard = renderGoldenHourCard;
