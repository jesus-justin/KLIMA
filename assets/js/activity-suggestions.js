/* Weather-Based Activity Suggestions */
class ActivitySuggestions {
  constructor() {
    this.activities = {
      // Indoor activities
      indoor: [
        { name: 'Read a Book', icon: '📚', conditions: ['rain', 'storm', 'cold', 'hot'] },
        { name: 'Watch Movies', icon: '🎬', conditions: ['rain', 'storm', 'cold'] },
        { name: 'Cook Something New', icon: '🍳', conditions: ['rain', 'cold', 'hot'] },
        { name: 'Indoor Workout', icon: '🏋️', conditions: ['rain', 'storm', 'cold', 'extreme-heat'] },
        { name: 'Board Games', icon: '🎲', conditions: ['rain', 'storm', 'cold'] },
        { name: 'Museum Visit', icon: '🏛️', conditions: ['rain', 'cold', 'hot'] },
        { name: 'Shopping Mall', icon: '🛍️', conditions: ['rain', 'storm', 'extreme-heat', 'cold'] },
        { name: 'Yoga/Meditation', icon: '🧘', conditions: ['rain', 'any'] },
        { name: 'Art & Crafts', icon: '🎨', conditions: ['rain', 'cold', 'any'] },
        { name: 'Video Gaming', icon: '🎮', conditions: ['rain', 'storm', 'extreme-heat', 'cold'] },
        { name: 'Baking', icon: '🧁', conditions: ['rain', 'cold'] },
        { name: 'Listen to Podcasts', icon: '🎧', conditions: ['any'] }
      ],
      
      // Outdoor activities
      outdoor: [
        { name: 'Hiking', icon: '🥾', conditions: ['clear', 'mild', 'cool'], avoid: ['rain', 'storm', 'extreme-heat'] },
        { name: 'Cycling', icon: '🚴', conditions: ['clear', 'mild', 'warm'], avoid: ['rain', 'storm', 'strong-wind'] },
        { name: 'Picnic', icon: '🧺', conditions: ['clear', 'mild', 'warm'], avoid: ['rain', 'storm', 'wind'] },
        { name: 'Beach Day', icon: '🏖️', conditions: ['clear', 'warm', 'hot'], avoid: ['cold', 'rain'] },
        { name: 'Photography', icon: '📸', conditions: ['clear', 'clouds', 'mild'], avoid: ['rain', 'storm'] },
        { name: 'Bird Watching', icon: '🦜', conditions: ['clear', 'mild', 'cool'], avoid: ['rain', 'storm', 'wind'] },
        { name: 'Outdoor Yoga', icon: '🌳', conditions: ['clear', 'mild'], avoid: ['rain', 'storm', 'wind'] },
        { name: 'Park Visit', icon: '🌲', conditions: ['clear', 'mild', 'warm'], avoid: ['rain', 'storm'] },
        { name: 'Skateboarding', icon: '🛹', conditions: ['clear', 'mild'], avoid: ['rain', 'wet'] },
        { name: 'Fishing', icon: '🎣', conditions: ['clear', 'clouds', 'mild'], avoid: ['storm', 'strong-wind'] },
        { name: 'Gardening', icon: '🌱', conditions: ['clear', 'mild', 'warm'], avoid: ['rain', 'storm'] },
        { name: 'Stargazing', icon: '⭐', conditions: ['clear-night'], avoid: ['clouds', 'rain'] }
      ],
      
      // Weather-specific activities
      special: [
        { name: 'Puddle Jumping', icon: '🌧️', conditions: ['rain'], note: 'Perfect rainy day fun!' },
        { name: 'Build a Snowman', icon: '⛄', conditions: ['snow'], note: 'Snow day special!' },
        { name: 'Hot Chocolate Time', icon: '☕', conditions: ['cold', 'snow'], note: 'Warm up!' },
        { name: 'Ice Cream Outing', icon: '🍦', conditions: ['hot', 'warm'], note: 'Beat the heat!' },
        { name: 'Storm Watching', icon: '⛈️', conditions: ['storm'], note: 'From a safe place!' },
        { name: 'Splash in Rain', icon: '☔', conditions: ['light-rain'], note: 'Don\'t forget your umbrella!' }
      ]
    };
  }

  // Analyze weather and determine conditions
  analyzeWeather(weatherData, units) {
    const current = weatherData.current;
    const tempC = units === 'metric' ? current.temp : (current.temp - 32) * 5/9;
    const windMs = units === 'metric' ? current.wind_speed : current.wind_speed / 2.23694;
    const weatherMain = (current.weather?.[0]?.main || '').toLowerCase();
    const weatherDesc = (current.weather?.[0]?.description || '').toLowerCase();
    const isDay = current.dt > current.sunrise && current.dt < current.sunset;
    const rain = current.rain?.['1h'] || current.precip || 0;

    const conditions = [];

    // Temperature conditions
    if (tempC < 0) conditions.push('freezing', 'cold');
    else if (tempC < 10) conditions.push('cold');
    else if (tempC < 18) conditions.push('cool');
    else if (tempC < 25) conditions.push('mild');
    else if (tempC < 32) conditions.push('warm');
    else if (tempC < 38) conditions.push('hot');
    else conditions.push('extreme-heat');

    // Weather conditions
    if (weatherMain === 'clear') {
      conditions.push('clear');
      if (!isDay) conditions.push('clear-night');
    }
    if (weatherMain === 'clouds') conditions.push('clouds');
    if (weatherMain === 'rain') {
      if (rain < 2) conditions.push('light-rain');
      conditions.push('rain');
    }
    if (weatherMain === 'snow') conditions.push('snow');
    if (weatherMain === 'thunderstorm') conditions.push('storm');
    
    // Wind conditions
    if (windMs > 10) conditions.push('wind', 'strong-wind');
    
    // Wet conditions
    if (weatherMain === 'rain' || weatherDesc.includes('rain')) {
      conditions.push('wet');
    }

    return conditions;
  }

  // Get activity suggestions
  getSuggestions(weatherData, units) {
    if (!weatherData || !weatherData.current) return null;

    const conditions = this.analyzeWeather(weatherData, units);
    const suggestions = {
      indoor: [],
      outdoor: [],
      special: []
    };

    // Check indoor activities
    for (const activity of this.activities.indoor) {
      if (activity.conditions.includes('any') || 
          activity.conditions.some(cond => conditions.includes(cond))) {
        suggestions.indoor.push(activity);
      }
    }

    // Check outdoor activities
    for (const activity of this.activities.outdoor) {
      const meetsConditions = activity.conditions.some(cond => conditions.includes(cond));
      const hasAvoid = activity.avoid && activity.avoid.some(cond => conditions.includes(cond));
      
      if (meetsConditions && !hasAvoid) {
        suggestions.outdoor.push(activity);
      }
    }

    // Check special activities
    for (const activity of this.activities.special) {
      if (activity.conditions.some(cond => conditions.includes(cond))) {
        suggestions.special.push(activity);
      }
    }

    // Shuffle and limit results
    suggestions.indoor = this.shuffle(suggestions.indoor).slice(0, 6);
    suggestions.outdoor = this.shuffle(suggestions.outdoor).slice(0, 6);
    suggestions.special = this.shuffle(suggestions.special).slice(0, 3);

    return {
      conditions,
      suggestions,
      weather: weatherData.current.weather?.[0]?.main
    };
  }

  // Shuffle array
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Initialize global instance
window.activitySuggestions = new ActivitySuggestions();

// Render activity suggestions card
function renderActivitySuggestions() {
  if (!window.state || !window.state.weather) return;

  const result = window.activitySuggestions.getSuggestions(
    window.state.weather,
    window.state.units
  );

  if (!result) return;

  const container = document.getElementById('activity-suggestions-card');
  if (!container) return;

  const { suggestions, weather } = result;
  const hasOutdoor = suggestions.outdoor.length > 0;
  const hasSpecial = suggestions.special.length > 0;

  container.innerHTML = `
    <div class="activity-card">
      <div class="activity-header">
        <h3>🎯 Activity Suggestions</h3>
        <p class="activity-subtitle">Based on current weather conditions</p>
      </div>

      ${hasSpecial ? `
        <div class="activity-section special-section">
          <h4>✨ Perfect for Today</h4>
          <div class="activity-grid special-grid">
            ${suggestions.special.map(activity => `
              <div class="activity-item special-item">
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-name">${activity.name}</span>
                ${activity.note ? `<span class="activity-note">${activity.note}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${hasOutdoor ? `
        <div class="activity-section">
          <h4>🌳 Outdoor Activities</h4>
          <div class="activity-grid">
            ${suggestions.outdoor.map(activity => `
              <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-name">${activity.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="activity-section">
        <h4>🏠 Indoor Activities</h4>
        <div class="activity-grid">
          ${suggestions.indoor.map(activity => `
            <div class="activity-item">
              <span class="activity-icon">${activity.icon}</span>
              <span class="activity-name">${activity.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Auto-render when weather data is available
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    renderActivitySuggestions();
  });
}
