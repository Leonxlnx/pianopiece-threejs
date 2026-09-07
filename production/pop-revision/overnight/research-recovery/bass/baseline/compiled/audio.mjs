import { clamp } from './math.mjs';
export class PerformanceAudio {
    context;
    buffer;
    gain;
    source;
    analyser;
    sourceGain;
    offset = 0;
    startAt = 0;
    playing = false;
    loaded = false;
    volume = .78;
    ended = false;
    fetchController;
    generation = 0;
    disposed = false;
    renderedEnd = false;
    meter;
    async load(progress) {
        if (this.disposed)
            return;
        const context = this.context ??= new AudioContext({ latencyHint: 'playback', sampleRate: 44100 });
        this.gain = context.createGain();
        this.gain.gain.value = this.volume;
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 512;
        this.meter = new Float32Array(this.analyser.fftSize);
        this.gain.connect(this.analyser);
        this.analyser.connect(context.destination);
        context.onstatechange = () => {
            // Mobile interruptions should leave a working Play button on return.
            if (!this.disposed && this.playing && this.source && context.state !== 'running')
                this.pause();
        };
        this.fetchController = new AbortController();
        const response = await fetch('/assets/daybreak.mp3', { signal: this.fetchController.signal });
        if (!response.ok)
            throw new Error('The recording could not load. Please try again.');
        const total = Number(response.headers.get('content-length')) || 0;
        const reader = response.body?.getReader();
        let bytes;
        if (reader) {
            const chunks = [];
            let received = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                chunks.push(value);
                received += value.length;
                if (total && !this.disposed)
                    progress(Math.min(.92, received / total * .92));
            }
            const combined = new Uint8Array(received);
            let i = 0;
            for (const c of chunks) {
                combined.set(c, i);
                i += c.length;
            }
            bytes = combined.buffer;
        }
        else
            bytes = await response.arrayBuffer();
        if (this.disposed)
            return;
        progress(.94);
        const decoded = await context.decodeAudioData(bytes);
        if (this.disposed)
            return;
        this.buffer = decoded;
        this.loaded = true;
        progress(1);
    }
    get duration() { return this.buffer?.duration ?? 0; }
    // Estimate the sample reaching the output device, with a fallback during startup.
    time() {
        if (!this.playing || !this.context || !this.source)
            return this.offset;
        const context = this.context;
        let clock = context.currentTime - (context.baseLatency || 0) - (context.outputLatency || 0);
        const ts = context.getOutputTimestamp?.();
        if (ts && Number.isFinite(ts.contextTime) && Number.isFinite(ts.performanceTime) && ts.contextTime > 0 && ts.performanceTime > 0) {
            clock = Math.min(context.currentTime, ts.contextTime + (performance.now() - ts.performanceTime) / 1000);
        }
        // A scheduled source has not yet emitted the requested offset; never rewind before it.
        const t = clamp(this.offset + Math.max(0, clock - this.startAt), 0, this.duration);
        if (this.renderedEnd && t >= this.duration - .0002) {
            this.offset = this.duration;
            this.playing = false;
            this.ended = true;
            this.source.disconnect();
            this.sourceGain?.disconnect();
            this.source = undefined;
            this.sourceGain = undefined;
        }
        return t;
    }
    async play() {
        if (this.disposed || !this.context || !this.buffer || !this.gain || this.playing)
            return;
        const context = this.context;
        const generation = ++this.generation;
        if (this.offset >= this.duration - .001)
            this.offset = 0;
        this.playing = true; // This is the desired transport state, including pending resume.
        this.ended = false;
        this.renderedEnd = false;
        try {
            await context.resume();
            if (this.disposed || generation !== this.generation || !this.playing)
                return;
            const src = context.createBufferSource();
            const envelope = context.createGain();
            src.buffer = this.buffer;
            src.connect(envelope);
            envelope.connect(this.gain);
            this.startAt = context.currentTime + .045;
            envelope.gain.setValueAtTime(0, this.startAt);
            envelope.gain.linearRampToValueAtTime(1, this.startAt + .004);
            this.source = src;
            this.sourceGain = envelope;
            src.onended = () => {
                if (this.source === src && this.playing) {
                    // Rendering ends before the final samples reach the speakers. time() completes the UI.
                    this.renderedEnd = true;
                }
                else {
                    src.disconnect();
                    envelope.disconnect();
                }
            };
            src.start(this.startAt, this.offset);
        }
        catch (error) {
            if (this.disposed || generation !== this.generation)
                return;
            this.playing = false;
            this.releaseSource();
            throw error;
        }
    }
    releaseSource() {
        const src = this.source, envelope = this.sourceGain, context = this.context;
        this.source = undefined;
        this.sourceGain = undefined;
        if (!src)
            return;
        src.onended = () => { src.disconnect(); envelope?.disconnect(); };
        try {
            if (context && context.state === 'running' && envelope) {
                const now = context.currentTime;
                envelope.gain.cancelScheduledValues(now);
                envelope.gain.setTargetAtTime(0, now, .003);
                src.stop(now + .018);
            }
            else {
                src.stop();
                src.disconnect();
                envelope?.disconnect();
            }
        }
        catch {
            src.disconnect();
            envelope?.disconnect();
        }
    }
    pause() {
        ++this.generation; // Cancels a resume even when no source has been created yet.
        if (this.playing)
            this.offset = this.time();
        this.playing = false;
        this.renderedEnd = false;
        this.releaseSource();
    }
    async seek(t) {
        const wasPlaying = this.playing;
        this.pause();
        this.offset = clamp(t, 0, this.duration);
        this.ended = this.duration > 0 && this.offset >= this.duration;
        if (wasPlaying && !this.ended)
            await this.play();
    }
    async restart() {
        const wasPlaying = this.playing;
        this.pause();
        this.offset = 0;
        this.ended = false;
        if (wasPlaying)
            await this.play();
    }
    setVolume(v) {
        this.volume = clamp(v);
        if (this.gain && this.context)
            this.gain.gain.setTargetAtTime(this.volume, this.context.currentTime, .025);
    }
    rms() {
        if (!this.analyser || !this.meter)
            return 0;
        this.analyser.getFloatTimeDomainData(this.meter);
        return Math.sqrt(this.meter.reduce((s, n) => s + n * n, 0) / this.meter.length);
    }
    dispose() {
        if (this.disposed)
            return;
        this.pause();
        this.disposed = true;
        this.fetchController?.abort();
        if (this.context) {
            this.context.onstatechange = null;
            void this.context.close().catch(() => { });
        }
        this.gain?.disconnect();
        this.analyser?.disconnect();
        this.buffer = undefined;
        this.loaded = false;
    }
}
