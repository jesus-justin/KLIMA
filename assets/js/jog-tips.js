/* KLIMA Jog Tips Generator */

function generateJogTips(weather, units) {
  if (!weather || !weather.current) return [];
  
  const c = weather.current;
  const tempC = units === 'metric' ? c.temp : (c.temp - 32) * 5 / 9;
  const windMs = units === 'metric' ? c.wind_speed : c.wind_speed / 2.23694;
  const pop = weather.hourly?.[0]?.pop || 0;
  const uvIndex = c.uvi || 0;
  const humidity = c.humidity || 0;
  
  const tips = [];
  
  // Temperature-based tips
  if (tempC < 0) {
    tips.push({
      icon: '❄️',
      text: 'Freezing temps—wear thermal layers and protect extremities',
      category: 'temperature'
    });
  } else if (tempC < 10) {
    tips.push({
      icon: '🧥',
      text: 'Cold conditions—bring a windproof jacket',
      category: 'temperature'
    });
  } else if (tempC >= 10 && tempC <= 18) {
    tips.push({
      icon: '✨',
      text: 'Perfect jog weather—light jacket recommended',
      category: 'temperature'
    });
  } else if (tempC > 18 && tempC <= 26) {
    tips.push({
      icon: '🌤️',
      text: 'Ideal conditions—wear moisture-wicking clothes',
      category: 'temperature'
    });
  } else if (tempC > 26 && tempC <= 32) {
    tips.push({
      icon: '☀️',
      text: 'Warm weather—drink extra water and seek shade on breaks',
      category: 'temperature'
    });
  } else {
    tips.push({
      icon: '🌡️',
      text: 'Very hot—jog early morning or evening; increase hydration',
      category: 'temperature'
    });
  }
  
  // Humidity tips
  if (humidity > 80) {
    tips.push({
      icon: '💧',
      text: 'High humidity—increase water intake and slow pace',
      category: 'humidity'
    });
  } else if (humidity > 70) {
    tips.push({
      icon: '💦',
      text: 'Moderate humidity—bring water and take breaks',
      category: 'humidity'
    });
  } else if (humidity < 30) {
    tips.push({
      icon: '🌵',
      text: 'Low humidity—watch for dehydration despite feeling cool',
      category: 'humidity'
    });
  }
  
  // Wind tips
  if (windMs > 8) {
    tips.push({
      icon: '💨',
      text: 'Strong winds—expect resistance on the return leg',
      category: 'wind'
    });
  } else if (windMs > 5) {
    tips.push({
      icon: '🌬️',
      text: 'Breezy conditions—run with it to your advantage',
      category: 'wind'
    });
  } else if (windMs < 1) {
    tips.push({
      icon: '🍃',
      text: 'Still air—watch for heat buildup; may feel hotter',
      category: 'wind'
    });
  }
  
  // Rain tips
  if (pop > 0.8) {
    tips.push({
      icon: '🌧️',
      text: 'Heavy rain likely—consider a treadmill or reschedule',
      category: 'precipitation'
    });
  } else if (pop > 0.5) {
    tips.push({
      icon: '☔',
      text: 'Likely showers—wear reflective gear and avoid slippery paths',
      category: 'precipitation'
    });
  } else if (pop > 0.2) {
    tips.push({
      icon: '🌦️',
      text: 'Possible rain—bring a light rain jacket just in case',
      category: 'precipitation'
    });
  }
  
  // UV tips
  if (uvIndex >= 11) {
    tips.push({
      icon: '☀️🔴',
      text: 'Extreme UV—apply SPF 50+ sunscreen; avoid midday',
      category: 'uv'
    });
  } else if (uvIndex >= 8) {
    tips.push({
      icon: '☀️🟠',
      text: 'Very high UV—use SPF 30+ and wear a hat',
      category: 'uv'
    });
  } else if (uvIndex >= 6) {
    tips.push({
      icon: '☀️🟡',
      text: 'High UV—apply sunscreen and wear UV-blocking gear',
      category: 'uv'
    });
  } else if (uvIndex >= 3) {
    tips.push({
      icon: '☀️',
      text: 'Moderate UV—sunscreen recommended',
      category: 'uv'
    });
  }
  
  // Visibility tips (if available)
  if (c.visibility && c.visibility < 5000) {
    tips.push({
      icon: '🌫️',
      text: 'Poor visibility—wear bright colors and use lights',
      category: 'visibility'
    });
  }
  
  return tips;
}

function renderJogTips(tips) {
  const container = document.getElementById('jog-tips-container');
  if (!container) return;
  
  if (!tips || tips.length === 0) {
    container.innerHTML = '<div class="tips-empty">No special conditions today—enjoy your jog!</div>';
    return;
  }
  
  container.innerHTML = tips.map(tip => `
    <div class="tip-card">
      <span class="tip-icon">${tip.icon}</span>
      <span class="tip-text">${tip.text}</span>
    </div>
  `).join('');
}

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.generateJogTips = generateJogTips;
  window.renderJogTips = renderJogTips;
}
