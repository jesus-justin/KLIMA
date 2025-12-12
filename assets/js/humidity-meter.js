/* Humidity Visual Meter - Animated Liquid Display */

function renderHumidityMeter() {
  if (!state.weather || !state.weather.current) return;
  
  const humidity = state.weather.current.humidity || 0;
  
  // Determine humidity level
  let level = 'Dry';
  let icon = '🌵';
  let healthMsg = 'Low humidity - watch for dehydration';
  
  if (humidity >= 80) {
    level = 'Very Humid';
    icon = '💧';
    healthMsg = 'High humidity - stay hydrated and take it easy';
  } else if (humidity >= 60) {
    level = 'Humid';
    icon = '💦';
    healthMsg = 'Moderate humidity - comfortable for outdoor activities';
  } else if (humidity >= 40) {
    level = 'Comfortable';
    icon = '😊';
    healthMsg = 'Ideal humidity range for jogging';
  } else if (humidity >= 20) {
    level = 'Dry';
    icon = '🌵';
    healthMsg = 'Low humidity - increase water intake';
  } else {
    level = 'Very Dry';
    icon = '🏜️';
    healthMsg = 'Extremely dry - protect mucous membranes';
  }

  const meter = document.getElementById('humidity-meter-card');
  if (!meter) return;

  // Wave animation height based on humidity
  const waveHeight = 20 + (humidity / 100) * 40;
  const dropletFill = humidity;

  meter.innerHTML = `
    <div class="humidity-meter-container">
      <div class="humidity-header">
        <h3 class="humidity-title">Humidity</h3>
        <span class="humidity-icon">${icon}</span>
      </div>

      <div class="droplet-meter-wrapper">
        <svg class="droplet-meter" viewBox="0 0 100 140" aria-label="Humidity Level">
          <defs>
            <linearGradient id="dropletGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4"/>
              <stop offset="50%" stop-color="#0ea5e9"/>
              <stop offset="100%" stop-color="#0284c7"/>
            </linearGradient>
            <clipPath id="dropletClip">
              <path d="M 50 10 C 30 30, 20 50, 20 70 C 20 100, 35 125, 50 125 C 65 125, 80 100, 80 70 C 80 50, 70 30, 50 10 Z"/>
            </clipPath>
          </defs>

          <!-- Droplet outline -->
          <path d="M 50 10 C 30 30, 20 50, 20 70 C 20 100, 35 125, 50 125 C 65 125, 80 100, 80 70 C 80 50, 70 30, 50 10 Z" 
                fill="none" stroke="var(--border)" stroke-width="2"/>

          <!-- Liquid fill with wave animation -->
          <g clip-path="url(#dropletClip)">
            <!-- Wave 1 (slower) -->
            <path class="wave wave-1" 
                  d="M -10 ${125 - dropletFill}
                     Q 15 ${125 - dropletFill - 10}, 40 ${125 - dropletFill}
                     T 90 ${125 - dropletFill}"
                  fill="url(#dropletGradient)" opacity="0.8"/>
            
            <!-- Wave 2 (faster, offset) -->
            <path class="wave wave-2"
                  d="M 0 ${125 - dropletFill - 5}
                     Q 25 ${125 - dropletFill - 15}, 50 ${125 - dropletFill - 5}
                     T 100 ${125 - dropletFill - 5}"
                  fill="url(#dropletGradient)" opacity="0.6"/>

            <!-- Fill -->
            <rect x="20" y="${125 - dropletFill}" width="60" height="${dropletFill}" fill="url(#dropletGradient)" opacity="0.4"/>
          </g>

          <!-- Percentage text -->
          <text x="50" y="70" text-anchor="middle" dominant-baseline="middle" class="humidity-percent" fill="var(--text)">
            ${humidity}%
          </text>
        </svg>
      </div>

      <div class="humidity-info">
        <div class="humidity-level" style="color: #0ea5e9; font-weight: 600;">${level}</div>
        <div class="humidity-message">${healthMsg}</div>
      </div>

      <div class="humidity-scale">
        <div class="scale-marker very-dry" title="0-20%">
          <span class="marker-value">0</span>
          <span class="marker-label">Very Dry</span>
        </div>
        <div class="scale-marker dry" title="20-40%">
          <span class="marker-value">40</span>
          <span class="marker-label">Dry</span>
        </div>
        <div class="scale-marker comfortable" title="40-60%">
          <span class="marker-value">60</span>
          <span class="marker-label">Ideal</span>
        </div>
        <div class="scale-marker humid" title="60-80%">
          <span class="marker-value">80</span>
          <span class="marker-label">Humid</span>
        </div>
        <div class="scale-marker very-humid" title="80-100%">
          <span class="marker-value">100</span>
          <span class="marker-label">Very Humid</span>
        </div>
      </div>

      <div class="humidity-tip">
        <strong>💡 Tip:</strong> Humidity below 30% can cause dehydration. Above 70%, heat stress increases. Aim for 40-60% when jogging.
      </div>
    </div>
  `;

  document.getElementById('humidity-meter-card').style.display = 'block';
}

window.renderHumidityMeter = renderHumidityMeter;
