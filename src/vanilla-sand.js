
export class SandCanvas {
  constructor(canvas, imageUrl) {
    this.canvas = canvas;
    this.imageUrl = imageUrl;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    this.particles = [];
    this.image = new Image();
    this.mouse = { x: -1000, y: -1000, radius: 120 };
    this.time = 0;
    
    this.renderConfig = { drawW: 0, drawH: 0, offsetX: 0, offsetY: 0 };
    this.animationFrameId = null;
    
    this.init();
  }

  init() {
    this.image.crossOrigin = "anonymous";
    this.image.onload = () => {
      this.resize();
      this.initParticles();
      this.animate();
      
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mouseleave', () => this.handleMouseLeave());
      window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    };
    
    this.image.onerror = () => {
      console.error('Banner image failed to load:', this.imageUrl);
      this.image.src = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop';
    };
    
    this.image.src = this.imageUrl;
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    
    // We use the full container size for the hero banner
    this.canvas.width = w;
    this.canvas.height = h;

    const targetAspect = w / h;
    const imgAspect = this.image.width / this.image.height;

    if (imgAspect > targetAspect) {
      this.renderConfig.drawH = this.canvas.height;
      this.renderConfig.drawW = this.canvas.height * imgAspect;
      this.renderConfig.offsetX = (this.canvas.width - this.renderConfig.drawW) / 2;
      this.renderConfig.offsetY = 0;
    } else {
      this.renderConfig.drawW = this.canvas.width;
      this.renderConfig.drawH = this.canvas.width / imgAspect;
      this.renderConfig.offsetX = 0;
      this.renderConfig.offsetY = (this.canvas.height - this.renderConfig.drawH) / 2;
    }

    // Re-init particles on resize to match new dimensions
    this.ctx.drawImage(this.image, this.renderConfig.offsetX, this.renderConfig.offsetY, this.renderConfig.drawW, this.renderConfig.drawH);
    this.initParticles();
  }

  initParticles() {
    // Equalized density across all devices as requested
    const skip = 4; 
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

    for (let y = 0; y < this.canvas.height; y += skip) {
      for (let x = 0; x < this.canvas.width; x += skip) {
        const i = (y * this.canvas.width + x) * 4;
        if (imageData[i + 3] > 128) {
          const boost = 1.3; // Aumentar brillo de las partículas
          const r = Math.min(255, imageData[i] * boost);
          const g = Math.min(255, imageData[i + 1] * boost);
          const b = Math.min(255, imageData[i + 2] * boost);
          const color = `rgb(${r},${g},${b})`;
          this.particles.push(new Particle(x, y, color, this.ctx));
        }
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
  }

  handleTouchMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (e.touches[0].clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouse.y = (e.touches[0].clientY - rect.top) * (this.canvas.height / rect.height);
  }

  handleMouseLeave() {
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  animate() {
    // Background color matching the theme
    this.ctx.fillStyle = '#0E0E0F'; 
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background image with 20% transparency
    this.ctx.save();
    this.ctx.globalAlpha = 0.45; // Aumentar presencia de la imagen de fondo
    this.ctx.drawImage(this.image, this.renderConfig.offsetX, this.renderConfig.offsetY, this.renderConfig.drawW, this.renderConfig.drawH);
    this.ctx.restore();
    
    // Trail effect
    this.ctx.fillStyle = 'rgba(14, 14, 15, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.time += 0.05;

    this.particles.forEach(p => {
      p.update(this.mouse, this.time);
      p.draw();
    });
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
  }
}

class Particle {
  constructor(x, y, color, ctx) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.color = color;
    this.ctx = ctx;
    this.size = 1.6; // Reverting to larger size
    
    this.angle = Math.random() * Math.PI * 2;
    this.velocity = 0.02 + Math.random() * 0.03;
    this.amplitude = 1.5 + Math.random() * 4;
    
    this.forceX = 0;
    this.forceY = 0;
    this.friction = 0.80; // Stop sliding sooner for crisp feeling
    this.ease = 0.35; // Snap back faster
  }

  update(mouse, time) {
    this.angle += this.velocity;
    const waveOffset = Math.sin(this.angle + time) * this.amplitude;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < mouse.radius) {
      // Extremely optimized vector physics (bypassing heavy atan2, cos, sin)
      const force = (mouse.radius - distance) / mouse.radius;
      const forceMultiplier = force * 60 / distance; // Increased from 25 to 60 for extreme speed
      this.forceX -= dx * forceMultiplier;
      this.forceY -= dy * forceMultiplier;
    }

    this.x += (this.originX - this.x + this.forceX) * this.ease;
    this.y += (this.originY - this.y + this.forceY + waveOffset) * this.ease;
    
    this.forceX *= this.friction;
    this.forceY *= this.friction;
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}
