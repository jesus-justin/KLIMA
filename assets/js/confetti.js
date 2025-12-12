/* Confetti Celebration Animation for Excellent Jog Days */

function createConfetti() {
  const confettiContainer = document.getElementById('confetti-container');
  if (!confettiContainer) return;

  // Clear existing confetti
  confettiContainer.innerHTML = '';

  const confettiPieces = 50;
  const colors = ['#fbbf24', '#f59e0b', '#06b6d4', '#38bdf8', '#10b981', '#34d399', '#f87171', '#dc2626'];

  for (let i = 0; i < confettiPieces; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const startX = Math.random() * window.innerWidth;
    const duration = 2 + Math.random() * 1;
    const delay = Math.random() * 0.3;
    const rotation = Math.random() * 720;
    
    confetti.style.setProperty('--start-x', startX + 'px');
    confetti.style.setProperty('--start-y', '-10px');
    confetti.style.setProperty('--end-x', (startX + (Math.random() - 0.5) * 200) + 'px');
    confetti.style.setProperty('--end-y', window.innerHeight + 10 + 'px');
    confetti.style.setProperty('--duration', duration + 's');
    confetti.style.setProperty('--delay', delay + 's');
    confetti.style.setProperty('--rotation', rotation + 'deg');
    confetti.style.backgroundColor = color;
    
    confettiContainer.appendChild(confetti);
  }
}

function celebrateExcellentJog() {
  if (!state.weather || !state.weather.current) return;
  
  const { rating: jogRating } = jogScore(
    state.weather.current.temp,
    state.weather.current.wind_speed,
    state.weather.daily?.[0]?.pop || 0,
    state.weather.current.is_day !== 0
  );

  // Only celebrate if rating is 'Good' (80+ score)
  if (jogRating === 'Good') {
    createConfetti();
  }
}

window.celebrateExcellentJog = celebrateExcellentJog;
