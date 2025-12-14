/* Quick Weather Comparison Widget */
class QuickComparison {
  constructor() {
    this.storageKey = 'klima:quick-compare';
    this.maxLocations = 3;
  }

  // Get saved comparison locations
  getComparisonLocations() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load comparison locations:', e);
      return [];
    }
  }

  // Save comparison locations
  saveComparisonLocations(locations) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(locations));
    } catch (e) {
      console.error('Failed to save comparison locations:', e);
    }
  }

  // Add location to comparison
  addLocation(location, weather) {
    if (!location || !weather) return false;

    const locations = this.getComparisonLocations();
    
    // Check if location already exists
    const exists = locations.some(loc => 
      loc.location.name === location.name
    );

    if (exists) return false;

    // Add new location
    locations.push({
      location: location,
      weather: {
        temp: weather.current.temp,
        feels_like: weather.current.feels_like,
        humidity: weather.current.humidity,
        weather: weather.current.weather?.[0]?.main,
        description: weather.current.weather?.[0]?.description,
        icon: weather.current.weather?.[0]?.icon
      },
      timestamp: Date.now()
    });

    // Keep only max locations
    if (locations.length > this.maxLocations) {
      locations.shift(); // Remove oldest
    }

    this.saveComparisonLocations(locations);
    return true;
  }

  // Remove location from comparison
  removeLocation(locationName) {
    let locations = this.getComparisonLocations();
    locations = locations.filter(loc => loc.location.name !== locationName);
    this.saveComparisonLocations(locations);
  }

  // Clear all comparisons
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.error('Failed to clear comparisons:', e);
    }
  }

  // Get temperature comparison emoji
  getTempEmoji(tempC) {
    if (tempC < 0) return '🥶';
    if (tempC < 10) return '❄️';
    if (tempC < 18) return '😊';
    if (tempC < 25) return '☀️';
    if (tempC < 32) return '🌡️';
    return '🔥';
  }

  // Get weather emoji
  getWeatherEmoji(weatherMain) {
    const emojiMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return emojiMap[weatherMain] || '🌤️';
  }
}

// Initialize global instance
window.quickComparison = new QuickComparison();

// Render quick comparison widget
function renderQuickComparison() {
  const container = document.getElementById('quick-compare-widget');
  if (!container) return;

  const locations = window.quickComparison.getComparisonLocations();
  const currentLocation = window.state?.location;

  if (locations.length === 0) {
    container.innerHTML = `
      <div class="quick-compare-card empty">
        <h3>⚖️ Quick Compare</h3>
        <p class="compare-hint">Add locations to compare weather side-by-side</p>
        ${currentLocation ? `
          <button id="add-current-compare" class="add-compare-btn">
            Add ${currentLocation.name} to Compare
          </button>
        ` : ''}
      </div>
    `;

    document.getElementById('add-current-compare')?.addEventListener('click', () => {
      if (window.state && window.state.location && window.state.weather) {
        window.quickComparison.addLocation(window.state.location, window.state.weather);
        renderQuickComparison();
      }
    });
    return;
  }

  container.innerHTML = `
    <div class="quick-compare-card">
      <div class="compare-header">
        <h3>⚖️ Quick Compare</h3>
        <div class="compare-actions">
          ${currentLocation && !locations.some(l => l.location.name === currentLocation.name) ? `
            <button id="add-current-compare" class="icon-btn" title="Add current location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          ` : ''}
          <button id="clear-compare" class="icon-btn" title="Clear all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="compare-grid">
        ${locations.map(item => {
          const tempEmoji = window.quickComparison.getTempEmoji(item.weather.temp);
          const weatherEmoji = window.quickComparison.getWeatherEmoji(item.weather.weather);
          const timeSince = Math.round((Date.now() - item.timestamp) / 60000);
          
          return `
            <div class="compare-location">
              <button class="remove-location" data-location="${item.location.name}" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div class="location-name">${item.location.name}</div>
              <div class="temp-display">
                <span class="temp-emoji">${tempEmoji}</span>
                <span class="temp-value">${Math.round(item.weather.temp)}°</span>
              </div>
              <div class="weather-display">
                <span class="weather-emoji">${weatherEmoji}</span>
                <span class="weather-text">${item.weather.weather}</span>
              </div>
              <div class="weather-details">
                <span>Feels ${Math.round(item.weather.feels_like)}°</span>
                <span>${item.weather.humidity}% humidity</span>
              </div>
              <div class="time-since">${timeSince < 1 ? 'Just now' : `${timeSince}m ago`}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Add event listeners
  document.getElementById('add-current-compare')?.addEventListener('click', () => {
    if (window.state && window.state.location && window.state.weather) {
      const added = window.quickComparison.addLocation(window.state.location, window.state.weather);
      if (added) {
        renderQuickComparison();
      }
    }
  });

  document.getElementById('clear-compare')?.addEventListener('click', () => {
    if (confirm('Clear all comparison locations?')) {
      window.quickComparison.clearAll();
      renderQuickComparison();
    }
  });

  document.querySelectorAll('.remove-location').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const locationName = e.currentTarget.dataset.location;
      window.quickComparison.removeLocation(locationName);
      renderQuickComparison();
    });
  });
}

// Auto-render when weather loads
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    renderQuickComparison();
  });
}
