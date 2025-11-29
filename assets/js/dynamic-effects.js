/* Dynamic Visual Effects Script - Add Life to KLIMA */

(function() {
  'use strict';

  // Create floating particles background
  function createParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    document.body.appendChild(particleContainer);

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particleContainer.appendChild(particle);
    }
  }

  // Create aurora effect
  function createAuroraEffect() {
    const aurora = document.createElement('div');
    aurora.className = 'aurora-effect';
    document.body.appendChild(aurora);
  }

  // Add ripple effect on card clicks
  function addCardRipples() {
    const cards = document.querySelectorAll('.card, .hour, .day, .quick-item');
    
    cards.forEach(card => {
      card.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(56, 189, 248, 0.4)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'rippleEffect 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  // Add ripple animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleEffect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Parallax effect on mouse move
  function addParallaxEffect() {
    const cards = document.querySelectorAll('.card');
    
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX / window.innerWidth - 0.5;
      const mouseY = e.clientY / window.innerHeight - 0.5;

      cards.forEach((card, index) => {
        const speed = (index + 1) * 0.5;
        const x = mouseX * speed * 10;
        const y = mouseY * speed * 10;
        
        card.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
  }

  // Magnetic effect for buttons
  function addMagneticButtons() {
    const buttons = document.querySelectorAll('button, .toggle-view');
    
    buttons.forEach(button => {
      button.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        this.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
      });

      button.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  }

  // Animated counter for temperature changes
  function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = Math.round(current) + '°';
    }, 16);
  }

  // Observe temperature changes
  function observeTemperatureChanges() {
    const tempElement = document.getElementById('current-temp');
    if (!tempElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.target.textContent) {
          const temp = parseInt(mutation.target.textContent);
          if (!isNaN(temp)) {
            mutation.target.classList.add('temp-updating');
            setTimeout(() => {
              mutation.target.classList.remove('temp-updating');
            }, 600);
          }
        }
      });
    });

    observer.observe(tempElement, { childList: true, subtree: true });
  }

  // Add scroll reveal animations
  function addScrollReveal() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }

  // Add sparkle effect on hover
  function addSparkleEffect() {
    const cards = document.querySelectorAll('.hour, .day, .city-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        createSparkle(this);
      });
    });
  }

  function createSparkle(element) {
    const sparkle = document.createElement('div');
    sparkle.textContent = '✨';
    sparkle.style.position = 'absolute';
    sparkle.style.top = '10px';
    sparkle.style.right = '10px';
    sparkle.style.fontSize = '20px';
    sparkle.style.animation = 'sparkle 1s ease-in-out forwards';
    sparkle.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 1000);
  }

  // Add weather-based ambient effects
  function addWeatherAmbience() {
    const currentIcon = document.getElementById('current-icon');
    if (!currentIcon) return;

    const observer = new MutationObserver(() => {
      const iconSrc = currentIcon.src;
      const container = document.querySelector('.container');
      
      // Remove existing ambience classes
      container.classList.remove('sunny-ambience', 'rainy-ambience', 'cloudy-ambience', 'night-ambience');
      
      // Add appropriate ambience based on weather
      if (iconSrc.includes('01d')) {
        container.classList.add('sunny-ambience');
      } else if (iconSrc.includes('01n')) {
        container.classList.add('night-ambience');
      } else if (iconSrc.includes('09') || iconSrc.includes('10')) {
        container.classList.add('rainy-ambience');
      } else if (iconSrc.includes('02') || iconSrc.includes('03') || iconSrc.includes('04')) {
        container.classList.add('cloudy-ambience');
      }
    });

    observer.observe(currentIcon, { attributes: true, attributeFilter: ['src'] });
  }

  // Add weather ambience styles
  const ambienceStyle = document.createElement('style');
  ambienceStyle.textContent = `
    .sunny-ambience {
      --ambient-color: rgba(245, 158, 11, 0.1);
      background-image: radial-gradient(circle at 20% 20%, var(--ambient-color), transparent 50%);
    }
    .rainy-ambience {
      --ambient-color: rgba(56, 189, 248, 0.08);
      background-image: radial-gradient(circle at 80% 30%, var(--ambient-color), transparent 50%);
    }
    .cloudy-ambience {
      --ambient-color: rgba(156, 163, 175, 0.06);
      background-image: radial-gradient(circle at 50% 40%, var(--ambient-color), transparent 50%);
    }
    .night-ambience {
      --ambient-color: rgba(99, 102, 241, 0.08);
      background-image: radial-gradient(circle at 70% 30%, var(--ambient-color), transparent 50%);
    }
  `;
  document.head.appendChild(ambienceStyle);

  // Smooth scroll behavior
  function addSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Add tilt effect on cards
  function addTiltEffect() {
    const cards = document.querySelectorAll('.card, .hour, .day');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  }

  // Initialize all effects when DOM is ready
  function init() {
    // Wait a bit for the page to load
    setTimeout(() => {
      createParticles();
      createAuroraEffect();
      addCardRipples();
      addMagneticButtons();
      addScrollReveal();
      addSparkleEffect();
      addWeatherAmbience();
      addSmoothScroll();
      addTiltEffect();
      observeTemperatureChanges();
    }, 300);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
