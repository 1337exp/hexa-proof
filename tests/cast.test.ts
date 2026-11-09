import { describe, expect, it } from 'vitest';
import { castOf, isCast, systemRandom, throwCoins, throwHexagram, valueOf, type Coins, type Random } from '../src/core/cast';
import type { LineValue } from '../src/core/types';

/** A tiny deterministic generator for the tests (mulberry32). / Маленький детерминированный генератор для тестов. */
function seeded(seed: number): Random {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

describe('the value of three coins', () => {
    it('adds the sides up: 2 is yin, 3 is yang', () => {
        expect(valueOf([2, 2, 2])).toBe(6);
        expect(valueOf([2, 2, 3])).toBe(7);
        expect(valueOf([3, 2, 2])).toBe(7);
        expect(valueOf([2, 3, 3])).toBe(8);
        expect(valueOf([3, 3, 3])).toBe(9);
    });

    it('turns a fixed source into fixed coins', () => {
        const low: Random = () => 0.1; // every coin on its yin side
        const high: Random = () => 0.9; // every coin on its yang side
        expect(throwCoins(low)).toEqual({ coins: [2, 2, 2], value: 6 });
        expect(throwCoins(high)).toEqual({ coins: [3, 3, 3], value: 9 });
    });
});

describe('the chances of the lines', () => {
    it('are 1/8, 3/8, 3/8, 1/8 for 6, 7, 8, 9 (the method of three coins)', () => {
        const random = seeded(20261109);
        const count: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
        const N = 400_000;
        for (let i = 0; i < N; i++) count[throwCoins(random).value]!++;
        const share = (value: LineValue) => count[value]! / N;
        expect(share(6)).toBeCloseTo(1 / 8, 2);
        expect(share(7)).toBeCloseTo(3 / 8, 2);
        expect(share(8)).toBeCloseTo(3 / 8, 2);
        expect(share(9)).toBeCloseTo(1 / 8, 2);
    });

    it('shows that the coins do not lean to one side: all the eight sequences come up evenly', () => {
        const random = seeded(7);
        const seen = new Map<string, number>();
        const N = 160_000;
        for (let i = 0; i < N; i++) {
            const key = (throwCoins(random).coins as Coins).join('');
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect(seen.size).toBe(8);
        for (const n of seen.values()) expect(n / N).toBeCloseTo(1 / 8, 2);
    });
});

describe('a hexagram', () => {
    it('is six throws, and the cast keeps their values from the bottom line up', () => {
        const throws = throwHexagram(seeded(1));
        expect(throws).toHaveLength(6);
        expect(castOf(throws)).toEqual(throws.map((t) => t.value));
        expect(() => castOf(throws.slice(0, 5))).toThrow(RangeError);
    });

    it('recognises a cast', () => {
        expect(isCast([6, 7, 8, 9, 7, 8])).toBe(true);
        expect(isCast([6, 7, 8, 9, 7])).toBe(false);
        expect(isCast([6, 7, 8, 9, 7, 5])).toBe(false);
        expect(isCast('678978')).toBe(false);
    });
});

describe('the system source', () => {
    it('gives numbers in [0, 1) that differ from one call to the next', () => {
        const random = systemRandom();
        const numbers = Array.from({ length: 200 }, random);
        expect(numbers.every((n) => n >= 0 && n < 1)).toBe(true);
        expect(new Set(numbers).size).toBeGreaterThan(190);
    });
});
