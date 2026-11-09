import { describe, expect, it } from 'vitest';
import {
    castLines,
    changingPositions,
    hexagram,
    hexagramByLines,
    inverseOf,
    isChanging,
    isYang,
    primaryOf,
    relatingOf,
    reversedOf,
    trigramsOf,
} from '../src/core/hexagram';
import type { Cast, LineValue } from '../src/core/types';
import { HEXAGRAMS } from '../src/data/hexagrams';
import { TRIGRAMS } from '../src/data/trigrams';

describe('the table of 64', () => {
    it('has 64 numbered 1…64 with 64 different figures', () => {
        expect(HEXAGRAMS.map((h) => h.number)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
        expect(new Set(HEXAGRAMS.map((h) => h.lines)).size).toBe(64);
        for (const h of HEXAGRAMS) expect(h.lines).toMatch(/^[01]{6}$/);
    });

    it('has the figures everyone knows', () => {
        expect(hexagram(1).lines).toBe('111111');
        expect(hexagram(2).lines).toBe('000000');
        expect(hexagram(3).lines).toBe('100010'); // the thunder below, the water above: one solid line at the bottom
        expect(hexagram(23).lines).toBe('000001'); // splitting apart: one solid line left at the top
        expect(hexagram(24).lines).toBe('100000'); // return: one solid line comes back at the bottom
        expect(hexagram(63).lines).toBe('101010'); // after completion: the lines alternate, and each sits in its place
        expect(hexagram(64).lines).toBe('010101');
    });

    it('takes a figure back by its lines and rejects a wrong one', () => {
        for (const h of HEXAGRAMS) expect(hexagramByLines(h.lines)).toBe(h);
        expect(() => hexagramByLines('11')).toThrow();
        expect(() => hexagram(0)).toThrow(RangeError);
        expect(() => hexagram(65)).toThrow(RangeError);
        expect(() => hexagram(1.5)).toThrow(RangeError);
    });

    it('gives the lower and the upper trigram', () => {
        expect(trigramsOf(3).lower).toBe(TRIGRAMS.zhen);
        expect(trigramsOf(3).upper).toBe(TRIGRAMS.kan);
        expect(trigramsOf(11).lower).toBe(TRIGRAMS.qian); // peace: heaven below, earth above
        expect(trigramsOf(11).upper).toBe(TRIGRAMS.kun);
    });
});

describe('pairs', () => {
    it('inverse: every line the other way (3 ↔ 50, 1 ↔ 2)', () => {
        expect(inverseOf(1).number).toBe(2);
        expect(inverseOf(3).number).toBe(50);
        expect(inverseOf(50).number).toBe(3);
        for (const h of HEXAGRAMS) expect(inverseOf(inverseOf(h.number).number).number).toBe(h.number);
    });

    it('reversed: the figure upside down (3 ↔ 4, 11 ↔ 12)', () => {
        expect(reversedOf(3).number).toBe(4);
        expect(reversedOf(11).number).toBe(12);
        expect(reversedOf(1).number).toBe(1);
        for (const h of HEXAGRAMS) expect(reversedOf(reversedOf(h.number).number).number).toBe(h.number);
    });
});

describe('a cast', () => {
    it('knows which values are yang and which move', () => {
        expect([6, 7, 8, 9].map((v) => isYang(v as LineValue))).toEqual([false, true, false, true]);
        expect([6, 7, 8, 9].map((v) => isChanging(v as LineValue))).toEqual([true, false, false, true]);
    });

    it('draws the primary hexagram from the lines as they stand', () => {
        expect(primaryOf([7, 7, 7, 7, 7, 7]).number).toBe(1);
        expect(primaryOf([8, 8, 8, 8, 8, 8]).number).toBe(2);
        // old lines count as what they are now: 9 is solid, 6 is broken
        expect(primaryOf([9, 8, 8, 8, 8, 8]).number).toBe(24);
        expect(castLines([9, 6, 7, 8, 9, 6])).toBe('101010');
    });

    it('has no relating hexagram when nothing moves', () => {
        expect(relatingOf([7, 8, 7, 8, 7, 8])).toBeNull();
    });

    it('turns every changing line into its opposite', () => {
        // The Creative with the bottom line moving becomes Coming to Meet (44); with the top line, Breakthrough (43).
        expect(relatingOf([9, 7, 7, 7, 7, 7])?.number).toBe(44);
        expect(relatingOf([7, 7, 7, 7, 7, 9])?.number).toBe(43);
        // The Receptive with the bottom line moving becomes Return (24): one solid line appears at the bottom.
        expect(relatingOf([6, 8, 8, 8, 8, 8])?.number).toBe(24);
        // all six moving: the Creative becomes the Receptive and the other way round
        expect(relatingOf([9, 9, 9, 9, 9, 9])?.number).toBe(2);
        expect(relatingOf([6, 6, 6, 6, 6, 6])?.number).toBe(1);
        // a changing line only flips; the quiet ones stay
        // as they stand: 0 1 0 1 1 0; the 6 below and the 9 at the fourth place turn over: 1 1 0 0 1 0
        expect(primaryOf([6, 7, 8, 9, 7, 8]).lines).toBe('010110');
        expect(relatingOf([6, 7, 8, 9, 7, 8])?.lines).toBe('110010');
    });

    it('is symmetric: the relating of the relating returns to the start (for the moving lines)', () => {
        const cast: Cast = [9, 6, 7, 8, 9, 6];
        const relating = relatingOf(cast)!;
        // turn each moving line again and we are back at the primary figure
        const back = [...relating.lines].map((line, i) => (isChanging(cast[i]!) ? (line === '1' ? '0' : '1') : line)).join('');
        expect(back).toBe(primaryOf(cast).lines);
    });

    it('lists the moving positions from the bottom', () => {
        expect(changingPositions([9, 6, 7, 8, 9, 6])).toEqual([1, 2, 5, 6]);
        expect(changingPositions([7, 8, 7, 8, 7, 8])).toEqual([]);
    });
});
