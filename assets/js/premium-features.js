/* Premium Design Features - Rain Chart & City Cards */

// Rain Probability Chart
let rainChart = null;

function renderRainChart() {
  if (!state.weather || !state.weather.hourly) return;
  
  const canvas = document.getElementById('rain-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  if (rainChart) {
    rainChart.destroy();
  }
  
  // Get next 12 hours
  const hourly = state.weather.hourly.slice(0, 12);
  const labels = hourly.map(h => {
    const d = new Date(h.dt * 1000);
    return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  });
  
  const popData = hourly.map(h => (h.pop || 0) * 100);
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
  gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)');
  gradient.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
  
  rainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Chance of rain',
        data: popData,
        backgroundColor: gradient,
        borderColor: 'rgba(56, 189, 248, 1)',
        borderWidth: 0,
        borderRadius: 8,
        barThickness: 'flex',
        maxBarThickness: 40,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e5e7eb',
          bodyColor: '#e5e7eb',
          borderColor: 'rgba(56, 189, 248, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return context.parsed.y.toFixed(0) + '%';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#9ca3af',
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: '#9ca3af',
            font: {
              size: 12
            }
          },
          grid: {
            display: false,
            drawBorder: false
          }
        }
      }
    }
  });
}

// Popular Cities Weather Cards
const popularCities = [
  { name: 'California', country: 'US', lat: 36.7783, lon: -119.4179 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
  { name: 'Jerusalem', country: 'Israel', lat: 31.7683, lon: 35.2137 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 }
];

async function renderCitiesGrid() {
  const container = document.getElementById('cities-grid');
  if (!container) return;
  
  container.innerHTML = '<div style="color: var(--muted); padding: 20px">Loading cities...</div>';
  
  try {
    const cityCards = await Promise.all(
      popularCities.map(city => fetchCityWeather(city))
    );
    
    container.innerHTML = cityCards.join('');
    
    // Add click listeners
    const cards = container.querySelectorAll('.city-card');
    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        const city = popularCities[idx];
        searchLocation(city.name);
      });
    });
  } catch (error) {
    container.innerHTML = '<div style="color: var(--poor); padding: 20px">Failed to load cities</div>';
  }
}

async function fetchCityWeather(city) {
  try {
    const response = await fetch(`api/weather.php?lat=${city.lat}&lon=${city.lon}&units=${state.units}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const current = data.current;
    const icon = current.weather?.[0]?.icon || '01d';
    const temp = Math.round(current.temp);
    const condition = current.weather?.[0]?.description || 'Clear';
    const tempUnit = state.units === 'metric' ? '°C' : '°F';
    
    // Determine condition class for styling
    let conditionClass = 'mostly-sunny';
    if (icon.includes('09') || icon.includes('10')) {
      conditionClass = 'rainy';
    } else if (icon.includes('02') || icon.includes('03')) {
      conditionClass = 'partly-cloudy';
    } else if (icon.includes('04')) {
      conditionClass = 'cloudy';
    }
    
    return `
      <div class="city-card" data-city="${city.name}">
        <div class="city-card-header">
          <div class="city-info">
            <h3>${city.country}</h3>
            <p>${city.name}</p>
          </div>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}" class="city-card-icon">
        </div>
        <div class="city-card-temp">${temp}°</div>
        <div class="city-card-condition ${conditionClass}">${condition}</div>
      </div>
    `;
  } catch (error) {
    console.error(`Error fetching weather for ${city.name}:`, error);
    return `
      <div class="city-card">
        <div class="city-info">
          <h3>${city.country}</h3>
          <p>${city.name}</p>
        </div>
        <div style="color: var(--muted); font-size: 14px; margin-top: 10px">Unavailable</div>
      </div>
    `;
  }
}

// Add weather markers to map
function addMapMarkers() {
  const container = document.getElementById('map-markers');
  if (!container) return;
  
  // Sample weather markers (can be populated from API)
  const markers = [
    { lat: 40, lon: 20, icon: '☀️', left: '55%', top: '35%' },   // Europe
    { lat: 35, lon: -95, icon: '⛅', left: '25%', top: '40%' },  // North America
    { lat: -20, lon: 135, icon: '🌧️', left: '80%', top: '65%' }, // Australia
    { lat: 20, lon: 100, icon: '☁️', left: '70%', top: '45%' },  // Asia
    { lat: -10, lon: -50, icon: '⛈️', left: '35%', top: '60%' }, // South America
  ];
  
  container.innerHTML = markers.map(m => `
    <div class="map-marker" style="left: ${m.left}; top: ${m.top}" title="Weather condition">
      ${m.icon}
    </div>
  `).join('');
}

// Initialize premium features when weather is loaded
function initPremiumFeatures() {
  if (!state.weather) return;
  
  // Render rain chart
  renderRainChart();
  
  // Render cities grid
  renderCitiesGrid();
  
  // Add map markers
  addMapMarkers();
}

// Hook into existing weather update
if (typeof window !== 'undefined') {
  // Override or extend existing fetchWeather completion
  const originalOnWeatherUpdate = window.onWeatherDataLoaded || (() => {});
  window.onWeatherDataLoaded = function() {
    originalOnWeatherUpdate();
    initPremiumFeatures();
  };
}
