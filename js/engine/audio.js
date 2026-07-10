/* ===================================================
   Audio Manager — Procedural sounds via Web Audio API
   =================================================== */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.5;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.6;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available:', e);
        }
    }

    // Ensure audio context is resumed (needed after user gesture on mobile)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play a note
    _playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume * this.sfxVolume * this.masterVolume,
            this.ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001,
            this.ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }

    // Chime cluster — success sound
    playSuccess() {
        this.init();
        this.resume();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            this._playTone(freq, 0.4, 'sine', 0.25, i * 0.08);
        });
    }

    // Gentle boop — retry sound
    playRetry() {
        this.init();
        this.resume();
        this._playTone(330, 0.3, 'sine', 0.2);
        this._playTone(294, 0.3, 'sine', 0.15, 0.1);
    }

    // Twinkle — star collection
    playStarCollect() {
        this.init();
        this.resume();
        this._playTone(880, 0.15, 'sine', 0.2);
        this._playTone(1108.73, 0.15, 'sine', 0.2, 0.08);
        this._playTone(1318.51, 0.25, 'sine', 0.25, 0.16);
    }

    // Whoosh — glider travel
    playWhoosh() {
        if (!this.ctx) { this.init(); }
        this.resume();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.6);

        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08 * this.sfxVolume * this.masterVolume,
            this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.7);
    }

    // Click / tap sound
    playClick() {
        this.init();
        this.resume();
        this._playTone(600, 0.08, 'sine', 0.15);
    }

    // Drawing stroke sound (soft continuous)
    playDrawTick() {
        this.init();
        this.resume();
        this._playTone(MathUtils.randFloat(400, 800), 0.05, 'sine', 0.05);
    }

    // Ambient gentle melody loop (simple arpeggio)
    playMenuMusic() {
        if (!this.ctx) { this.init(); }
        this.resume();
        if (!this.ctx) return;

        // Simple repeating pattern
        const notes = [262, 330, 392, 523, 392, 330]; // C4 E4 G4 C5 G4 E4
        const noteLen = 0.8;
        notes.forEach((freq, i) => {
            this._playTone(freq, noteLen * 0.9, 'sine',
                0.08 * this.musicVolume, i * noteLen);
        });
    }

    // Voice over using Web Speech API
    playVoiceOver(text) {
        if (!window.speechSynthesis) return;
        
        // Cancel any currently playing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.masterVolume;
        // Try to pick a friendly/female voice if available
        const voices = window.speechSynthesis.getVoices();
        const friendlyVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
        if (friendlyVoice) {
            utterance.voice = friendlyVoice;
        }
        
        utterance.rate = 1.1; // Slightly faster, more energetic
        utterance.pitch = 1.2; // Slightly higher pitch for a cute voice
        
        window.speechSynthesis.speak(utterance);
    }

    // Magical sound when Ayoub gives a gift
    playGiftSound() {
        this.init();
        this.resume();
        this._playTone(1046.5, 0.1, 'sine', 0.2); // C6
        this._playTone(1318.51, 0.15, 'sine', 0.2, 0.1); // E6
        this._playTone(1567.98, 0.3, 'sine', 0.2, 0.25); // G6
    }

    setMasterVolume(v) {
        this.masterVolume = MathUtils.clamp(v, 0, 1);
    }
}
