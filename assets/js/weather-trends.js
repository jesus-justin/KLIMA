/* KLIMA Weather Trends */

function analyzeWeatherTrends(weather, units) {
  if (!weather || !weather.hourly || weather.hourly.length < 2) {
    return { tempTrend: null, windTrend: null, precipTrend: null };
  }
  
  const current = weather.current;
  const next = weather.hourly[0];
  const later = weather.hourly[Math.min(2, weather.hourly.length - 1)];
  
  const currentTemp = units === 'metric' ? current.temp : (current.temp - 32) * 5 / 9;
  const nextTemp = units === 'metric' ? next.temp : (next.temp - 32) * 5 / 9;
  const laterTemp = units === 'metric' ? later.temp : (later.temp - 32) * 5 / 9;
  
  const currentWind = units === 'metric' ? current.wind_speed : current.wind_speed / 2.23694;
  const nextWind = units === 'metric' ? next.wind_speed : next.wind_speed / 2.23694;
  
  const currentPrecip = current.rain?.['1h'] || current.precip || 0;
  const nextPrecip = next.rain?.['1h'] || next.precip || 0;
  
  // Temperature trend
  let tempTrend = '→'; // steady
  if (nextTemp > currentTemp + 0.5) tempTrend = '↑';
  else if (nextTemp < currentTemp - 0.5) tempTrend = '↓';
  
  // Wind trend
  let windTrend = '→';
  if (nextWind > currentWind + 0.5) windTrend = '↑';
  else if (nextWind < currentWind - 0.5) windTrend = '↓';
  
  // Precipitation trend
  let precipTrend = '→';
  if (nextPrecip > currentPrecip * 1.2) precipTrend = '↑';
  else if (nextPrecip < currentPrecip * 0.8) precipTrend = '↓';
  
  return {
    tempTrend: { symbol: tempTrend, change: (nextTemp - currentTemp).toFixed(1), direction: tempTrend },
    windTrend: { symbol: windTrend, change: (nextWind - currentWind).toFixed(1), direction: windTrend },
    precipTrend: { symbol: precipTrend, direction: precipTrend }
  };
}

function renderTrendIndicators(trends) {
  const tempEl = document.getElementById('temp-trend-indicator');
  const windEl = document.getElementById('wind-trend-indicator');
  
  if (tempEl && trends.tempTrend) {
    const trendClass = trends.tempTrend.direction === '↑' ? 'warming' : 
                       trends.tempTrend.direction === '↓' ? 'cooling' : 'steady';
    tempEl.innerHTML = `
      <span class="trend-arrow ${trendClass}" title="Temperature ${trends.tempTrend.change}°">${trends.tempTrend.symbol}</span>
      <span class="trend-label">Temp</span>
    `;
  }
  
  if (windEl && trends.windTrend) {
    const trendClass = trends.windTrend.direction === '↑' ? 'increasing' : 
                       trends.windTrend.direction === '↓' ? 'decreasing' : 'steady';
    windEl.innerHTML = `
      <span class="trend-arrow ${trendClass}" title="Wind change: ${trends.windTrend.change}">${trends.windTrend.symbol}</span>
      <span class="trend-label">Wind</span>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.analyzeWeatherTrends = analyzeWeatherTrends;
  window.renderTrendIndicators = renderTrendIndicators;
}
