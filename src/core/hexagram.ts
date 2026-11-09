import { HEXAGRAMS, type HexagramFacts } from '../data/hexagrams';
import { trigramByLines, type Trigram } from '../data/trigrams';
import type { Cast, LineValue } from './types';

const byLines = new Map(HEXAGRAMS.map((hexagram) => [hexagram.lines, hexagram]));

/** A solid line: young yang (7) or old yang (9). / Сплошная линия: молодой ян (7) или старый ян (9). */
export const isYang = (value: LineValue): boolean => value === 7 || value === 9;

/** A changing line: old yin (6) or old yang (9). / Движущаяся линия: старый инь (6) или старый ян (9). */
export const isChanging = (value: LineValue): boolean => value === 6 || value === 9;

/** The hexagram with this King Wen number. / Гексаграмма с этим номером по Вэнь-вану. */
export function hexagram(number: number): HexagramFacts {
    const found = HEXAGRAMS[number - 1];
    if (!found || !Number.isInteger(number)) throw new RangeError(`There is no hexagram ${number}`);
    return found;
}

/** The hexagram drawn by six lines, bottom to top ('1' solid, '0' broken). / Гексаграмма по шести линиям снизу вверх. */
export function hexagramByLines(lines: string): HexagramFacts {
    const found = byLines.get(lines);
    if (!found) throw new Error(`Not a hexagram: ${lines}`);
    return found;
}

/** Lower and upper trigram of a hexagram. / Нижняя и верхняя триграммы гексаграммы. */
export function trigramsOf(number: number): { lower: Trigram; upper: Trigram } {
    const { lines } = hexagram(number);
    return { lower: trigramByLines(lines.slice(0, 3)), upper: trigramByLines(lines.slice(3)) };
}

/** The lines of a cast as '1' / '0', the changing ones kept as they are now. / Линии броска как '1' / '0' (движущиеся пока такие, как есть). */
export function castLines(cast: readonly LineValue[]): string {
    return cast.map((value) => (isYang(value) ? '1' : '0')).join('');
}

/** A figure as the values of quiet lines (7 solid, 8 broken), to draw it like a cast. / Фигура как значения спокойных линий. */
export const valuesOfLines = (lines: string): LineValue[] => [...lines].map((line) => (line === '1' ? 7 : 8));

/** The primary hexagram of a cast. / Основная гексаграмма броска. */
export function primaryOf(cast: Cast): HexagramFacts {
    return hexagramByLines(castLines(cast));
}

/**
 * The relating hexagram: every changing line turns into its opposite. Null when no line is changing.
 * Вторая гексаграмма: каждая движущаяся линия превращается в противоположную. Null, если движущихся нет.
 */
export function relatingOf(cast: Cast): HexagramFacts | null {
    if (!cast.some(isChanging)) return null;
    const lines = cast.map((value) => (isYang(value) !== isChanging(value) ? '1' : '0')).join('');
    return hexagramByLines(lines);
}

/** Positions (1…6, from the bottom) of the changing lines. / Позиции (1…6 снизу) движущихся линий. */
export function changingPositions(cast: readonly LineValue[]): number[] {
    return cast.flatMap((value, index) => (isChanging(value) ? [index + 1] : []));
}

/** The "inverse": every line turned into its opposite (1 ↔ 2, 3 ↔ 50…). / «Обратная»: все линии наоборот. */
export function inverseOf(number: number): HexagramFacts {
    return hexagramByLines([...hexagram(number).lines].map((line) => (line === '1' ? '0' : '1')).join(''));
}

/** The "reversed": the figure turned upside down (3 ↔ 4, 5 ↔ 6…); a few are their own reverse. / «Перевёрнутая»: фигура вверх ногами. */
export function reversedOf(number: number): HexagramFacts {
    return hexagramByLines([...hexagram(number).lines].reverse().join(''));
}
