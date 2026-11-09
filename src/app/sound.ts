import { createSavedStorage } from '@1337exp/taoux/storage';
import { ref } from 'vue';

/**
 * The sound of the table: the flip of the coins when they are thrown, and a taiko drum when the golden glow runs over them.
 * Both are short recorded sounds (see THIRD-PARTY-NOTICES.md). The sound is for the table only and never touches the numbers of the cast.
 * Звук стола: щелчок монет, когда их бросают, и барабан тайко, когда по ним бежит золотое свечение. Оба звука короткие записи
 * (см. THIRD-PARTY-NOTICES.md). Звук нужен только столу и к числам броска отношения не имеет.
 */

const storage = createSavedStorage('hexa-proof.sound');

/** Whether the sound is on; the choice is kept. / Включён ли звук; выбор запоминается. */
export const soundOn = ref(storage.read() !== 'off');

export function setSound(on: boolean): void {
    soundOn.value = on;
    storage.write(on ? 'on' : 'off');
}

type Name = 'flip' | 'taiko';

const URLS: Record<Name, string> = {
    flip: new URL('../assets/sound/coin-flip.mp3', import.meta.url).href,
    taiko: new URL('../assets/sound/taiko.mp3', import.meta.url).href,
};
/** How loud each one is, 0…1. / Громкость каждого, от 0 до 1. */
const VOLUME: Record<Name, number> = { flip: 0.05, taiko: 0.4 };

let context: AudioContext | null = null;
const fetched = new Map<Name, Promise<ArrayBuffer | null>>();
const decoded = new Map<Name, Promise<AudioBuffer | null>>();

/**
 * Starts loading the files, so they are there by the first throw. It needs no press: no audio is created yet.
 * Начинает грузить файлы, чтобы они были к первому броску. Нажатие не нужно: звук ещё не создан.
 */
export function prefetchSound(): void {
    for (const name of Object.keys(URLS) as Name[]) {
        if (fetched.has(name)) continue;
        fetched.set(
            name,
            fetch(URLS[name])
                .then((response) => response.arrayBuffer())
                .catch(() => null), // the file did not come: that sound is silent, the rest works
        );
    }
}

/**
 * Wakes the audio and decodes the sounds. A browser keeps the sound shut until the person has pressed something, so it is called from the
 * press that throws.
 * Будит звук и разбирает записи. Браузер держит звук выключенным, пока человек ничего не нажал, поэтому зовётся из нажатия, которое бросает.
 */
export function unlockSound(): void {
    if (!soundOn.value) return;
    try {
        if (!context) {
            const ctx = new AudioContext();
            context = ctx;
            prefetchSound();
            for (const name of Object.keys(URLS) as Name[]) {
                decoded.set(
                    name,
                    (fetched.get(name) ?? Promise.resolve(null)).then((data) => (data ? ctx.decodeAudioData(data) : null)).catch(() => null),
                );
            }
        }
        if (context.state === 'suspended') void context.resume();
    } catch {
        context = null; // no WebAudio: the table is silent
    }
}

function play(name: Name, rate = 1): void {
    const ctx = context;
    const ready = decoded.get(name);
    if (!soundOn.value || !ctx || !ready) return;
    void ready.then((buffer) => {
        if (!buffer || !soundOn.value || ctx.state !== 'running') return;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        gain.gain.value = VOLUME[name];
        source.connect(gain).connect(ctx.destination);
        source.start();
    });
}

/**
 * The coins are thrown. The recording is about a second long and ends with the clink of the landing, so it is played as fast as the table
 * runs (`rate`, the speed of the stage): then the clink falls on the landing.
 * Монеты брошены. Запись длится около секунды и кончается звоном падения, поэтому она идёт так же быстро, как стол (`rate`, скорость сцены):
 * тогда звон попадает в падение.
 */
export function playFlip(rate = 1): void {
    play('flip', rate);
}

/** The golden glow starts: a stroke of the taiko. / Золотое свечение началось: удар тайко. */
export function playTaiko(): void {
    play('taiko');
}
