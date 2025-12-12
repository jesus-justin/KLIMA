/* Hourly Precipitation Timeline Visualization */

function renderPrecipitationTimeline() {
  if (!state.weather || !state.weather.hourly || state.weather.hourly.length === 0) return;

  // Get next 12 hours of data
  const nextHours = state.weather.hourly.slice(0, 12);
  const maxPop = Math.max(...nextHours.map(h => h.pop || 0), 1);
  
  const card = document.getElementById('precip-timeline-card');
  if (!card) return;

  const hourBars = nextHours.map((hour, idx) => {
    const pop = hour.pop || 0;
    const barHeight = (pop / maxPop) * 100;
    const temp = Math.round(hour.temp);
    const hour12 = new Date(hour.dt * 1000).getHours();
    
    // Color coding based on probability
    let color = '#10b981'; // green
    if (pop > 80) color = '#dc2626'; // red
    else if (pop > 50) color = '#f97316'; // orange
    else if (pop > 30) color = '#eab308'; // yellow
    else if (pop > 10) color = '#38bdf8'; // light blue

    return `
      <div class="precip-bar-group">
        <div class="precip-bar-wrapper">
          <div class="precip-bar" style="height: ${barHeight}%; background: ${color};" 
               title="${pop}% chance of rain" aria-label="Precipitation probability ${pop}%">
          </div>
        </div>
        <div class="precip-hour-label">${hour12}h</div>
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <div class="precip-timeline-container">
      <div class="precip-header">
        <h3 class="precip-title">Precipitation Forecast (12h)</h3>
        <span class="precip-icon">🌧️</span>
      </div>

      <div class="precip-chart">
        ${hourBars}
      </div>

      <div class="precip-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: #10b981;"></span>
          <span class="legend-text">0-10%</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #38bdf8;"></span>
          <span class="legend-text">10-30%</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #eab308;"></span>
          <span class="legend-text">30-50%</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f97316;"></span>
          <span class="legend-text">50-80%</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #dc2626;"></span>
          <span class="legend-text">80%+</span>
        </div>
      </div>

      <div class="precip-insight">
        ${nextHours.some(h => (h.pop || 0) > 50) 
          ? '<p>⚠️ Rain expected in the next 12 hours. Adjust your jogging plans accordingly.</p>'
          : '<p>✅ No significant rain expected. Good conditions for outdoor activities!</p>'}
      </div>
    </div>
  `;

  document.getElementById('precip-timeline-card').style.display = 'block';
}

window.renderPrecipitationTimeline = renderPrecipitationTimeline;
