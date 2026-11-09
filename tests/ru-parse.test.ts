import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cutLead, decodeWin1251, htmlToText, keepLong, parseShchutsky, splitVerdict, tidy, type Overrides } from '../scripts/lib/ru-parse.mjs';
import { HEXAGRAMS } from '../src/data/hexagrams';

describe('the small helpers of the Russian parser', () => {
    it('turns html into text: breaks, tags, entities, non-breaking spaces', () => {
        expect(htmlToText('<body>a<br>b &amp; c&nbsp;d <b>e</b></body>')).toBe('a\nb & c d e');
    });

    it('decodes windows-1251', () => {
        expect(decodeWin1251(Uint8Array.from([0xd9, 0xf3, 0xf6, 0xea, 0xe8, 0xe9]))).toBe('Щуцкий');
    });

    it('tidies a paragraph: spaces, the dash, paired quotes only', () => {
        expect(tidy('  Так\n  -  вот  "Книга Перемен" ')).toBe('Так — вот «Книга Перемен»');
        expect(tidy('Один " символ')).toBe('Один " символ'); // an odd number of quotes is left alone
    });

    it('cuts the lead-in sentence that ends with a colon', () => {
        expect(cutLead('Это так. Поэтому в тексте сказано:')).toEqual({ comment: 'Это так.', lead: 'Поэтому в тексте сказано' });
        expect(cutLead('Только вводное:')).toEqual({ comment: '', lead: 'Только вводное' });
        expect(cutLead('Нет двоеточия.')).toEqual({ comment: 'Нет двоеточия.', lead: '' });
    });

    it('keeps a long lead-in in the commentary and drops a short one', () => {
        expect(keepLong('Толкование.', 'Поэтому в тексте сказано')).toBe('Толкование.');
        const long = 'Здесь, по-видимому, испорчен текст, ибо не хватает самого афоризма, а есть только гадательный вывод из него, который говорит';
        expect(keepLong('Толкование.', long)).toBe(`Толкование. ${long}.`);
        expect(keepLong('', long)).toBe(`${long}.`);
    });

    it('takes the words after the last colon as the verdict', () => {
        expect(splitVerdict('Толкование. Поэтому сказано: Слово один. Слово два.')).toEqual({
            comment: 'Толкование.',
            lead: 'Поэтому сказано',
            text: 'Слово один. Слово два.',
        });
        expect(splitVerdict('Нет двоеточия')).toBeNull();
    });

    it('takes the words from the anchor when the rule is not enough', () => {
        const split = splitVerdict('Толкование. Афоризм такой: Негодные люди. Великое отходит.', 'Негодные');
        expect(split).toEqual({ comment: 'Толкование.', lead: 'Афоризм такой', text: 'Негодные люди. Великое отходит.' });
        expect(() => splitVerdict('Толкование.', 'Нет такого')).toThrow(/anchor/);
    });
});

// The book itself is a third-party file kept only on our machines (sources/ is not in git).
// Сама книга лежит только у нас (sources/ не в git).
const FILE = new URL('../sources/shchutsky.html', import.meta.url);
const OVERRIDES = new URL('../scripts/overrides.ru.json', import.meta.url);

describe.skipIf(!existsSync(FILE))('the book of Shchutsky', () => {
    const overrides = JSON.parse(readFileSync(OVERRIDES, 'utf8')) as Overrides;
    const book = parseShchutsky(decodeWin1251(readFileSync(FILE)), overrides);

    it('has all 64 in order', () => {
        expect(book.hexagrams.map((h) => h.number)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
    });

    // The drawings of the figures in the Royallib file are typed by hand, and six of them are wrong: the names and the texts
    // of these hexagrams are right (checked against the verdicts), the drawing is not. Ours is the table of facts, the drawing only
    // serves as a cross-check, so any NEW difference must fail: either the parser or the table has broken.
    // Рисунки фигур в файле Royallib набраны руками, и шесть из них неверны: названия и тексты этих гексаграмм правильные,
    // рисунок нет. Правда у нас таблица фактов, рисунок лишь сверка, поэтому любое НОВОЕ расхождение должно падать.
    const WRONG_DRAWINGS = [
        { number: 21, drawnAs: 22 },
        { number: 22, drawnAs: 21 },
        { number: 23, drawnAs: 24 },
        { number: 24, drawnAs: 23 },
        { number: 25, drawnAs: 33 },
        { number: 55, drawnAs: 54 },
    ];

    it('has the figure of our table in every drawing, except the six known wrong ones', () => {
        const differences = book.hexagrams
            .filter((h, index) => h.figure !== HEXAGRAMS[index]!.lines)
            .map((h) => ({ number: h.number, drawnAs: HEXAGRAMS.find((x) => x.lines === h.figure)?.number }));
        expect(differences).toEqual(WRONG_DRAWINGS);
    });

    it('has a verdict and six lines for each, and the lines announce themselves', () => {
        const starts = ['В начале', 'на втором месте', 'на третьем месте', 'на четвертом месте', 'на пятом месте', 'Наверху'];
        for (const h of book.hexagrams) {
            expect(h.judgment?.text.length ?? 0, `verdict of ${h.number}`).toBeGreaterThan(10);
            expect(h.judgment!.text.length, `verdict of ${h.number} is not a whole paragraph`).toBeLessThan(600);
            expect(h.lines, `lines of ${h.number}`).toHaveLength(6);
            for (const [k, line] of h.lines.entries()) {
                expect(line.label.replace('ё', 'е'), `line ${k + 1} of ${h.number}`).toContain(starts[k]);
                expect(line.text.length, `text of line ${k + 1} of ${h.number}`).toBeLessThan(400);
            }
        }
    });

    it('has the closing remark for the first two only', () => {
        expect(book.hexagrams.filter((h) => h.useAll).map((h) => h.number)).toEqual([1, 2]);
    });

    it('knows the defects of the file: the words of hexagram 9, line 2 are missing, the drawings of 25 and 26 have seven rows', () => {
        expect(book.warnings).toEqual([
            'hexagram 9, line 2: the classic text is empty in the source',
            'hexagram 25: the drawing has 7 rows, the first six are used',
            'hexagram 26: the drawing has 7 rows, the first six are used',
        ]);
    });

    it('does not take the numbers of the first and the second part for the introduction', () => {
        expect(book.about[0]).toBe('Введение');
        expect(book.about.some((paragraph) => paragraph.includes('___'))).toBe(false);
        expect(book.about.length).toBeGreaterThan(40);
    });
});
