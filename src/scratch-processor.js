/**
 * Scratch Processor - Web Audio API ScriptProcessorNode
 * Implementa un reproductor de vinilo con scratch auténtico tipo DJ
 */

export class ScratchProcessor {
  constructor(audioContext, audioBuffer) {
    this.audioCtx = audioContext;
    this.audioBuffer = audioBuffer;
    
    // Estado del playhead (en muestras)
    this.playhead = 0;
    this.speed = 1.0;
    
    // Parámetros del motor de fricción
    this.isScratching = false;
    this.frictionFactor = 0.9996; // Decaimiento rápido cuando se suelta
    this.motorFactor = 0.98;      // Cómo el motor frena/acelera hacia 1.0
    this.REV_SEC = 1.8;           // RPM virtuales (ajusta peso del scratch)
    
    // Crear nodos
    this.source = null;
    this.scriptProcessor = null;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0.5;
    
    this.isPlaying = false;
    this.onended = null;
  }
  
  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playhead = 0;
    this.speed = 1.0;
    
    // Crear ScriptProcessorNode (4096 muestras por buffer)
    this.scriptProcessor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      const input = this.audioBuffer.getChannelData(0);
      const sampleRate = this.audioBuffer.sampleRate;
      const bufferLength = this.audioBuffer.length;
      
      // Procesar cada muestra
      for (let i = 0; i < output.length; i++) {
        // Leer muestra en la posición actual
        const playheadInt = Math.floor(this.playhead);
        const fraction = this.playhead - playheadInt;
        
        // Interpolación lineal para mayor calidad
        let sample = 0;
        if (playheadInt >= 0 && playheadInt < bufferLength) {
          const s0 = input[playheadInt];
          const s1 = input[Math.min(playheadInt + 1, bufferLength - 1)];
          sample = s0 + (s1 - s0) * fraction;
        }
        
        output[i] = sample;
        
        // Avanzar playhead según speed
        this.playhead += this.speed;
        
        // Aplicar fricción si está scratching (decaimiento rápido)
        if (this.isScratching) {
          this.speed *= this.frictionFactor;
        } else {
          // Motor virtual tira de speed hacia 1.0
          this.speed += (1.0 - this.speed) * (1 - this.motorFactor);
        }
        
        // Evitar salirse del buffer
        if (this.playhead >= bufferLength) {
          this.playhead = 0;
          if (this.onended) this.onended();
        }
      }
    };
    
    // Conectar a la salida
    this.scriptProcessor.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }
  
  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
    }
  }
  
  /**
   * Calcular velocidad angular del dedo en el disco
   * @param {number} x - Posición X del ratón
   * @param {number} y - Posición Y del ratón
   * @param {DOMRect} discRect - Rectángulo del disco
   * @returns {number} Velocidad angular en revoluciones por segundo
   */
  getAngularVelocity(x, y, discRect) {
    const cx = discRect.left + discRect.width / 2;
    const cy = discRect.top + discRect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const radius = Math.hypot(dx, dy);
    
    if (radius < 10) return 0; // Demasiado cerca del centro
    
    // Velocidad lineal del dedo
    const linearVelocity = Math.hypot(dx, dy);
    
    // Convertir a velocidad angular (rad/s)
    const angularVel = linearVelocity / Math.max(10, radius);
    
    // Escala: REV_SEC revoluciones por segundo
    return angularVel * this.REV_SEC / (2 * Math.PI);
  }
  
  /**
   * Aplicar scratching (cambiar speed en base a velocidad angular)
   * @param {number} angularVel - Velocidad angular
   */
  setScratchSpeed(angularVel) {
    this.speed = angularVel;
  }
  
  /**
   * Aplicar fricción (cuando se suelta el dedo)
   */
  applyFriction() {
    this.isScratching = true;
  }
  
  /**
   * Soltar (motor vuelve a 1.0)
   */
  release() {
    this.isScratching = false;
  }
  
  /**
   * Obtener posición del vinilo en grados (para rotación visual)
   */
  getRotationDegrees() {
    const revolutions = this.playhead / this.audioBuffer.length;
    return (revolutions * 360) % 360;
  }
}
