/* Clothing Recommendations System */
class ClothingRecommender {
  constructor() {
    // Clothing recommendations based on temperature ranges
    this.recommendations = {
      freezing: {
        range: [-50, 0],
        name: 'Freezing',
        icon: '🧊',
        clothes: ['Heavy winter coat', 'Thermal underwear', 'Wool sweater', 'Winter hat', 'Thick gloves', 'Insulated boots', 'Scarf'],
        colors: ['#60a5fa', '#3b82f6'],
        advice: 'Layer up with thermal clothing and protect exposed skin.'
      },
      cold: {
        range: [0, 10],
        name: 'Cold',
        icon: '❄️',
        clothes: ['Winter jacket', 'Long sleeve shirt', 'Sweater', 'Long pants', 'Closed shoes', 'Light gloves'],
        colors: ['#93c5fd', '#60a5fa'],
        advice: 'Wear warm layers and consider a jacket.'
      },
      cool: {
        range: [10, 18],
        name: 'Cool',
        icon: '🍂',
        clothes: ['Light jacket', 'Long sleeve shirt', 'Jeans', 'Sneakers', 'Light sweater'],
        colors: ['#fbbf24', '#f59e0b'],
        advice: 'A light jacket or sweater should be comfortable.'
      },
      mild: {
        range: [18, 24],
        name: 'Mild',
        icon: '☀️',
        clothes: ['T-shirt', 'Light pants', 'Sneakers', 'Optional light cardigan'],
        colors: ['#fcd34d', '#fbbf24'],
        advice: 'Perfect weather for light clothing. Very comfortable!'
      },
      warm: {
        range: [24, 30],
        name: 'Warm',
        icon: '🌤️',
        clothes: ['T-shirt', 'Shorts', 'Sandals', 'Sunglasses', 'Sun hat'],
        colors: ['#fb923c', '#f97316'],
        advice: 'Light, breathable fabrics recommended. Stay hydrated!'
      },
      hot: {
        range: [30, 38],
        name: 'Hot',
        icon: '🔥',
        clothes: ['Tank top', 'Shorts', 'Sandals', 'Sunglasses', 'Sun hat', 'Light fabrics'],
        colors: ['#f87171', '#ef4444'],
        advice: 'Minimal clothing with UV protection. Drink lots of water!'
      },
      extreme: {
        range: [38, 60],
        name: 'Extreme Heat',
        icon: '🌡️',
        clothes: ['Lightweight breathable top', 'Shorts', 'Open shoes', 'Hat', 'Sunglasses'],
        colors: ['#dc2626', '#b91c1c'],
        advice: 'Stay indoors if possible. UV protection essential. Stay hydrated!'
      }
    };

    // Weather condition specific additions
    this.weatherAdditions = {
      rain: {
        icon: '🌧️',
        items: ['Waterproof jacket', 'Umbrella', 'Waterproof shoes', 'Rain pants (if heavy)'],
        advice: 'Don\'t forget rain gear!'
      },
      drizzle: {
        icon: '🌦️',
        items: ['Light rain jacket', 'Umbrella'],
        advice: 'Light rain expected - bring an umbrella.'
      },
      snow: {
        icon: '❄️',
        items: ['Snow boots', 'Waterproof gloves', 'Extra warm layers'],
        advice: 'Snow conditions - dress warmly and stay dry.'
      },
      thunderstorm: {
        icon: '⛈️',
        items: ['Waterproof jacket', 'Umbrella', 'Waterproof shoes'],
        advice: 'Storms expected - stay safe and dry!'
      },
      clear: {
        icon: '☀️',
        items: ['Sunglasses', 'Sunscreen', 'Hat (if sunny)'],
        advice: 'Clear skies - protect yourself from sun.'
      },
      clouds: {
        icon: '☁️',
        items: [],
        advice: 'Cloudy but dry - dress for temperature.'
      },
      wind: {
        icon: '💨',
        items: ['Windbreaker', 'Secure hat'],
        advice: 'Windy conditions - wear layers.'
      }
    };
  }

  // Get clothing recommendation based on temperature
  getTemperatureRecommendation(tempC) {
    for (const [key, category] of Object.entries(this.recommendations)) {
      if (tempC >= category.range[0] && tempC < category.range[1]) {
        return category;
      }
    }
    // Default to extreme heat if over 60°C
    return this.recommendations.extreme;
  }

  // Get weather condition additions
  getWeatherAdditions(weatherMain, weatherDescription, windSpeed) {
    const additions = { items: [], advice: [], icons: [] };
    
    // Check weather condition
    const mainLower = (weatherMain || '').toLowerCase();
    const descLower = (weatherDescription || '').toLowerCase();
    
    if (mainLower.includes('rain') || descLower.includes('rain')) {
      const rainType = descLower.includes('heavy') || descLower.includes('moderate') ? 'rain' : 'drizzle';
      const rainInfo = this.weatherAdditions[rainType];
      additions.items.push(...rainInfo.items);
      additions.advice.push(rainInfo.advice);
      additions.icons.push(rainInfo.icon);
    }
    
    if (mainLower.includes('snow') || descLower.includes('snow')) {
      const snowInfo = this.weatherAdditions.snow;
      additions.items.push(...snowInfo.items);
      additions.advice.push(snowInfo.advice);
      additions.icons.push(snowInfo.icon);
    }
    
    if (mainLower.includes('thunder') || descLower.includes('thunder')) {
      const thunderInfo = this.weatherAdditions.thunderstorm;
      additions.items.push(...thunderInfo.items);
      additions.advice.push(thunderInfo.advice);
      additions.icons.push(thunderInfo.icon);
    }
    
    if (mainLower.includes('clear')) {
      const clearInfo = this.weatherAdditions.clear;
      additions.items.push(...clearInfo.items);
      additions.advice.push(clearInfo.advice);
      additions.icons.push(clearInfo.icon);
    }
    
    // Check wind speed (assuming m/s)
    if (windSpeed > 8) {
      const windInfo = this.weatherAdditions.wind;
      additions.items.push(...windInfo.items);
      additions.advice.push(windInfo.advice);
      additions.icons.push(windInfo.icon);
    }
    
    return additions;
  }

  // Generate complete recommendation
  generateRecommendation(weatherData, units = 'metric') {
    if (!weatherData || !weatherData.current) return null;

    const current = weatherData.current;
    const tempC = units === 'metric' ? current.temp : (current.temp - 32) * 5/9;
    const windMs = units === 'metric' ? current.wind_speed : current.wind_speed / 2.23694;
    
    const tempRec = this.getTemperatureRecommendation(tempC);
    const weatherMain = current.weather?.[0]?.main;
    const weatherDesc = current.weather?.[0]?.description;
    const weatherAdditions = this.getWeatherAdditions(weatherMain, weatherDesc, windMs);

    // Combine all items
    const allItems = [...tempRec.clothes, ...weatherAdditions.items];
    const allAdvice = [tempRec.advice, ...weatherAdditions.advice];
    const allIcons = [tempRec.icon, ...weatherAdditions.icons];

    return {
      temperature: {
        value: Math.round(tempC),
        category: tempRec.name,
        icon: tempRec.icon,
        colors: tempRec.colors
      },
      clothing: [...new Set(allItems)], // Remove duplicates
      advice: allAdvice,
      icons: allIcons,
      weather: {
        main: weatherMain,
        description: weatherDesc,
        wind: windMs
      }
    };
  }
}

// Initialize global instance
window.clothingRecommender = new ClothingRecommender();

// Render clothing recommendations card
function renderClothingRecommendations() {
  if (!window.state || !window.state.weather) return;

  const recommendation = window.clothingRecommender.generateRecommendation(
    window.state.weather,
    window.state.units
  );

  if (!recommendation) return;

  const container = document.getElementById('clothing-recommendations-card');
  if (!container) return;

  const gradient = `linear-gradient(135deg, ${recommendation.temperature.colors[0]}, ${recommendation.temperature.colors[1]})`;

  container.innerHTML = `
    <div class="clothing-card">
      <div class="clothing-header" style="background: ${gradient};">
        <div class="clothing-temp">
          <span class="temp-icon">${recommendation.temperature.icon}</span>
          <span class="temp-value">${recommendation.temperature.value}°</span>
        </div>
        <h3>What to Wear</h3>
        <p class="temp-category">${recommendation.temperature.category} Weather</p>
      </div>
      
      <div class="clothing-body">
        <div class="clothing-items">
          ${recommendation.clothing.map(item => `
            <div class="clothing-item">
              <span class="item-bullet">•</span>
              <span class="item-text">${item}</span>
            </div>
          `).join('')}
        </div>
        
        ${recommendation.advice.length > 0 ? `
          <div class="clothing-advice">
            ${recommendation.icons.map((icon, i) => `
              <div class="advice-item">
                <span class="advice-icon">${icon}</span>
                <span class="advice-text">${recommendation.advice[i]}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Auto-render when weather data is available
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    renderClothingRecommendations();
  });
}
