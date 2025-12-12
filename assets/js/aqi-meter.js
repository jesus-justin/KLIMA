/* Air Quality Index Visual Indicator */

function renderAQIMeter() {
  if (!state.aqi || !state.aqi.aqi) {
    // Hide AQI meter if no data
    const meter = document.getElementById('aqi-meter-card');
    if (meter) meter.style.display = 'none';
    return;
  }

  const aqi = state.aqi.aqi;
  const components = state.aqi.components || {};
  
  // Determine AQI level and color
  let level = 'Good';
  let color = '#10b981'; // emerald
  let icon = '✨';
  let healthMsg = 'Air quality is excellent';
  
  if (aqi > 200) {
    level = 'Very Unhealthy';
    color = '#7c2d12';
    icon = '🚨';
    healthMsg = 'Avoid outdoor activities. Wear N95 mask if you must go out';
  } else if (aqi > 150) {
    level = 'Unhealthy';
    color = '#dc2626';
    icon = '⚠️';
    healthMsg = 'Sensitive groups should avoid outdoor activities';
  } else if (aqi > 100) {
    level = 'Unhealthy for Sensitive Groups';
    color = '#f97316';
    icon = '⚠️';
    healthMsg = 'Sensitive groups should reduce outdoor activities';
  } else if (aqi > 50) {
    level = 'Moderate';
    color = '#eab308';
    icon = '😐';
    healthMsg = 'Acceptable air quality. Sensitive groups may be affected';
  }
  
  // PM2.5 and PM10 values
  const pm25 = components.pm2_5 ? Math.round(components.pm2_5) : '—';
  const pm10 = components.pm10 ? Math.round(components.pm10) : '—';
  const o3 = components.o3 ? Math.round(components.o3) : '—';

  // Calculate percentage for circular gauge (0-200)
  const percentage = Math.min((aqi / 200) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius 45
  const offset = circumference - (percentage / 100) * circumference;

  const card = document.getElementById('aqi-meter-card');
  if (!card) return;

  card.innerHTML = `
    <div class="aqi-meter-container">
      <div class="aqi-header">
        <h3 class="aqi-title">Air Quality</h3>
        <span class="aqi-icon">${icon}</span>
      </div>
      
      <div class="aqi-gauge-wrapper">
        <svg class="aqi-gauge" viewBox="0 0 120 120" aria-label="Air Quality Index">
          <!-- Background circle -->
          <circle cx="60" cy="60" r="45" fill="none" stroke="var(--muted)" stroke-width="8" opacity="0.2"/>
          
          <!-- Gradient progress circle -->
          <defs>
            <linearGradient id="aqiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10b981"/>
              <stop offset="25%" stop-color="#eab308"/>
              <stop offset="50%" stop-color="#f97316"/>
              <stop offset="75%" stop-color="#dc2626"/>
              <stop offset="100%" stop-color="#7c2d12"/>
            </linearGradient>
          </defs>
          
          <!-- Progress circle -->
          <circle class="aqi-progress"
            cx="60" cy="60" r="45" 
            fill="none" 
            stroke="url(#aqiGradient)" 
            stroke-width="8"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            stroke-linecap="round"
            style="transform: rotate(-90deg); transform-origin: 60px 60px; transition: stroke-dashoffset 0.6s ease;"
          />
          
          <!-- Center value -->
          <text x="60" y="65" text-anchor="middle" class="aqi-value" fill="var(--text)">${aqi}</text>
        </svg>
      </div>

      <div class="aqi-info">
        <div class="aqi-level" style="color: ${color}; font-weight: 600;">${level}</div>
        <div class="aqi-message">${healthMsg}</div>
      </div>

      <div class="aqi-details">
        <div class="detail-row">
          <span class="detail-label">PM2.5</span>
          <span class="detail-value">${pm25} µg/m³</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">PM10</span>
          <span class="detail-value">${pm10} µg/m³</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">O₃</span>
          <span class="detail-value">${o3} ppb</span>
        </div>
      </div>

      <div class="aqi-scale">
        <div class="scale-item good">Good</div>
        <div class="scale-item moderate">Moderate</div>
        <div class="scale-item unhealthy">Unhealthy</div>
        <div class="scale-item veryunhealthy">Very Unhealthy</div>
      </div>
    </div>
  `;

  card.style.display = 'block';
}

window.renderAQIMeter = renderAQIMeter;
