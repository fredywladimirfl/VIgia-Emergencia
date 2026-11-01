/**
 * Web Audio API synthesizer for Firefighter Emergency Beacon & Evacuation Horns.
 * Runs completely client-side without external audio files.
 */

class TacticalSoundSystem {
  private ctx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private intervalId: number | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Triggers the continuous high-urgency MAYDAY beacon alarm
   * Alternates frequencies 950Hz and 700Hz with fast pulsing
   */
  public startMaydayAlarm() {
    if (this.isAlarmPlaying) return;
    try {
      const ctx = this.getContext();
      this.isAlarmPlaying = true;

      const playChirp = () => {
        if (!this.isAlarmPlaying) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
        osc.frequency.setValueAtTime(600, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.32);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      };

      playChirp();
      this.intervalId = window.setInterval(playChirp, 450);
    } catch (e) {
      console.warn('Audio playback not permitted or failed', e);
    }
  }

  /**
   * Sound for tactical evacuation horn (3 long blasts standard in wildland firefighting)
   */
  public playEvacuationHorn() {
    try {
      const ctx = this.getContext();
      const blasts = [0, 0.9, 1.8]; // 3 distinct horn blasts
      
      blasts.forEach((delay) => {
        const startTime = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(320, startTime);
        osc.frequency.setValueAtTime(340, startTime + 0.3);
        osc.frequency.setValueAtTime(310, startTime + 0.5);

        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.75);
      });
    } catch (e) {
      console.warn('Audio context error', e);
    }
  }

  /**
   * Subtle alert chime for PAR check reminder or 30-30-30 alert
   */
  public playChimeAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio context error', e);
    }
  }

  /**
   * Two-tone emergency dispatch alert for catastrophe broadcasts (Chilean Fire Dispatch Tone)
   */
  public playSirenBroadcast() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // First Tone: 650 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(650, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.65);

      // Second Tone: 920 Hz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(920, now + 0.65);
      gain2.gain.setValueAtTime(0.35, now + 0.65);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.65);
      osc2.stop(now + 1.45);
    } catch (e) {
      console.warn('Audio context error', e);
    }
  }

  /**
   * Distinctive urgent warning sound for Sudden Wind Shift / Giro Brusco de Viento
   * Alternating rapid warning pulses to alert crews of sudden directional change or wind surge
   */
  public playWindShiftWarning() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const beeps = [0, 0.18, 0.36, 0.54];
      
      beeps.forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        // Alternating pitch 750Hz and 1050Hz
        osc.frequency.setValueAtTime(i % 2 === 0 ? 750 : 1050, now + t);
        gain.gain.setValueAtTime(0.3, now + t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.15);
      });
    } catch (e) {
      console.warn('Audio context error on wind shift alert', e);
    }
  }

  /**
   * Stops any currently looping emergency alarm
   */
  public stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.osc1) {
      try { this.osc1.stop(); } catch (_) { /* ignore */ }
      this.osc1 = null;
    }
    if (this.osc2) {
      try { this.osc2.stop(); } catch (_) { /* ignore */ }
      this.osc2 = null;
    }
  }
}

export const soundSystem = new TacticalSoundSystem();
