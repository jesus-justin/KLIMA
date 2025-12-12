/* Wind Direction Compass Visualization */

function renderWindCompass() {
  if (!state.weather || !state.weather.current) return;
  
  const windDeg = state.weather.current.wind_deg || 0;
  const windSpeed = state.weather.current.wind_speed || 0;
  const windUnit = state.units === 'metric' ? 'm/s' : 'mph';
  
  // Get wind direction label
  function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees || 0) / 22.5)) % 16;
    return directions[index];
  }
  
  const direction = getWindDirection(windDeg);
  
  const compass = document.getElementById('wind-compass-card');
  if (!compass) return;

  // Calculate wind speed category for intensity visualization
  let speedClass = 'calm';
  if (windSpeed > 10) speedClass = 'strong';
  else if (windSpeed > 5) speedClass = 'moderate';
  else if (windSpeed > 2) speedClass = 'light';

  compass.innerHTML = `
    <div class="wind-compass-container">
      <div class="compass-header">
        <h3 class="compass-title">Wind Direction</h3>
        <span class="wind-speed-badge ${speedClass}">${windSpeed.toFixed(1)} ${windUnit}</span>
      </div>

      <div class="compass-wrapper">
        <svg class="compass-svg" viewBox="0 0 200 200" aria-label="Wind Compass">
          <defs>
            <radialGradient id="compassBg" cx="50%" cy="50%" r="100%">
              <stop offset="0%" stop-color="var(--muted-bg)" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="var(--muted-bg)" stop-opacity="0.3"/>
            </radialGradient>
          </defs>

          <!-- Compass background -->
          <circle cx="100" cy="100" r="95" fill="url(#compassBg)" stroke="var(--border)" stroke-width="2"/>

          <!-- Cardinal directions (N, S, E, W) -->
          <text x="100" y="30" text-anchor="middle" class="cardinal-label primary">N</text>
          <text x="170" y="105" text-anchor="start" class="cardinal-label primary">E</text>
          <text x="100" y="175" text-anchor="middle" class="cardinal-label primary">S</text>
          <text x="30" y="105" text-anchor="end" class="cardinal-label primary">W</text>

          <!-- Intercardinal directions -->
          <text x="147" y="53" text-anchor="middle" class="cardinal-label secondary">NE</text>
          <text x="147" y="150" text-anchor="middle" class="cardinal-label secondary">SE</text>
          <text x="53" y="150" text-anchor="middle" class="cardinal-label secondary">SW</text>
          <text x="53" y="53" text-anchor="middle" class="cardinal-label secondary">NW</text>

          <!-- Compass ring -->
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.5"/>
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.3"/>

          <!-- Wind direction indicator (rotating arrow) -->
          <g class="wind-arrow" style="transform: rotate(${windDeg}deg); transform-origin: 100px 100px;">
            <!-- Arrow shaft -->
            <line x1="100" y1="100" x2="100" y2="30" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/>
            
            <!-- Arrow head -->
            <polygon points="100,30 95,45 105,45" fill="var(--accent)"/>
            
            <!-- Wind speed rings (intensity) -->
            <circle cx="100" cy="100" r="${30 + (Math.min(windSpeed / 10, 1)) * 15}" fill="var(--accent)" opacity="0.15"/>
          </g>

          <!-- Center circle -->
          <circle cx="100" cy="100" r="10" fill="var(--accent)" stroke="white" stroke-width="2"/>
        </svg>
      </div>

      <div class="compass-info">
        <div class="direction-display">
          <span class="direction-text">${direction}</span>
          <span class="direction-degrees">${windDeg}°</span>
        </div>
      </div>

      <div class="compass-description">
        <p class="wind-description">
          Wind blowing from the ${direction} at ${windSpeed.toFixed(1)} ${windUnit}
        </p>
      </div>
    </div>
  `;

  document.getElementById('wind-compass-card').style.display = 'block';
}

window.renderWindCompass = renderWindCompass;
