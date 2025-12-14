/* Weather Facts and Trivia System */
class WeatherTrivia {
  constructor() {
    this.facts = {
      temperature: [
        { condition: (temp) => temp > 35, fact: "At temperatures above 35°C, the human body struggles to cool itself through sweating. Stay hydrated!" },
        { condition: (temp) => temp < 0, fact: "Water freezes at 0°C (32°F). At these temperatures, frost forms on surfaces as water vapor crystallizes." },
        { condition: (temp) => temp >= 0 && temp < 10, fact: "Most snowflakes form when temperatures are between 0°C and -20°C. Perfect snow-making weather!" },
        { condition: (temp) => temp >= 20 && temp <= 25, fact: "Studies show 20-25°C is the optimal temperature range for human comfort and productivity." },
        { condition: (temp) => temp > 40, fact: "The highest temperature ever recorded on Earth was 54.4°C (129.9°F) in Death Valley, California!" },
        { condition: (temp) => temp < -20, fact: "At temperatures below -20°C, your breath can freeze and fall to the ground as ice crystals!" },
        { condition: (temp) => temp >= 10 && temp < 20, fact: "This is ideal weather for outdoor activities! Many athletes perform best in temperatures between 10-20°C." },
        { condition: (temp) => temp >= 25 && temp < 35, fact: "Hot weather increases ice cream sales by up to 20% for every degree above 25°C!" }
      ],
      
      humidity: [
        { condition: (humidity) => humidity > 80, fact: "High humidity makes it feel hotter because sweat doesn't evaporate as quickly, reducing your body's cooling ability." },
        { condition: (humidity) => humidity < 30, fact: "Low humidity can cause dry skin, irritated sinuses, and increased static electricity. Consider using a humidifier!" },
        { condition: (humidity) => humidity >= 40 && humidity <= 60, fact: "This humidity level is ideal for human comfort and health. It's also optimal for preserving wooden furniture!" },
        { condition: (humidity) => humidity > 90, fact: "At 100% humidity, the air is completely saturated with water vapor. This is when fog typically forms!" },
        { condition: (humidity) => humidity < 20, fact: "Desert areas can have humidity levels below 10%, making them some of the driest places on Earth." }
      ],
      
      wind: [
        { condition: (speed) => speed > 20, fact: "Wind speeds above 20 m/s (72 km/h) can make it difficult to walk and may cause minor damage to structures." },
        { condition: (speed) => speed > 32, fact: "Hurricane-force winds start at 33 m/s (119 km/h). These winds can uproot trees and cause severe damage!" },
        { condition: (speed) => speed < 1, fact: "Beaufort scale 0: Calm wind. Smoke rises vertically. Perfect conditions for hot air ballooning!" },
        { condition: (speed) => speed >= 5 && speed < 10, fact: "This gentle breeze is perfect for flying kites and sailing!" },
        { condition: (speed) => speed >= 1 && speed < 3, fact: "Light air - just enough wind to be felt on the face. Smoke drifts, indicating the wind direction." }
      ],
      
      rain: [
        { condition: (rate) => rate > 10, fact: "Heavy rain! Raindrops can fall at speeds up to 32 km/h (20 mph)." },
        { condition: (rate) => rate > 0.1 && rate < 2, fact: "Light rain. Did you know that the smell of rain (petrichor) comes from oils plants produce during dry periods?" },
        { condition: (rate) => rate > 50, fact: "Extreme rainfall! The wettest place on Earth, Mawsynram in India, receives about 11,872 mm of rain annually!" },
        { condition: (rate) => rate > 2 && rate < 10, fact: "Moderate rain. A raindrop is approximately 50 times larger than a cloud droplet!" }
      ],
      
      uv: [
        { condition: (uvi) => uvi >= 11, fact: "Extreme UV! Unprotected skin can burn in less than 10 minutes. Always wear sunscreen SPF 50+!" },
        { condition: (uvi) => uvi >= 8 && uvi < 11, fact: "Very high UV exposure. The ozone layer blocks most UV-C radiation, but UV-A and UV-B still reach us." },
        { condition: (uvi) => uvi >= 6 && uvi < 8, fact: "High UV levels. UV radiation is strongest between 10 AM and 4 PM. Seek shade during these hours!" },
        { condition: (uvi) => uvi >= 3 && uvi < 6, fact: "Moderate UV exposure. UV rays can reflect off water, sand, and snow, increasing exposure by up to 80%!" },
        { condition: (uvi) => uvi < 3, fact: "Low UV levels. You can still get sunburned on cloudy days as up to 80% of UV rays penetrate clouds!" }
      ],
      
      weather: {
        clear: [
          "On a clear night, you can see about 2,500 stars with the naked eye from a dark location!",
          "Clear skies allow for significant temperature drops at night through radiational cooling.",
          "The blueness of the sky is caused by Rayleigh scattering of sunlight by molecules in the atmosphere."
        ],
        clouds: [
          "Clouds are made of tiny water droplets or ice crystals. A typical cloud contains less water than you'd find in a bathtub!",
          "The largest cloud systems (cumulonimbus) can reach heights of 20 km (12 miles)!",
          "There are over 100 different types of clouds classified by their shape, height, and composition."
        ],
        rain: [
          "The largest raindrop ever recorded was 8.8mm in diameter - about the size of a peanut!",
          "Rain is recycled. The water falling as rain today once fell as rain in prehistoric times!",
          "It's impossible for raindrops to be shaped like teardrops. They're actually round or oval!"
        ],
        snow: [
          "No two snowflakes are exactly alike! Each has a unique crystalline structure.",
          "Snow isn't actually white - it's translucent. It appears white because it reflects light.",
          "It can be too cold to snow! Extremely cold air can't hold enough moisture to create snow."
        ],
        thunderstorm: [
          "Lightning is 5 times hotter than the surface of the sun, reaching temperatures of 30,000°C!",
          "Thunder is the sound of air expanding rapidly as lightning heats it.",
          "You can estimate a storm's distance: count seconds between lightning and thunder, divide by 3 for kilometers."
        ],
        fog: [
          "Fog is essentially a cloud that forms at ground level when air temperature equals dew point.",
          "The thickest fogs can reduce visibility to less than 50 meters!",
          "Freezing fog can coat everything in a layer of ice called rime."
        ]
      },
      
      general: [
        "Weather forecasts are accurate about 90% of the time for the next 24 hours, but accuracy drops to 50% for 10-day forecasts.",
        "The Earth's atmosphere weighs about 5.5 quadrillion tons!",
        "Antarctica is technically a desert - it receives less than 2 inches of precipitation per year.",
        "The fastest wind speed ever recorded was 372 km/h (231 mph) during Tropical Cyclone Olivia in 1996.",
        "Rainbows are actually complete circles, but we usually only see them as arcs from the ground.",
        "The coldest temperature ever recorded on Earth was -89.2°C (-128.6°F) at Vostok Station, Antarctica."
      ]
    };
  }

  // Get relevant facts based on current weather
  getRelevantFacts(weatherData, units = 'metric') {
    if (!weatherData || !weatherData.current) return [];

    const current = weatherData.current;
    const tempC = units === 'metric' ? current.temp : (current.temp - 32) * 5/9;
    const windMs = units === 'metric' ? current.wind_speed : current.wind_speed / 2.23694;
    const humidity = current.humidity;
    const uvi = current.uvi || 0;
    const rain = current.rain?.['1h'] || current.precip || 0;
    const weatherMain = (current.weather?.[0]?.main || '').toLowerCase();

    const relevantFacts = [];

    // Check temperature facts
    for (const fact of this.facts.temperature) {
      if (fact.condition(tempC)) {
        relevantFacts.push({ type: '🌡️ Temperature', fact: fact.fact });
      }
    }

    // Check humidity facts
    for (const fact of this.facts.humidity) {
      if (fact.condition(humidity)) {
        relevantFacts.push({ type: '💧 Humidity', fact: fact.fact });
      }
    }

    // Check wind facts
    for (const fact of this.facts.wind) {
      if (fact.condition(windMs)) {
        relevantFacts.push({ type: '💨 Wind', fact: fact.fact });
      }
    }

    // Check rain facts
    if (rain > 0) {
      for (const fact of this.facts.rain) {
        if (fact.condition(rain)) {
          relevantFacts.push({ type: '🌧️ Rain', fact: fact.fact });
        }
      }
    }

    // Check UV facts
    for (const fact of this.facts.uv) {
      if (fact.condition(uvi)) {
        relevantFacts.push({ type: '☀️ UV Index', fact: fact.fact });
      }
    }

    // Add weather-specific facts
    if (this.facts.weather[weatherMain]) {
      const weatherFacts = this.facts.weather[weatherMain];
      const randomFact = weatherFacts[Math.floor(Math.random() * weatherFacts.length)];
      relevantFacts.push({ type: `🌤️ ${weatherMain.charAt(0).toUpperCase() + weatherMain.slice(1)}`, fact: randomFact });
    }

    // Add one general fact
    const generalFact = this.facts.general[Math.floor(Math.random() * this.facts.general.length)];
    relevantFacts.push({ type: '🌍 Did You Know?', fact: generalFact });

    return relevantFacts;
  }

  // Get a random fun fact
  getRandomFact() {
    const allFacts = [
      ...this.facts.general,
      ...Object.values(this.facts.weather).flat()
    ];
    return allFacts[Math.floor(Math.random() * allFacts.length)];
  }
}

// Initialize global instance
window.weatherTrivia = new WeatherTrivia();

// Render weather trivia card
function renderWeatherTrivia() {
  if (!window.state || !window.state.weather) return;

  const facts = window.weatherTrivia.getRelevantFacts(
    window.state.weather,
    window.state.units
  );

  const container = document.getElementById('weather-trivia-card');
  if (!container) return;

  // Show maximum 4 facts to avoid overwhelming the user
  const displayFacts = facts.slice(0, 4);

  container.innerHTML = `
    <div class="trivia-card">
      <div class="trivia-header">
        <h3>🧠 Weather Facts & Trivia</h3>
        <button id="refresh-trivia" class="refresh-btn" title="Get new facts">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
      </div>
      
      <div class="trivia-facts">
        ${displayFacts.map(({ type, fact }) => `
          <div class="trivia-fact">
            <div class="fact-type">${type}</div>
            <div class="fact-text">${fact}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Add refresh handler
  document.getElementById('refresh-trivia')?.addEventListener('click', () => {
    renderWeatherTrivia();
  });
}

// Auto-render when weather data is available
if (window.addEventListener) {
  window.addEventListener('weatherDataLoaded', () => {
    renderWeatherTrivia();
  });
}
