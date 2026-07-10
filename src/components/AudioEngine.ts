/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesize a retro cartoon boing/jump sound
  public playJumpSound() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Start with low pitch, sweep high, then fade out
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Web Audio API jump sound failed:', e);
    }
  }

  // Synthesize a drum hit / dust landing sound
  public playLandSound() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Web Audio API land sound failed:', e);
    }
  }

  // Synthesize dynamic audience cheering sound (filtered noise)
  public playCheerSound() {
    try {
      this.init();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Filter noise to sound like crowd cheering
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400; // speech mid range
      filter.Q.value = 1.0;

      const gain = this.ctx.createGain();

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Amplitude envelope for the crowd surge
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.3); // surge
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.8); // sustain
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5); // fade

      // Pitch sweep simulation on filter
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.4);
      filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 1.5);

      noiseNode.start();
    } catch (e) {
      console.warn('Web Audio API cheer sound failed:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
