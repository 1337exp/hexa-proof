import { describe, expect, it } from 'vitest';
import { paragraphsOf, parseImages, parseText, romanToInt, tidy } from '../scripts/lib/en-parse.mjs';

describe('the small helpers of the English parser', () => {
    it('reads Roman numerals, the subtractive ones too', () => {
        expect(['I', 'IV', 'IX', 'XIX', 'XL', 'XLIV', 'XC', 'LXIV'].map(romanToInt)).toEqual([1, 4, 9, 19, 40, 44, 90, 64]);
    });

    it('mends the known typos and tidies spaces', () => {
        expect(tidy('there will he good fortune  .')).toBe('there will be good fortune.');
        expect(tidy('deprived of his cars')).toBe('deprived of his ears');
    });

    it('joins a sentence broken by a page number, but not a new line paragraph', () => {
        const paragraphs = paragraphsOf(['A verdict that goes on', 'p. 72', 'and ends here.', '1. The first SIX, divided, one.', 'p. 73', '2. The second SIX, divided, two.', 'p. 74'].join('\n\n'));
        expect(paragraphs).toEqual(['A verdict that goes on and ends here.', '1. The first SIX, divided, one.', '2. The second SIX, divided, two.']);
    });

    it('joins what goes on after a page number even when the sentence before it has ended', () => {
        const paragraphs = paragraphsOf(['6. The topmost SIX, divided, shows its subject (to his help).', 'p. 68', 'If he receive them respectfully, all is well.'].join('\n\n'));
        expect(paragraphs).toEqual(['6. The topmost SIX, divided, shows its subject (to his help). If he receive them respectfully, all is well.']);
    });

    it('joins a "[paragraph continues]" mark to the paragraph before', () => {
        expect(paragraphsOf(['First part.', 'p. 121', '[paragraph continues] Second part.'].join('\n\n'))).toEqual(['First part. Second part.']);
    });
});

const LINES = (words: string[]) => words.map((w, k) => `${k + 1}. The ${w} SIX, divided, shows one thing.`).join('\n\n');
const ORDER = ['first', 'second', 'third', 'fourth', 'fifth', 'topmost'];

describe('the Text', () => {
    it('takes the verdict, the six lines by position and the name from the heading', () => {
        const block = ['##### 15', 'XV. THE KHIEN HEXAGRAM', 'The verdict is here.', LINES(ORDER)].join('\n\n');
        const { hexagrams, warnings } = parseText(block);
        const h = hexagrams.get(15)!;
        expect(warnings).toEqual([]);
        expect(h.translit).toBe('Khien');
        expect(h.judgment.text).toBe('The verdict is here.');
        expect(h.lines).toHaveLength(6);
        expect(h.lines[5]!.text).toBe('The topmost SIX, divided, shows one thing.');
        expect(h.useAll).toBeUndefined();
    });

    it('takes lines by position when a number is missing or mistyped', () => {
        const lines = ORDER.map((w, k) => `${['1', '2', '', 'S', '5', '6'][k]}${k === 2 ? '' : '.'} The ${w} SIX, divided, x.`.trim());
        const { hexagrams, warnings } = parseText(['##### 8', 'VIII. THE PÎ HEXAGRAM', 'Verdict.', lines.join('\n\n')].join('\n\n'));
        expect(warnings).toEqual([]);
        expect(hexagrams.get(8)!.lines.map((l) => l.text.slice(0, 7))).toEqual(ORDER.map((w) => `The ${w}`.slice(0, 7)));
    });

    it('gives the first two hexagrams a seventh paragraph, and drops the captions of the first', () => {
        const block = [
            '##### 1',
            'TEXT SECTION I\nI. THE KHIEN HEXAGRAM',
            'Explanation of the entire figure by king Wăn',
            'The verdict.',
            'Explanation of the separate lines by the duke of Kâu.',
            LINES(ORDER),
            '7. (The lines of this hexagram are all strong) the use of the number NINE.',
        ].join('\n\n');
        const h = parseText(block).hexagrams.get(1)!;
        expect(h.judgment.text).toBe('The verdict.');
        expect(h.lines).toHaveLength(6);
        expect(h.useAll!.text).toBe('(The lines of this hexagram are all strong) the use of the number NINE.');
    });

    it('warns when a paragraph does not name its place, so a slip of positions does not pass silently', () => {
        const wrong = [...ORDER];
        [wrong[1], wrong[2]] = [wrong[2]!, wrong[1]!];
        const { warnings } = parseText(['##### 15', 'XV. THE KHIEN HEXAGRAM', 'Verdict.', LINES(wrong)].join('\n\n'));
        expect(warnings.length).toBeGreaterThan(0);
    });

    it('refuses a heading with a wrong number', () => {
        expect(() => parseText(['##### 16', 'XV. THE KHIEN HEXAGRAM', 'Verdict.', LINES(ORDER)].join('\n\n'))).toThrow(/heading/);
    });
});

describe('the images', () => {
    it('maps the Roman numbers to the numbers of the hexagrams', () => {
        const images = parseImages('I. Heaven, in its motion.\n\nXLIV. Wind and the sky.\n\nLXIV. Water and fire.');
        expect([...images.keys()]).toEqual([1, 44, 64]);
        expect(images.get(44)).toBe('Wind and the sky.');
    });
});
