import type { Cast, LineValue } from './types';

/** A source of numbers in [0, 1). / Источник чисел из [0, 1). */
export type Random = () => number;

/** One coin: 3 for the side of yang (the solid line), 2 for the side of yin (the broken line). / Одна монета: 3 — сторона ян, 2 — сторона инь. */
export type Coin = 2 | 3;

export type Coins = readonly [Coin, Coin, Coin];

/** One throw of three coins: what each showed and the line value they make together. / Один бросок трёх монет. */
export interface Throw {
    coins: Coins;
    value: LineValue;
}

/**
 * A source of random numbers from the system: `crypto.getRandomValues`, 32 bits at a time.
 * The oracle must not be a predictable sequence, so `Math.random` is not used here.
 * Источник случайных чисел от системы. Оракул не должен быть предсказуемой последовательностью, поэтому не `Math.random`.
 */
export function systemRandom(): Random {
    const buffer = new Uint32Array(1);
    return () => {
        globalThis.crypto.getRandomValues(buffer);
        return buffer[0]! / 4294967296;
    };
}

/** What three coins make: 6, 7, 8 or 9. / Что дают три монеты. */
export function valueOf(coins: Coins): LineValue {
    return (coins[0] + coins[1] + coins[2]) as LineValue;
}

/** Throws three coins. Each one falls on either side with the same chance. / Бросает три монеты. */
export function throwCoins(random: Random): Throw {
    const coin = (): Coin => (random() < 0.5 ? 2 : 3);
    const coins: Coins = [coin(), coin(), coin()];
    return { coins, value: valueOf(coins) };
}

/**
 * The six throws of a hexagram, from the bottom line to the top one.
 * Шесть бросков гексаграммы, от нижней линии к верхней.
 */
export function throwHexagram(random: Random): Throw[] {
    return Array.from({ length: 6 }, () => throwCoins(random));
}

/** The six values of the throws as a cast. / Шесть значений бросков как результат гадания. */
export function castOf(throws: readonly Throw[]): Cast {
    if (throws.length !== 6) throw new RangeError(`A hexagram needs six throws, got ${throws.length}`);
    return throws.map((t) => t.value) as unknown as Cast;
}

/** Whether six numbers are a cast: each one is 6, 7, 8 or 9. / Годятся ли шесть чисел как результат гадания. */
export function isCast(values: unknown): values is Cast {
    return Array.isArray(values) && values.length === 6 && values.every((value) => value === 6 || value === 7 || value === 8 || value === 9);
}
