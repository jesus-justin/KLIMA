/* Enhanced Visual Feedback & Trend Indicators */

// Add temperature trend indicators
function addTrendIndicators() {
  if (!state.weather || !state.weather.hourly) return;
  
  const hourly = state.weather.hourly;
  const currentTemp = state.weather.current.temp;
  
  hourly.slice(0, 24).forEach((hour, idx) => {
    const hourEl = document.querySelectorAll('.hour')[idx];
    if (!hourEl) return;
    
    const tempEl = hourEl.querySelector('.temp');
    if (!tempEl || !tempEl.textContent) return;
    
    // Calculate trend
    const nextHour = hourly[idx + 1];
    if (nextHour) {
      const currentHourTemp = hour.temp;
      const nextHourTemp = nextHour.temp;
      const diff = nextHourTemp - currentHourTemp;
      
      if (Math.abs(diff) > 1) {
        const arrow = document.createElement('span');
        arrow.className = `trend-arrow ${diff > 0 ? 'up' : 'down'}`;
        arrow.textContent = diff > 0 ? '↑' : '↓';
        arrow.title = `${diff > 0 ? 'Rising' : 'Falling'} ${Math.abs(diff).toFixed(1)}°`;
        tempEl.appendChild(arrow);
      }
    }
    
    // Add temperature deviation bar
    const deviation = Math.abs(hour.temp - currentTemp);
    if (deviation > 3) {
      const devBar = document.createElement('div');
      devBar.className = 'temp-deviation';
      devBar.style.width = `${Math.min(deviation * 10, 100)}%`;
      hourEl.style.position = 'relative';
      hourEl.appendChild(devBar);
    }
  });
}

// Apply contextual glows for extreme conditions
function applyContextualGlows() {
  if (!state.weather || !state.weather.current) return;
  
  const temp = state.weather.current.temp;
  const tempC = state.units === 'metric' ? temp : (temp - 32) * 5/9;
  const currentCard = document.querySelector('.current.card');
  
  if (!currentCard) return;
  
  // Remove existing classes
  currentCard.classList.remove('extreme-heat', 'extreme-cold');
  
  // Add glow for extreme temperatures
  if (tempC > 35) {
    currentCard.classList.add('extreme-heat');
  } else if (tempC < 0) {
    currentCard.classList.add('extreme-cold');
  }
  
  // Add jog status glow if applicable
  const jogBox = document.getElementById('jog-now');
  if (jogBox && jogBox.classList.contains('jog-good')) {
    jogBox.classList.add('jog-good');
  }
}

// Animate number updates
function animateNumberUpdate(elementId, newValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  el.classList.add('temp-updating');
  el.textContent = newValue;
  
  setTimeout(() => {
    el.classList.remove('temp-updating');
  }, 400);
}

// Enhanced empty state with personality
function renderPersonalizedEmptyState(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const emojis = ['🌤️', '☀️', '🌈', '🌟', '✨'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  container.innerHTML = `
    <div class="empty" style="text-align:center; padding:60px 20px">
      <div style="font-size:72px; margin-bottom:16px; animation: float 3s ease-in-out infinite">${randomEmoji}</div>
      <p style="font-size:18px; color:var(--muted)">${message}</p>
    </div>
  `;
}

// Add ripple effect to cards on click
function addRippleEffect(event) {
  const card = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = card.getBoundingClientRect();
  
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(56,189,248,0.5)';
  ripple.style.width = ripple.style.height = '100px';
  ripple.style.left = (event.clientX - rect.left - 50) + 'px';
  ripple.style.top = (event.clientY - rect.top - 50) + 'px';
  ripple.style.animation = 'ripple 0.6s ease-out';
  ripple.style.pointerEvents = 'none';
  
  card.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Apply stagger animation classes
function applyStaggerAnimations() {
  const hours = document.querySelectorAll('.hour');
  const days = document.querySelectorAll('.day');
  
  hours.forEach((hour, idx) => {
    hour.style.animationDelay = `${idx * 0.05}s`;
  });
  
  days.forEach((day, idx) => {
    day.style.animationDelay = `${idx * 0.05}s`;
  });
}

// Scroll-triggered reveals
const observeRevealOnScroll = () => {
  const revealElements = document.querySelectorAll('.card, .hourly, .daily');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section-reveal');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  revealElements.forEach(el => observer.observe(el));
};

// Initialize all micro-interactions
function initMicroInteractions() {
  // Add click ripple to interactive cards
  const interactiveCards = document.querySelectorAll('.hour, .day, .city-card, .source-card');
  interactiveCards.forEach(card => {
    card.addEventListener('click', addRippleEffect);
  });
  
  // Apply initial visual enhancements
  applyStaggerAnimations();
  applyContextualGlows();
  addTrendIndicators();
  
  // Scroll-triggered reveals
  if ('IntersectionObserver' in window) {
    observeRevealOnScroll();
  }
}

// Hook into existing weather update flow
const originalRenderCurrent = window.renderCurrent || (() => {});
window.renderCurrent = function() {
  originalRenderCurrent.apply(this, arguments);
  applyContextualGlows();
};

const originalRenderHourly = window.renderHourly || (() => {});
window.renderHourly = function() {
  originalRenderHourly.apply(this, arguments);
  setTimeout(() => {
    addTrendIndicators();
    applyStaggerAnimations();
  }, 100);
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMicroInteractions);
} else {
  initMicroInteractions();
}
