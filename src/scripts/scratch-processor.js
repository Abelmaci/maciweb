export class ScratchProcessor {
  constructor(audioContext, audioBuffer) {
    this.audioCtx = audioContext;
    this.audioBuffer = audioBuffer;

    this.playhead = 0;
    this.speed = 0;
    this.targetSpeed = 1.0;
    this.isScratching = false;

    this.frictionFactor = 0.9996;
    this.motorFactor = 0.00008;
    this.REV_SEC = 1.8;

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

    this.scriptProcessor = this.audioCtx.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isPlaying) return;

      const output = e.outputBuffer.getChannelData(0);
      const input = this.audioBuffer.getChannelData(0);
      const bufferLength = this.audioBuffer.length;

      for (let i = 0; i < output.length; i++) {
        const playheadInt = Math.floor(this.playhead);
        const fraction = this.playhead - playheadInt;

        let sample = 0;
        if (playheadInt >= 0 && playheadInt < bufferLength) {
          const s0 = input[playheadInt];
          const s1 = input[Math.min(playheadInt + 1, bufferLength - 1)];
          sample = s0 + (s1 - s0) * fraction;
        }

        output[i] = sample;

        this.playhead += this.speed;

        if (this.isScratching) {
          this.speed *= this.frictionFactor;
          if (Math.abs(this.speed) < 0.05) {
            this.speed = 0;
          }
        } else if (this.speed !== this.targetSpeed) {
          const diff = this.targetSpeed - this.speed;
          this.speed += diff * this.motorFactor;
          if (Math.abs(diff) < 0.005) {
            this.speed = this.targetSpeed;
          }
        }

        if (this.playhead >= bufferLength) {
          this.playhead = 0;
          if (this.onended) this.onended();
        } else if (this.playhead < 0) {
          this.playhead += bufferLength;
        }
      }
    };

    this.scriptProcessor.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    this.playhead = 0;
    this.speed = 0;
  }

  getRotationDegrees() {
    const revSamples = this.audioCtx.sampleRate * this.REV_SEC;
    return ((this.playhead / revSamples) * 360) % 360;
  }
}
