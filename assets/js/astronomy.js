/* Moon Phase & Astronomy Visualization */

function getMoonPhase(date) {
  // Calculate moon phase using a simplified algorithm
  const known = new Date(2000, 0, 6); // Known new moon date
  const phases = ['🌑 New Moon', '🌒 Waxing Crescent', '🌓 First Quarter', '🌔 Waxing Gibbous', 
                  '🌕 Full Moon', '🌖 Waning Gibbous', '🌗 Last Quarter', '🌘 Waning Crescent'];
  
  const msPerDay = 24.8 * 60 * 60 * 1000;
  const diff = date.getTime() - known.getTime();
  const days = diff / (24 * 60 * 60 * 1000);
  const lunarCycle = 29.53; // Days in lunar cycle
  const phase = (days % lunarCycle) / lunarCycle;
  
  const phaseIndex = Math.floor(phase * 8) % 8;
  const illumination = Math.round((Math.sin(phase * 2 * Math.PI) + 1) / 2 * 100);
  
  return {
    phase: phases[phaseIndex],
    icon: phases[phaseIndex].split(' ')[0],
    name: phases[phaseIndex].split(' ').slice(1).join(' '),
    illumination: illumination,
    phaseIndex: phaseIndex
  };
}

function renderAstronomyCard() {
  if (!state.weather || !state.weather.current) return;
  
  const today = new Date();
  const moon = getMoonPhase(today);
  
  const card = document.getElementById('astronomy-card');
  if (!card) return;

  // Calculate next full and new moon (approximate)
  const daysUntilFullMoon = moon.phaseIndex <= 4 ? (4 - moon.phaseIndex) * 3.7 : (8 + (4 - moon.phaseIndex)) * 3.7;
  const daysUntilNewMoon = moon.phaseIndex >= 4 ? (8 - moon.phaseIndex) * 3.7 : (4 - moon.phaseIndex) * 3.7;

  // Sunrise/Sunset
  const sunrise = new Date(state.weather.current.sunrise * 1000);
  const sunset = new Date(state.weather.current.sunset * 1000);

  card.innerHTML = `
    <div class="astronomy-container">
      <div class="astronomy-header">
        <h3 class="astronomy-title">Astronomy & Sky</h3>
        <span class="astronomy-icon">✨</span>
      </div>

      <div class="moon-phase-display">
        <div class="moon-circle-wrapper">
          <svg class="moon-svg" viewBox="0 0 100 100" aria-label="Moon Phase">
            <defs>
              <radialGradient id="moonGradient" cx="40%" cy="40%">
                <stop offset="0%" stop-color="#fef3c7" stop-opacity="1"/>
                <stop offset="100%" stop-color="#d4af37" stop-opacity="1"/>
              </radialGradient>
            </defs>
            <!-- Moon circle -->
            <circle cx="50" cy="50" r="40" fill="url(#moonGradient)" stroke="#a78bfa" stroke-width="1"/>
            
            <!-- Shadow effect for moon phase -->
            <ellipse cx="${50 + (moon.phaseIndex <= 4 ? -40 : 40)}" cy="50" 
                     rx="${40 * Math.abs(Math.cos(moon.phaseIndex * Math.PI / 4))}" 
                     ry="40" fill="#1f2937" opacity="0.7"/>
            
            <!-- Craters (dark spots) -->
            <circle cx="35" cy="35" r="4" fill="#c4b5a0" opacity="0.6"/>
            <circle cx="60" cy="45" r="3" fill="#c4b5a0" opacity="0.5"/>
            <circle cx="45" cy="65" r="2.5" fill="#c4b5a0" opacity="0.4"/>
          </svg>
        </div>
        <div class="moon-info">
          <div class="moon-name">${moon.phase}</div>
          <div class="moon-illumination">${moon.illumination}% illuminated</div>
        </div>
      </div>

      <div class="astronomy-grid">
        <div class="astro-card sunrise-card">
          <div class="astro-icon">🌅</div>
          <div class="astro-time">${fmtTime(state.weather.current.sunrise)}</div>
          <div class="astro-label">Sunrise</div>
        </div>

        <div class="astro-card sunset-card">
          <div class="astro-icon">🌇</div>
          <div class="astro-time">${fmtTime(state.weather.current.sunset)}</div>
          <div class="astro-label">Sunset</div>
        </div>

        <div class="astro-card moon-card">
          <div class="astro-icon">🌕</div>
          <div class="astro-time">${Math.round(daysUntilFullMoon)}d</div>
          <div class="astro-label">Until Full Moon</div>
        </div>

        <div class="astro-card new-moon-card">
          <div class="astro-icon">🌑</div>
          <div class="astro-time">${Math.round(daysUntilNewMoon)}d</div>
          <div class="astro-label">Until New Moon</div>
        </div>
      </div>

      <div class="astro-facts">
        <p class="fact-label">🌙 Did you know?</p>
        <p class="fact-text">
          ${moon.illumination > 80 ? 'A bright moon illuminates your evening jog path!' :
            moon.illumination < 20 ? 'A dark moon means better stargazing conditions!' :
            'Perfect conditions for both jogging and enjoying the night sky!'}
        </p>
      </div>
    </div>
  `;

  document.getElementById('astronomy-card').style.display = 'block';
}

window.renderAstronomyCard = renderAstronomyCard;
