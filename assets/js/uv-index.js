/* KLIMA UV Index Card */

function renderUVIndexCard() {
  const container = document.getElementById('uv-index-card');
  if (!container || !state.weather) return;
  
  const uvi = state.weather.current.uvi || 0;
  let level = 'low';
  let color = '#34d399';
  let warning = '';
  
  if (uvi < 3) {
    level = 'Low';
    color = '#34d399';
    warning = 'Minimal sun protection required';
  } else if (uvi < 6) {
    level = 'Moderate';
    color = '#f59e0b';
    warning = 'Wear sunscreen SPF 30+';
  } else if (uvi < 8) {
    level = 'High';
    color = '#f97316';
    warning = 'Seek shade during midday; use SPF 50+';
  } else if (uvi < 11) {
    level = 'Very High';
    color = '#dc2626';
    warning = 'Avoid sun 10am-4pm; wear protective gear';
  } else {
    level = 'Extreme';
    color = '#7c2d12';
    warning = 'Take all precautions; limit outdoor time';
  }
  
  const html = `
    <div class="uv-circle" style="--uv-color: ${color}">
      <div class="uv-value">${uvi}</div>
      <div class="uv-label">UV Index</div>
    </div>
    <div class="uv-details">
      <div class="uv-level" style="color: ${color}">${level}</div>
      <div class="uv-warning">${warning}</div>
      <div class="uv-tips">
        ${uvi >= 6 ? '☀️ Peak sun 10am-4pm' : ''}
        ${uvi >= 3 ? '🧴 Apply sunscreen regularly' : ''}
        ${uvi >= 8 ? '🕶️ Wear UV-blocking sunglasses' : ''}
        ${uvi >= 8 ? '👒 Cover exposed skin' : ''}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

if (typeof window !== 'undefined') {
  window.renderUVIndexCard = renderUVIndexCard;
}
