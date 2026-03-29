const SAMPLE_RATE = 44100;
const DURATION = 4;
export class AudioManager {
    constructor() {
        Object.defineProperty(this, "_context", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "buffers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "currentSource", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "currentGain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "currentAmbient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "masterVolume", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
    }
    get context() {
        if (!this._context)
            this._context = new AudioContext();
        return this._context;
    }
    async resume() {
        if (this.context.state === 'suspended')
            await this.context.resume();
    }
    async generateProcedural(name) {
        const frames = SAMPLE_RATE * DURATION;
        const offline = new OfflineAudioContext(1, frames, SAMPLE_RATE);
        const masterGain = offline.createGain();
        masterGain.gain.value = 0.18;
        masterGain.connect(offline.destination);
        if (name === 'floresta' || name === 'cidade' || name === 'chuva' || name === 'batalha') {
            const noiseBuffer = offline.createBuffer(1, frames, SAMPLE_RATE);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < frames; i++)
                data[i] = Math.random() * 2 - 1;
            const noise = offline.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;
            const filter = offline.createBiquadFilter();
            if (name === 'floresta') { filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 0.8; }
            else if (name === 'cidade') { filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 1; }
            else if (name === 'chuva') { filter.type = 'lowpass'; filter.frequency.value = 1200; filter.Q.value = 0.5; }
            else if (name === 'batalha') { filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 2; }
            noise.connect(filter);
            filter.connect(masterGain);
            noise.start(0);
        }
        else {
            const osc = offline.createOscillator();
            if (name === 'caverna') { osc.type = 'sine'; osc.frequency.value = 55; }
            else if (name === 'dungeon') { osc.type = 'sawtooth'; osc.frequency.value = 80; }
            const oscGain = offline.createGain();
            oscGain.gain.value = 0.4;
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start(0);
        }
        return offline.startRendering();
    }
    async loadAmbient(name) {
        if (this.buffers.has(name))
            return;
        const formats = ['ogg', 'mp3'];
        for (const fmt of formats) {
            try {
                const res = await fetch(`/assets/audio/${name}.${fmt}`);
                if (!res.ok)
                    continue;
                const buf = await this.context.decodeAudioData(await res.arrayBuffer());
                this.buffers.set(name, buf);
                return;
            }
            catch { /* try next format */ }
        }
        try {
            const buf = await this.generateProcedural(name);
            this.buffers.set(name, buf);
        }
        catch (e) {
            console.warn(`AudioManager: could not generate procedural for ${name}`, e);
        }
    }
    async crossfadeTo(name, durationMs = 1500) {
        await this.loadAmbient(name);
        const buf = this.buffers.get(name);
        if (!buf)
            return;
        await this.resume();
        const ctx = this.context;
        const duration = durationMs / 1000;
        if (this.currentGain) {
            const g = this.currentGain;
            g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
            setTimeout(() => { try { this.currentSource?.stop(); } catch { } }, durationMs);
        }
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.masterVolume, ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        this.currentSource = source;
        this.currentGain = gain;
        this.currentAmbient = name;
    }
    setVolume(v) {
        this.masterVolume = Math.max(0, Math.min(1, v));
        if (this.currentGain)
            this.currentGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
    }
}
