/* Weather Alerts & Warnings Banner */

function generateWeatherAlerts(weather, units) {
  if (!weather || !weather.current) return [];
  
  const alerts = [];
  const c = weather.current;
  const tempC = units === 'metric' ? c.temp : (c.temp - 32) * 5/9;
  const windMs = units === 'metric' ? c.wind_speed : c.wind_speed / 2.23694;
  const pop = weather.daily?.[0]?.pop || 0;

  // Extreme Heat
  if (tempC > 38) {
    alerts.push({
      type: 'heat',
      icon: '🔥',
      title: 'Extreme Heat Warning',
      message: `Temperature is ${Math.round(tempC)}°C. Avoid jogging during peak hours (10 AM - 4 PM).`,
      severity: 'critical'
    });
  } else if (tempC > 32) {
    alerts.push({
      type: 'heat',
      icon: '⚠️',
      title: 'Heat Alert',
      message: `High temperature (${Math.round(tempC)}°C). Jog early morning or evening.`,
      severity: 'warning'
    });
  }

  // Extreme Cold
  if (tempC < -10) {
    alerts.push({
      type: 'cold',
      icon: '❄️',
      title: 'Extreme Cold Warning',
      message: `Temperature is ${Math.round(tempC)}°C. Risk of frostbite. Cover all exposed skin.`,
      severity: 'critical'
    });
  } else if (tempC < 0) {
    alerts.push({
      type: 'cold',
      icon: '🥶',
      title: 'Cold Alert',
      message: `Temperature below freezing (${Math.round(tempC)}°C). Wear thermal gear.`,
      severity: 'warning'
    });
  }

  // Strong Wind
  if (windMs > 15) {
    alerts.push({
      type: 'wind',
      icon: '💨',
      title: 'Severe Wind Warning',
      message: `Strong winds at ${windMs.toFixed(1)} m/s. Avoid exposed areas.`,
      severity: 'critical'
    });
  } else if (windMs > 10) {
    alerts.push({
      type: 'wind',
      icon: '🌬️',
      title: 'Windy Conditions',
      message: `Moderate winds (${windMs.toFixed(1)} m/s). Plan your route accordingly.`,
      severity: 'info'
    });
  }

  // Heavy Rain
  if (pop > 80) {
    alerts.push({
      type: 'rain',
      icon: '🌧️',
      title: 'Heavy Rain Expected',
      message: `${Math.round(pop * 100)}% chance of rain. Consider indoor activities.`,
      severity: 'warning'
    });
  } else if (pop > 50) {
    alerts.push({
      type: 'rain',
      icon: '🌦️',
      title: 'Rain Likely',
      message: `${Math.round(pop * 100)}% chance of rain. Bring an umbrella.`,
      severity: 'info'
    });
  }

  // High UV
  if (c.uvi > 8) {
    alerts.push({
      type: 'uv',
      icon: '☀️',
      title: 'Extreme UV Index',
      message: `UV Index is very high (${c.uvi}). Apply SPF 50+ sunscreen.`,
      severity: 'critical'
    });
  } else if (c.uvi > 6) {
    alerts.push({
      type: 'uv',
      icon: '🌞',
      title: 'High UV Index',
      message: `UV Index is high (${c.uvi}). Use SPF 30+ sunscreen.`,
      severity: 'warning'
    });
  }

  return alerts;
}

function renderWeatherAlerts() {
  if (!state.weather) return;

  const alerts = generateWeatherAlerts(state.weather, state.units);
  const container = document.getElementById('weather-alerts-container');
  
  if (!container || alerts.length === 0) {
    if (container) container.innerHTML = '';
    return;
  }

  const alertsHTML = alerts.map(alert => {
    const severityClass = alert.severity === 'critical' ? 'critical' : 
                          alert.severity === 'warning' ? 'warning' : 'info';
    
    return `
      <div class="alert-banner ${severityClass}" role="alert">
        <div class="alert-content">
          <span class="alert-icon">${alert.icon}</span>
          <div class="alert-text">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-message">${alert.message}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = alertsHTML;
}

window.generateWeatherAlerts = generateWeatherAlerts;
window.renderWeatherAlerts = renderWeatherAlerts;
