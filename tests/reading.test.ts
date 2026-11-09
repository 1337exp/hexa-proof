import { describe, expect, it } from 'vitest';
import { readCast, type Passage, type ReadingMode } from '../src/core/reading';
import type { Cast } from '../src/core/types';

const judgment = (hexagram: number): Passage => ({ kind: 'judgment', hexagram });
const line = (hexagram: number, position: number): Passage => ({ kind: 'line', hexagram, position });

describe('the rule of Zhu Xi (classic)', () => {
    it('0 moving: the verdict of the primary hexagram', () => {
        const reading = readCast([7, 7, 7, 7, 7, 7]);
        expect(reading).toMatchObject({ primary: 1, relating: null, changing: [], rule: 'none', main: 0 });
        expect(reading.passages).toEqual([judgment(1)]);
    });

    it('1 moving: that line of the primary hexagram', () => {
        // The Creative, the second line moves: it becomes Fellowship (13)
        const reading = readCast([7, 9, 7, 7, 7, 7]);
        expect(reading).toMatchObject({ primary: 1, relating: 13, changing: [2], rule: 'one' });
        expect(reading.passages).toEqual([line(1, 2)]);
    });

    it('2 moving: both lines, the upper one weighs more', () => {
        const reading = readCast([9, 7, 6, 7, 7, 7]);
        expect(reading.changing).toEqual([1, 3]);
        expect(reading).toMatchObject({ rule: 'two', main: 1 });
        // the lines belong to the primary hexagram, whatever it is
        expect(reading.passages).toEqual([line(reading.primary, 1), line(reading.primary, 3)]);
    });

    it('3 moving with the first line among them: the verdicts of both, the primary weighs more', () => {
        const reading = readCast([9, 9, 9, 7, 7, 7]);
        expect(reading).toMatchObject({ primary: 1, rule: 'three', main: 0 });
        expect(reading.passages).toEqual([judgment(1), judgment(reading.relating!)]);
    });

    it('3 moving without the first line: the verdicts of both, the relating one weighs more', () => {
        const reading = readCast([7, 9, 9, 9, 7, 7]);
        expect(reading.changing).toEqual([2, 3, 4]);
        expect(reading).toMatchObject({ rule: 'threeLater', main: 1 });
        expect(reading.passages).toEqual([judgment(reading.primary), judgment(reading.relating!)]);
    });

    it('all twenty ways of three lines: the ten with the first line are governed by the primary hexagram, the other ten by the relating one', () => {
        let withFirst = 0;
        let without = 0;
        for (let mask = 0; mask < 64; mask++) {
            const positions = [1, 2, 3, 4, 5, 6].filter((p) => mask & (1 << (p - 1)));
            if (positions.length !== 3) continue;
            const cast = [1, 2, 3, 4, 5, 6].map((p) => (positions.includes(p) ? 9 : 7)) as unknown as Parameters<typeof readCast>[0];
            const reading = readCast(cast);
            if (positions.includes(1)) {
                withFirst++;
                expect(reading).toMatchObject({ rule: 'three', main: 0 });
            } else {
                without++;
                expect(reading).toMatchObject({ rule: 'threeLater', main: 1 });
            }
        }
        expect([withFirst, without]).toEqual([10, 10]);
    });

    it('4 moving: the two quiet lines of the relating hexagram, the lower one weighs more', () => {
        const reading = readCast([9, 9, 9, 9, 7, 7]);
        expect(reading).toMatchObject({ rule: 'four', main: 0 });
        expect(reading.passages).toEqual([line(reading.relating!, 5), line(reading.relating!, 6)]);
    });

    it('5 moving: the one quiet line of the relating hexagram', () => {
        const reading = readCast([9, 9, 9, 9, 9, 7]);
        expect(reading).toMatchObject({ rule: 'five' });
        expect(reading.passages).toEqual([line(reading.relating!, 6)]);
    });

    it('6 moving: the verdict of the relating hexagram', () => {
        // A cast that is neither the Creative nor the Receptive: as they stand 0 0 0 0 0 1 is Splitting Apart (23),
        // and with every line turned it is Breakthrough (43), the opposite of 23.
        const cast: Cast = [6, 6, 6, 6, 6, 9];
        const reading = readCast(cast);
        expect(reading).toMatchObject({ primary: 23, relating: 43, rule: 'six' });
        expect(reading.passages).toEqual([judgment(43)]);
    });

    it('6 moving in the Creative or the Receptive: the book\'s own word for it', () => {
        expect(readCast([9, 9, 9, 9, 9, 9])).toMatchObject({ primary: 1, relating: 2, rule: 'sixWhole' });
        expect(readCast([9, 9, 9, 9, 9, 9]).passages).toEqual([{ kind: 'useAll', hexagram: 1 }]);
        expect(readCast([6, 6, 6, 6, 6, 6])).toMatchObject({ primary: 2, relating: 1, rule: 'sixWhole' });
        expect(readCast([6, 6, 6, 6, 6, 6]).passages).toEqual([{ kind: 'useAll', hexagram: 2 }]);
    });
});

describe('the mode "all"', () => {
    const all: ReadingMode = 'all';

    it('with nothing moving is the same as classic', () => {
        expect(readCast([7, 8, 7, 8, 7, 8], all).passages).toEqual([judgment(readCast([7, 8, 7, 8, 7, 8]).primary)]);
    });

    it('gives the verdict, every moving line in order, then the verdict of the relating hexagram', () => {
        const reading = readCast([9, 7, 6, 7, 7, 7], all);
        expect(reading.rule).toBe('all');
        expect(reading.passages).toEqual([
            judgment(reading.primary),
            line(reading.primary, 1),
            line(reading.primary, 3),
            judgment(reading.relating!),
        ]);
    });

    it('adds the word for "all lines move" in the Creative and the Receptive', () => {
        expect(readCast([9, 9, 9, 9, 9, 9], all).passages).toEqual([
            judgment(1),
            line(1, 1),
            line(1, 2),
            line(1, 3),
            line(1, 4),
            line(1, 5),
            line(1, 6),
            { kind: 'useAll', hexagram: 1 },
            judgment(2),
        ]);
    });
});

describe('every cast', () => {
    it('is read without an error, and `main` points into `passages`', () => {
        const values = [6, 7, 8, 9] as const;
        // all 4^6 = 4096 casts
        for (let n = 0; n < 4096; n++) {
            const cast = Array.from({ length: 6 }, (_, i) => values[(n >> (2 * i)) & 3]) as unknown as Cast;
            for (const mode of ['classic', 'all'] as const) {
                const reading = readCast(cast, mode);
                expect(reading.passages.length).toBeGreaterThan(0);
                expect(reading.main).toBeGreaterThanOrEqual(0);
                expect(reading.main).toBeLessThan(reading.passages.length);
                for (const passage of reading.passages) {
                    expect(passage.hexagram).toBeGreaterThanOrEqual(1);
                    expect(passage.hexagram).toBeLessThanOrEqual(64);
                    if (passage.kind === 'line') expect(passage.position).toBeGreaterThanOrEqual(1);
                }
            }
        }
    });

    it('never points at a line that moves in the relating hexagram (rules 4 and 5 take the quiet ones)', () => {
        const values = [6, 7, 8, 9] as const;
        for (let n = 0; n < 4096; n++) {
            const cast = Array.from({ length: 6 }, (_, i) => values[(n >> (2 * i)) & 3]) as unknown as Cast;
            const reading = readCast(cast);
            if (reading.rule !== 'four' && reading.rule !== 'five') continue;
            for (const passage of reading.passages) {
                if (passage.kind !== 'line') continue;
                expect(reading.changing).not.toContain(passage.position);
                expect(passage.hexagram).toBe(reading.relating);
            }
        }
    });
});
