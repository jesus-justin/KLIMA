/* KLIMA Weekly Heatmap */

function generateWeeklyHeatmap(weather, units) {
  if (!weather || !weather.daily || weather.daily.length === 0) return [];
  
  const daily = weather.daily.slice(0, 7);
  const heatmap = daily.map((d, idx) => {
    const tempC = units === 'metric' ? d.temp.day : (d.temp.day - 32) * 5 / 9;
    const windMs = units === 'metric' ? d.wind_speed : d.wind_speed / 2.23694;
    const pop = d.pop || 0;
    
    // Calculate a jog score (0-100)
    let score = 100;
    if (tempC < 10) score -= (10 - tempC) * 4;
    if (tempC > 28) score -= (tempC - 28) * 5;
    if (windMs > 6) score -= (windMs - 6) * 3;
    score -= pop * 35;
    score = Math.max(0, Math.min(100, score));
    
    const day = new Date(d.dt * 1000);
    const dayName = new Intl.DateTimeFormat(navigator.language || 'en-US', { weekday: 'short' }).format(day);
    
    let condition = 'poor';
    if (score >= 65) condition = 'excellent';
    else if (score >= 50) condition = 'good';
    else if (score >= 35) condition = 'fair';
    
    return {
      day: dayName,
      date: day.getDate(),
      score,
      condition,
      temp: Math.round(tempC),
      pop: Math.round(pop * 100),
      wind: windMs.toFixed(1)
    };
  });
  
  return heatmap;
}

function renderWeeklyHeatmap(heatmap) {
  const container = document.getElementById('heatmap-container');
  if (!container) return;
  
  if (!heatmap || heatmap.length === 0) {
    container.innerHTML = '<div class="heatmap-empty">No forecast data available</div>';
    return;
  }
  
  const html = `
    <div class="heatmap-grid">
      ${heatmap.map(day => `
        <div class="heatmap-cell ${day.condition}" title="${day.day}, ${day.date} — Score: ${Math.round(day.score)}/100">
          <div class="heatmap-day">${day.day}</div>
          <div class="heatmap-date">${day.date}</div>
          <div class="heatmap-score">${Math.round(day.score)}</div>
          <div class="heatmap-details">
            <span class="detail-temp">${day.temp}°</span>
            <span class="detail-rain">${day.pop}%</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="heatmap-legend">
      <div class="legend-item excellent">Excellent</div>
      <div class="legend-item good">Good</div>
      <div class="legend-item fair">Fair</div>
      <div class="legend-item poor">Poor</div>
    </div>
  `;
  
  container.innerHTML = html;
}

if (typeof window !== 'undefined') {
  window.generateWeeklyHeatmap = generateWeeklyHeatmap;
  window.renderWeeklyHeatmap = renderWeeklyHeatmap;
}
