import { createSavedStorage } from '@1337exp/taoux/storage';
import { computed, ref } from 'vue';
import { castOf, systemRandom, throwCoins, type Throw } from '../core/cast';
import type { ReadingMode } from '../core/reading';

const random = systemRandom();
const modeStorage = createSavedStorage('hexa-proof.mode');

/** The question: only for the person, it is not used to cast. / Вопрос: только для человека, на бросок он не влияет. */
export const question = ref('');

/** The throws so far, from the bottom line up. / Броски на сейчас, от нижней линии вверх. */
export const throws = ref<Throw[]>([]);

/** The cast, once all six lines are thrown. / Результат, когда брошены все шесть линий. */
export const cast = computed(() => (throws.value.length === 6 ? castOf(throws.value) : null));

const savedMode = modeStorage.read();
export const readingMode = ref<ReadingMode>(savedMode === 'all' ? 'all' : 'classic');

export function setReadingMode(mode: ReadingMode): void {
    readingMode.value = mode;
    modeStorage.write(mode);
}

/** Throws the next line. Nothing happens when the hexagram is complete. / Бросает следующую линию. */
export function throwNext(): Throw | null {
    if (throws.value.length >= 6) return null;
    const next = throwCoins(random);
    throws.value = [...throws.value, next];
    return next;
}

export function throwAll(): void {
    while (throws.value.length < 6) throwNext();
}

export function reset(): void {
    throws.value = [];
}
