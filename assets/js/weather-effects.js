/* Weather-aware background effects */

class WeatherEffects {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.weatherType = null;
  }

  init() {
    // Create canvas for weather effects
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'weather-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.6;
    `;
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setWeather(weatherCode, isDay = true) {
    // Map OpenWeather icon codes to effects
    const code = String(weatherCode).substring(0, 2);
    
    if (code === '01') {
      this.weatherType = isDay ? 'clear-day' : 'clear-night';
    } else if (['02', '03', '04'].includes(code)) {
      this.weatherType = 'clouds';
    } else if (['09', '10'].includes(code)) {
      this.weatherType = 'rain';
    } else if (code === '11') {
      this.weatherType = 'thunder';
    } else if (code === '13') {
      this.weatherType = 'snow';
    } else if (code === '50') {
      this.weatherType = 'fog';
    } else {
      this.weatherType = 'clear-day';
    }
    
    this.stop();
    this.particles = [];
    
    if (this.weatherType === 'rain') {
      this.createRain();
      this.animate();
    } else if (this.weatherType === 'snow') {
      this.createSnow();
      this.animate();
    } else if (this.weatherType === 'clouds') {
      this.createClouds();
      this.animate();
    }
  }

  createRain() {
    const count = 100;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 5 + 10,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }

  createSnow() {
    const count = 80;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
        drift: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.6 + 0.3
      });
    }
  }

  createClouds() {
    const count = 5;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.3),
        width: Math.random() * 200 + 150,
        height: Math.random() * 60 + 40,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.15 + 0.05
      });
    }
  }

  animate() {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.weatherType === 'rain') {
      this.animateRain();
    } else if (this.weatherType === 'snow') {
      this.animateSnow();
    } else if (this.weatherType === 'clouds') {
      this.animateClouds();
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  animateRain() {
    this.ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
    this.ctx.lineWidth = 1;
    
    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.opacity;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x, p.y + p.length);
      this.ctx.stroke();
      
      p.y += p.speed;
      
      if (p.y > this.canvas.height) {
        p.y = -p.length;
        p.x = Math.random() * this.canvas.width;
      }
    });
    
    this.ctx.globalAlpha = 1;
  }

  animateSnow() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.opacity;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      p.y += p.speed;
      p.x += p.drift;
      
      if (p.y > this.canvas.height) {
        p.y = -p.radius;
        p.x = Math.random() * this.canvas.width;
      }
      
      if (p.x < 0 || p.x > this.canvas.width) {
        p.x = Math.random() * this.canvas.width;
      }
    });
    
    this.ctx.globalAlpha = 1;
  }

  animateClouds() {
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = gradient;
      this.ctx.save();
      this.ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
      this.ctx.scale(p.width / 100, p.height / 100);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 50, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      p.x += p.speed;
      
      if (p.x > this.canvas.width + p.width) {
        p.x = -p.width;
      }
    });
    
    this.ctx.globalAlpha = 1;
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  destroy() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Global instance
window.weatherEffects = new WeatherEffects();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.weatherEffects.init();
  });
} else {
  window.weatherEffects.init();
}
