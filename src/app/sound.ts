import { createSavedStorage } from '@1337exp/taoux/storage';
import { ref } from 'vue';

/**
 * The sound of the table: a dull, deep drum struck with a stick, one beat for every coin that lands. It is made by WebAudio on the spot,
 * so there are no sound files. It is for the table only and never touches the numbers of the cast.
 * Звук стола: глухой низкий барабан, по которому бьют палкой, один удар на каждую упавшую монету. Его делает WebAudio на месте, файлов нет.
 * К числам броска он отношения не имеет.
 */

const storage = createSavedStorage('hexa-proof.sound');

/** Whether the sound is on; the choice is kept. / Включён ли звук; выбор запоминается. */
export const soundOn = ref(storage.read() !== 'off');

export function setSound(on: boolean): void {
    soundOn.value = on;
    storage.write(on ? 'on' : 'off');
}

let context: AudioContext | null = null;
let output: AudioNode | null = null;
let noise: AudioBuffer | null = null;

/**
 * Wakes the audio. A browser keeps the sound shut until the person has pressed something, so it is called from the press that throws.
 * Будит звук. Браузер держит его выключенным, пока человек ничего не нажал, поэтому зовётся из нажатия, которое бросает.
 */
export function unlockSound(): void {
    if (!soundOn.value) return;
    try {
        if (!context) {
            context = new AudioContext();
            // three coins land together: a gentle compressor keeps the sum from clipping
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -14;
            compressor.ratio.value = 6;
            compressor.connect(context.destination);
            output = compressor;
            noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.12), context.sampleRate);
            const data = noise.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        if (context.state === 'suspended') void context.resume();
    } catch {
        context = null; // no WebAudio: the table is silent
    }
}

/** One beat of the drum; `strength` is 0…1. / Один удар барабана; `strength` от 0 до 1. */
export function thud(strength = 1): void {
    if (!soundOn.value || !context || !output || !noise || context.state !== 'running') return;
    const ctx = context;
    const t0 = ctx.currentTime;
    const k = Math.min(1, Math.max(0.2, strength));
    const pitch = 0.92 + Math.random() * 0.16; // no two beats are the same

    const muffle = ctx.createBiquadFilter(); // the skin is wrapped: the high part is taken away
    muffle.type = 'lowpass';
    muffle.frequency.value = 900;
    muffle.connect(output);

    // the body of the drum: a note that falls fast and fades
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(150 * pitch, t0);
    body.frequency.exponentialRampToValueAtTime(58 * pitch, t0 + 0.11);
    bodyGain.gain.setValueAtTime(0.0001, t0);
    bodyGain.gain.exponentialRampToValueAtTime(0.9 * k, t0 + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    body.connect(bodyGain).connect(muffle);
    body.start(t0);
    body.stop(t0 + 0.55);

    // the boom under it: lower and a little longer
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(88 * pitch, t0);
    boom.frequency.exponentialRampToValueAtTime(44 * pitch, t0 + 0.2);
    boomGain.gain.setValueAtTime(0.0001, t0);
    boomGain.gain.exponentialRampToValueAtTime(0.55 * k, t0 + 0.006);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
    boom.connect(boomGain).connect(muffle);
    boom.start(t0);
    boom.stop(t0 + 0.75);

    // the stick: a short soft knock, only a little of it
    const knock = ctx.createBufferSource();
    const knockFilter = ctx.createBiquadFilter();
    const knockGain = ctx.createGain();
    knock.buffer = noise;
    knockFilter.type = 'bandpass';
    knockFilter.frequency.value = 1400 * pitch;
    knockFilter.Q.value = 0.7;
    knockGain.gain.setValueAtTime(0.28 * k, t0);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
    knock.connect(knockFilter).connect(knockGain).connect(output);
    knock.start(t0);
    knock.stop(t0 + 0.06);
}
