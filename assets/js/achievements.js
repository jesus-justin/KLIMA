/* Weather Achievements and Badges System */
class WeatherAchievements {
  constructor() {
    this.storageKey = 'klima:achievements';
    
    // Define all available achievements
    this.achievements = {
      // Weather condition achievements
      sunChaser: {
        id: 'sunChaser',
        name: 'Sun Chaser',
        description: 'Check weather on a clear sunny day',
        icon: '☀️',
        condition: (weather) => {
          const main = weather.current?.weather?.[0]?.main?.toLowerCase();
          return main === 'clear';
        }
      },
      stormWatcher: {
        id: 'stormWatcher',
        name: 'Storm Watcher',
        description: 'Check weather during a thunderstorm',
        icon: '⛈️',
        condition: (weather) => {
          const main = weather.current?.weather?.[0]?.main?.toLowerCase();
          return main === 'thunderstorm';
        }
      },
      snowExplorer: {
        id: 'snowExplorer',
        name: 'Snow Explorer',
        description: 'Check weather during snow',
        icon: '❄️',
        condition: (weather) => {
          const main = weather.current?.weather?.[0]?.main?.toLowerCase();
          return main === 'snow';
        }
      },
      rainyDayFan: {
        id: 'rainyDayFan',
        name: 'Rainy Day Fan',
        description: 'Check weather during rain',
        icon: '🌧️',
        condition: (weather) => {
          const main = weather.current?.weather?.[0]?.main?.toLowerCase();
          return main === 'rain';
        }
      },
      
      // Temperature achievements
      heatSeeker: {
        id: 'heatSeeker',
        name: 'Heat Seeker',
        description: 'Check weather when temperature is above 35°C',
        icon: '🔥',
        condition: (weather, units) => {
          const temp = units === 'metric' ? weather.current.temp : (weather.current.temp - 32) * 5/9;
          return temp > 35;
        }
      },
      frostBite: {
        id: 'frostBite',
        name: 'Frost Bite',
        description: 'Check weather when temperature is below 0°C',
        icon: '🧊',
        condition: (weather, units) => {
          const temp = units === 'metric' ? weather.current.temp : (weather.current.temp - 32) * 5/9;
          return temp < 0;
        }
      },
      perfectDay: {
        id: 'perfectDay',
        name: 'Perfect Day',
        description: 'Check weather when temperature is between 20-25°C',
        icon: '🌈',
        condition: (weather, units) => {
          const temp = units === 'metric' ? weather.current.temp : (weather.current.temp - 32) * 5/9;
          return temp >= 20 && temp <= 25;
        }
      },
      
      // Usage achievements
      earlyBird: {
        id: 'earlyBird',
        name: 'Early Bird',
        description: 'Check weather before 6 AM',
        icon: '🌅',
        condition: () => {
          const hour = new Date().getHours();
          return hour < 6;
        }
      },
      nightOwl: {
        id: 'nightOwl',
        name: 'Night Owl',
        description: 'Check weather after 11 PM',
        icon: '🦉',
        condition: () => {
          const hour = new Date().getHours();
          return hour >= 23;
        }
      },
      dedicated: {
        id: 'dedicated',
        name: 'Dedicated User',
        description: 'Check weather 10 times',
        icon: '⭐',
        condition: null, // Handled separately
        countBased: true,
        requiredCount: 10
      },
      weatherAddict: {
        id: 'weatherAddict',
        name: 'Weather Addict',
        description: 'Check weather 50 times',
        icon: '🏆',
        condition: null,
        countBased: true,
        requiredCount: 50
      },
      globetrotter: {
        id: 'globetrotter',
        name: 'Globe Trotter',
        description: 'Check weather in 10 different locations',
        icon: '🌍',
        condition: null,
        countBased: true,
        locationBased: true,
        requiredCount: 10
      },
      
      // Special achievements
      windmaster: {
        id: 'windmaster',
        name: 'Wind Master',
        description: 'Check weather when wind speed is above 15 m/s',
        icon: '💨',
        condition: (weather, units) => {
          const wind = units === 'metric' ? weather.current.wind_speed : weather.current.wind_speed / 2.23694;
          return wind > 15;
        }
      },
      moistureSeeker: {
        id: 'moistureSeeker',
        name: 'Moisture Seeker',
        description: 'Check weather when humidity is above 90%',
        icon: '💧',
        condition: (weather) => {
          return weather.current.humidity > 90;
        }
      },
      uvAware: {
        id: 'uvAware',
        name: 'UV Aware',
        description: 'Check weather when UV index is extreme (11+)',
        icon: '🕶️',
        condition: (weather) => {
          return (weather.current.uvi || 0) >= 11;
        }
      }
    };
  }

  // Get user achievements from storage
  getUserAchievements() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {
        unlocked: [],
        checkCount: 0,
        locations: []
      };
    } catch (e) {
      console.error('Failed to load achievements:', e);
      return { unlocked: [], checkCount: 0, locations: [] };
    }
  }

  // Save user achievements
  saveUserAchievements(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }

  // Check and unlock achievements
  checkAchievements(weather, location, units) {
    if (!weather || !location) return [];

    const userData = this.getUserAchievements();
    const newlyUnlocked = [];

    // Increment check count
    userData.checkCount++;

    // Track unique locations
    if (!userData.locations.includes(location.name)) {
      userData.locations.push(location.name);
    }

    // Check each achievement
    for (const [key, achievement] of Object.entries(this.achievements)) {
      // Skip if already unlocked
      if (userData.unlocked.includes(achievement.id)) continue;

      let shouldUnlock = false;

      if (achievement.countBased) {
        // Count-based achievements
        if (achievement.locationBased) {
          shouldUnlock = userData.locations.length >= achievement.requiredCount;
        } else {
          shouldUnlock = userData.checkCount >= achievement.requiredCount;
        }
      } else if (achievement.condition) {
        // Condition-based achievements
        shouldUnlock = achievement.condition(weather, units);
      }

      if (shouldUnlock) {
        userData.unlocked.push(achievement.id);
        newlyUnlocked.push(achievement);
      }
    }

    this.saveUserAchievements(userData);
    return newlyUnlocked;
  }

  // Get all unlocked achievements
  getUnlockedAchievements() {
    const userData = this.getUserAchievements();
    return userData.unlocked.map(id => this.achievements[Object.keys(this.achievements).find(key => this.achievements[key].id === id)]);
  }

  // Get achievement progress
  getProgress() {
    const userData = this.getUserAchievements();
    const total = Object.keys(this.achievements).length;
    const unlocked = userData.unlocked.length;
    
    return {
      total,
      unlocked,
      percentage: Math.round((unlocked / total) * 100),
      checkCount: userData.checkCount,
      locationCount: userData.locations.length
    };
  }

  // Reset all achievements (for testing)
  resetAchievements() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.error('Failed to reset achievements:', e);
    }
  }
}

// Initialize global instance
window.weatherAchievements = new WeatherAchievements();

// Show achievement notification
function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-content">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Trigger confetti if available
  if (window.triggerConfetti) {
    window.triggerConfetti();
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// Render achievements card
function renderAchievementsCard() {
  const container = document.getElementById('achievements-card');
  if (!container) return;

  const progress = window.weatherAchievements.getProgress();
  const unlocked = window.weatherAchievements.getUnlockedAchievements();
  const allAchievements = Object.values(window.weatherAchievements.achievements);

  container.innerHTML = `
    <div class="achievements-card">
      <div class="achievements-header">
        <h3>🏆 Achievements</h3>
        <div class="achievements-progress">
          <span class="progress-text">${progress.unlocked} / ${progress.total}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
          </div>
        </div>
      </div>
      
      <div class="achievements-stats">
        <div class="stat-badge">
          <span class="stat-icon">📍</span>
          <span class="stat-value">${progress.checkCount}</span>
          <span class="stat-label">Checks</span>
        </div>
        <div class="stat-badge">
          <span class="stat-icon">🌍</span>
          <span class="stat-value">${progress.locationCount}</span>
          <span class="stat-label">Locations</span>
        </div>
      </div>
      
      <div class="achievements-grid">
        ${allAchievements.map(achievement => {
          const isUnlocked = unlocked.some(a => a.id === achievement.id);
          return `
            <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="badge-icon">${achievement.icon}</div>
              <div class="badge-name">${achievement.name}</div>
              <div class="badge-desc">${achievement.description}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Check achievements when weather loads
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    if (window.state && window.state.weather && window.state.location) {
      const newAchievements = window.weatherAchievements.checkAchievements(
        window.state.weather,
        window.state.location,
        window.state.units
      );

      // Show notifications for new achievements
      newAchievements.forEach(achievement => {
        setTimeout(() => showAchievementNotification(achievement), 500);
      });

      // Render achievements card
      renderAchievementsCard();
    }
  });
}
