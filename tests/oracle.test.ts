import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inverseOf, trigramsOf } from '../src/core/hexagram';
import { HEXAGRAMS } from '../src/data/hexagrams';
import type { TrigramKey } from '../src/core/types';
import { parseCsv } from './helpers/csv';

// The CSV is a third-party file kept only on our machines (sources/ is not in git), so this check is skipped on a clean clone.
// It is not text of the product: we only read the facts from it (figure, name, trigrams, pair) to catch a typo in our own table.
// CSV это чужой файл, он лежит только у нас (sources/ не в git), поэтому на чистой копии проверка пропускается.
// Это не текст продукта: из файла читаем только факты (фигура, имя, триграммы, пара), чтобы поймать опечатку в нашей таблице.
const FILE = new URL('../sources/wilhelm-oracle.csv', import.meta.url);

const TRIGRAM_OF: Record<string, TrigramKey> = {
    chien: 'qian',
    kun: 'kun',
    chen: 'zhen',
    kan: 'kan',
    ken: 'gen',
    sun: 'xun',
    li: 'li',
    tui: 'dui',
};

const trigramKey = (json: string): TrigramKey => {
    const name = (JSON.parse(json) as { chinese: string }).chinese
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z]/g, '');
    const key = TRIGRAM_OF[name];
    if (!key) throw new Error(`Unknown trigram name: ${name}`);
    return key;
};

describe.skipIf(!existsSync(FILE))('our table against the oracle CSV', () => {
    const rows = parseCsv(readFileSync(FILE, 'utf8'))
        .filter((row) => row.length >= 9)
        .sort((a, b) => Number(a[0]) - Number(b[0]));

    it('has 64 rows to compare with', () => {
        expect(rows).toHaveLength(64);
    });

    it('agrees on the glyph, the figure, the name, the pinyin and the pair', () => {
        for (const [index, row] of rows.entries()) {
            const ours = HEXAGRAMS[index]!;
            const label = `hexagram ${ours.number}`;
            expect(Number(row[0]), label).toBe(ours.number);
            // Unicode keeps the 64 symbols in the King Wen order, from U+4DC0.
            expect(row[1], label).toBe(String.fromCodePoint(0x4dc0 + index));
            // The binary column is a number: the leading zeros are gone, and the top line is the first digit.
            expect([...row[2]!.padStart(6, '0')].reverse().join(''), label).toBe(ours.lines);
            expect(row[5], label).toBe(ours.pinyin);
            expect(row[6], label).toBe(ours.hanzi);
            // The fourth column is the number of the hexagram with all the lines the other way.
            expect(Number(row[4]), label).toBe(inverseOf(ours.number).number);
        }
    });

    it('agrees on the trigrams, except for the one mistake we know in the CSV', () => {
        const differences: string[] = [];
        for (const [index, row] of rows.entries()) {
            const ours = HEXAGRAMS[index]!;
            const { upper, lower } = trigramsOf(ours.number);
            expect([upper.key, lower.key], `hexagram ${ours.number}`).toEqual([ours.upper, ours.lower]);
            if (trigramKey(row[7]!) !== ours.upper) differences.push(`${ours.number} upper: csv ${trigramKey(row[7]!)}, ours ${ours.upper}`);
            if (trigramKey(row[8]!) !== ours.lower) differences.push(`${ours.number} lower: csv ${trigramKey(row[8]!)}, ours ${ours.lower}`);
        }
        // Hexagram 23 (Splitting Apart) is the mountain over the earth. The CSV gives fire below, but its own binary column
        // (one solid line on top, five broken below) says earth: the CSV is wrong there, not our table.
        // Гексаграмма 23 это гора над землёй. В CSV внизу записан огонь, но его же двоичная колонка (одна сплошная сверху, пять
        // прерывистых ниже) говорит о земле: ошибка в CSV, не в нашей таблице.
        expect(differences).toEqual(['23 lower: csv li, ours kun']);
    });
});
