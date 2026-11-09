import { createSavedStorage } from '@1337exp/taoux/storage';
import { ref } from 'vue';

/**
 * The sound of the table: the flip of the coins when they are thrown, and a taiko drum when the golden glow runs over them.
 * Both are short recorded sounds (see THIRD-PARTY-NOTICES.md). The sound is for the table only and never touches the numbers of the cast.
 *
 * Everything is warmed up before it is needed, so that nothing is loaded or woken while the coins fly: the files are fetched and decoded when
 * the table appears (decoding needs no press), and the audio context is woken by the first press anywhere on the page, long before the first throw.
 *
 * Звук стола: щелчок монет, когда их бросают, и барабан тайко, когда по ним бежит золотое свечение. Оба звука короткие записи
 * (см. THIRD-PARTY-NOTICES.md). Звук нужен только столу и к числам броска отношения не имеет.
 * Всё прогревается заранее, чтобы ничего не грузилось и не просыпалось, пока монеты летят: файлы грузятся и разбираются, когда появляется стол
 * (разбору нажатие не нужно), а звуковой контекст будит первое же нажатие где угодно на странице, задолго до первого броска.
 */

const storage = createSavedStorage('hexa-proof.sound');

/** Whether the sound is on; the choice is kept. / Включён ли звук; выбор запоминается. */
export const soundOn = ref(storage.read() !== 'off');

export function setSound(on: boolean): void {
    soundOn.value = on;
    storage.write(on ? 'on' : 'off');
    if (on) unlockSound(); // the switch is a press: the audio can be woken now
}

type Name = 'flip' | 'taiko';

const URLS: Record<Name, string> = {
    flip: new URL('../assets/sound/coin-flip.mp3', import.meta.url).href,
    taiko: new URL('../assets/sound/taiko.mp3', import.meta.url).href,
};
/** How loud each one is, 0…1: from the lowest to the highest, a random one in between at every play, so the flips do not tire. / Громкость каждого, от 0 до 1: на каждый раз случайная между меньшей и большей, чтобы щелчки не надоедали. */
const VOLUME: Record<Name, readonly [number, number]> = { flip: [0.03, 0.05], taiko: [0.25, 0.25] };
const SAMPLE_RATE = 44100;
/**
 * How a sound is softened. The flip begins with a ringing knock (the first 0.15 s of the recording) and ends with the clink of the landing: only
 * the beginning is turned down (`start`: its level, held for `hold` s of the recording, then brought back to full by `back`), and the high part is
 * cut (`lowpass`, Hz).
 * Как звук смягчён. Щелчок начинается звонким стуком (первые 0,15 с записи), а кончается звоном падения: приглушено только начало (`start` — его
 * уровень, держится `hold` с записи, к `back` возвращается к полному), и срезана верхушка (`lowpass`, Гц).
 */
const SOFTEN: Partial<Record<Name, { start: number; hold: number; back: number; lowpass: number }>> = {
    flip: { start: 0.25, hold: 0.3, back: 0.6, lowpass: 4500 },
};

let context: AudioContext | null = null;
const buffers = new Map<Name, AudioBuffer>();
let preparing = false;
let listening = false;

/**
 * Fetches and decodes the sounds. An offline context decodes without a press, so this can run as soon as the table appears. A buffer made
 * by it can be played by any context.
 * Грузит и разбирает звуки. Офлайн-контекст разбирает без нажатия, так что это можно делать, как только появился стол. Буфер оттуда играет любой контекст.
 */
export function prepareSound(): void {
    listenForFirstPress();
    if (preparing) return;
    preparing = true;
    void (async () => {
        try {
            const decoder = new OfflineAudioContext(2, SAMPLE_RATE, SAMPLE_RATE);
            for (const name of Object.keys(URLS) as Name[]) {
                try {
                    const data = await (await fetch(URLS[name])).arrayBuffer();
                    buffers.set(name, await decoder.decodeAudioData(data));
                } catch {
                    // this file did not come: its sound is silent, the other one works
                }
            }
        } catch {
            // no OfflineAudioContext: the table is silent
        }
    })();
}

/** The first press anywhere on the page wakes the audio, so the first throw finds it awake. / Первое нажатие на странице будит звук. */
function listenForFirstPress(): void {
    if (listening || typeof window === 'undefined') return;
    listening = true;
    const wake = (): void => {
        unlockSound();
        window.removeEventListener('pointerdown', wake, true);
        window.removeEventListener('keydown', wake, true);
    };
    window.addEventListener('pointerdown', wake, { capture: true, passive: true });
    window.addEventListener('keydown', wake, { capture: true, passive: true });
}

/**
 * Wakes the audio. A browser keeps the sound shut until the person has pressed something, so it is called from presses. A silent beat is played
 * at once: the first real sound of a context is the one that comes late, and it must not be ours.
 * Будит звук. Браузер держит звук выключенным, пока человек ничего не нажал, поэтому зовётся из нажатий. Сразу играется тихий удар: поздно приходит
 * именно первый настоящий звук контекста, и это не должен быть наш.
 */
export function unlockSound(): void {
    if (!soundOn.value) return;
    try {
        if (!context) {
            context = new AudioContext({ sampleRate: SAMPLE_RATE });
            const silence = context.createBufferSource();
            silence.buffer = context.createBuffer(1, 1, SAMPLE_RATE);
            silence.connect(context.destination);
            silence.start();
        }
        if (context.state === 'suspended') void context.resume();
    } catch {
        context = null; // no WebAudio: the table is silent
    }
}

function play(name: Name, rate = 1): void {
    const ctx = context;
    const buffer = buffers.get(name);
    if (!soundOn.value || !ctx || !buffer || ctx.state !== 'running') return;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const [low, high] = VOLUME[name];
    gain.gain.value = low + Math.random() * (high - low);
    const soft = SOFTEN[name];
    if (soft) {
        // the times are of the recording; it plays `rate` times as fast
        const now = ctx.currentTime;
        const level = gain.gain.value;
        gain.gain.setValueAtTime(level * soft.start, now);
        gain.gain.setValueAtTime(level * soft.start, now + soft.hold / rate);
        gain.gain.linearRampToValueAtTime(level, now + soft.back / rate);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = soft.lowpass;
        source.connect(filter).connect(gain).connect(ctx.destination);
    } else {
        source.connect(gain).connect(ctx.destination);
    }
    source.start();
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
