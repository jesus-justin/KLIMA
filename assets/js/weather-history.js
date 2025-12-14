/* Weather History Tracking */
class WeatherHistory {
  constructor() {
    this.storageKey = 'klima:weather-history';
    this.maxEntries = 100; // Keep last 100 weather checks
  }

  // Record current weather data
  recordWeather(location, weatherData) {
    if (!location || !weatherData) return;

    const history = this.getHistory();
    const entry = {
      timestamp: Date.now(),
      location: {
        name: location.name,
        lat: location.lat,
        lon: location.lon
      },
      weather: {
        temp: weatherData.current.temp,
        feels_like: weatherData.current.feels_like,
        humidity: weatherData.current.humidity,
        wind_speed: weatherData.current.wind_speed,
        description: weatherData.current.weather?.[0]?.description,
        icon: weatherData.current.weather?.[0]?.icon
      }
    };

    history.unshift(entry); // Add to beginning

    // Keep only max entries
    if (history.length > this.maxEntries) {
      history.splice(this.maxEntries);
    }

    this.saveHistory(history);
  }

  // Get all history
  getHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load weather history:', e);
      return [];
    }
  }

  // Save history
  saveHistory(history) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save weather history:', e);
    }
  }

  // Get history for specific location
  getLocationHistory(locationName) {
    const history = this.getHistory();
    return history.filter(entry => 
      entry.location.name.toLowerCase() === locationName.toLowerCase()
    );
  }

  // Get temperature trends for a location (last 30 days)
  getTemperatureTrends(locationName) {
    const history = this.getLocationHistory(locationName);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    return history
      .filter(entry => entry.timestamp >= thirtyDaysAgo)
      .map(entry => ({
        timestamp: entry.timestamp,
        temp: entry.weather.temp,
        feels_like: entry.weather.feels_like
      }))
      .reverse(); // Oldest first for chart
  }

  // Get statistics for a location
  getLocationStats(locationName) {
    const history = this.getLocationHistory(locationName);
    
    if (history.length === 0) {
      return null;
    }

    const temps = history.map(e => e.weather.temp);
    const humidity = history.map(e => e.weather.humidity);
    
    return {
      checksCount: history.length,
      avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      maxTemp: Math.max(...temps).toFixed(1),
      minTemp: Math.min(...temps).toFixed(1),
      avgHumidity: Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length),
      firstCheck: history[history.length - 1].timestamp,
      lastCheck: history[0].timestamp
    };
  }

  // Clear all history
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.error('Failed to clear weather history:', e);
    }
  }

  // Export history as JSON
  exportHistory() {
    const history = this.getHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `klima-weather-history-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

// Initialize global instance
window.weatherHistory = new WeatherHistory();

// Render history widget on main page
function renderWeatherHistory() {
  if (!window.state || !window.state.location) return;

  const locationName = window.state.location.name;
  const stats = window.weatherHistory.getLocationStats(locationName);
  
  const container = document.getElementById('history-widget');
  if (!container) return;

  if (!stats) {
    container.innerHTML = `
      <div class="history-card">
        <h3>📊 Weather History</h3>
        <p style="opacity: 0.7; margin-top: 8px;">No history yet for this location.</p>
      </div>
    `;
    return;
  }

  const firstDate = new Date(stats.firstCheck).toLocaleDateString();
  const lastDate = new Date(stats.lastCheck).toLocaleDateString();

  container.innerHTML = `
    <div class="history-card">
      <h3>📊 Weather History for ${locationName}</h3>
      <div class="history-stats">
        <div class="stat-item">
          <span class="stat-label">Total Checks</span>
          <span class="stat-value">${stats.checksCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Temperature</span>
          <span class="stat-value">${stats.avgTemp}°</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Max Temperature</span>
          <span class="stat-value">${stats.maxTemp}°</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Min Temperature</span>
          <span class="stat-value">${stats.minTemp}°</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Humidity</span>
          <span class="stat-value">${stats.avgHumidity}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">First Check</span>
          <span class="stat-value">${firstDate}</span>
        </div>
      </div>
      <button id="btn-view-history-chart" class="secondary" style="margin-top: 12px; width: 100%;">
        View Temperature Trends
      </button>
    </div>
  `;

  // Add click handler for chart button
  document.getElementById('btn-view-history-chart')?.addEventListener('click', () => {
    showHistoryChart(locationName);
  });
}

// Show history chart in modal
function showHistoryChart(locationName) {
  const trends = window.weatherHistory.getTemperatureTrends(locationName);
  
  if (trends.length === 0) {
    alert('Not enough history data to show trends. Check the weather a few more times!');
    return;
  }

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'history-modal';
  modal.innerHTML = `
    <div class="history-modal-content">
      <div class="history-modal-header">
        <h2>Temperature Trends - ${locationName}</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="history-modal-body">
        <canvas id="history-chart"></canvas>
        <p style="margin-top: 16px; opacity: 0.7; text-align: center;">
          Showing ${trends.length} data points from the last 30 days
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handler
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.remove();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Create chart
  const ctx = document.getElementById('history-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.map(t => new Date(t.timestamp).toLocaleDateString()),
      datasets: [
        {
          label: 'Temperature',
          data: trends.map(t => t.temp),
          borderColor: 'rgb(56, 189, 248)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Feels Like',
          data: trends.map(t => t.feels_like),
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          fill: true,
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: 'var(--text)',
            font: { size: 12 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          ticks: { color: 'var(--text)', maxRotation: 45, minRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          ticks: { color: 'var(--text)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

// Auto-record weather when it's fetched
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    if (window.state && window.state.location && window.state.weather) {
      window.weatherHistory.recordWeather(window.state.location, window.state.weather);
      renderWeatherHistory();
    }
  });
}
