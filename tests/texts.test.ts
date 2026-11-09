import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import type { TextPack } from '../src/core/texts';

/**
 * The built packs of the books: what the application reads. The same checks for every language.
 * Готовые пакеты книг: то, что читает приложение. Одни и те же проверки для каждого языка.
 */
interface Expectation {
    lang: 'ru' | 'en';
    /** Hexagram and line where the source itself has no words, as `number.line`. / Где в самом источнике нет слов. */
    gaps: string[];
    /** Whether the book has the image (the great symbolism). / Есть ли в книге образ. */
    image: boolean;
}

const PACKS: Expectation[] = [
    { lang: 'ru', gaps: ['9.2'], image: false },
    { lang: 'en', gaps: [], image: true },
];

for (const { lang, gaps, image } of PACKS) {
    const file = new URL(`../src/data/texts/${lang}.json`, import.meta.url);

    describe(`the ${lang} pack`, () => {
        let pack: TextPack;
        let words: string[];

        beforeAll(() => {
            pack = JSON.parse(readFileSync(file, 'utf8')) as TextPack;
            words = pack.hexagrams
                .flatMap((h) => [
                    h.judgment?.text,
                    h.judgment?.comment,
                    h.image?.text,
                    h.useAll?.text,
                    h.useAll?.comment,
                    ...h.lines.flatMap((l) => [l.text, l.comment, l.symbol, l.label]),
                ])
                .filter((s): s is string => typeof s === 'string' && s !== '');
        });

        it('is the right language and names its source', () => {
            expect(pack.lang).toBe(lang);
            expect(pack.source.author).not.toBe('');
            expect(pack.source.title).not.toBe('');
        });

        it('has 64 hexagrams in order, each with a name, a verdict and six lines', () => {
            expect(pack.hexagrams.map((h) => h.number)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
            for (const h of pack.hexagrams) {
                expect(h.name, `name of ${h.number}`).not.toBe('');
                expect(h.translit, `translit of ${h.number}`).not.toBe('');
                expect(h.judgment?.text, `verdict of ${h.number}`).toBeTruthy();
                expect(h.lines, `lines of ${h.number}`).toHaveLength(6);
            }
        });

        it('has the words of every line, except the gaps we know', () => {
            const empty: string[] = [];
            for (const h of pack.hexagrams) h.lines.forEach((line, k) => line.text === '' && empty.push(`${h.number}.${k + 1}`));
            expect(empty).toEqual(gaps);
        });

        it(`${image ? 'has' : 'has no'} the image of the hexagram`, () => {
            expect(pack.hexagrams.every((h) => Boolean(h.image?.text))).toBe(image);
            if (!image) expect(pack.hexagrams.some((h) => h.image)).toBe(false);
        });

        it('has the closing remark for the first two hexagrams', () => {
            expect(pack.hexagrams.filter((h) => h.useAll).map((h) => h.number)).toEqual([1, 2]);
        });

        it('is clean: no markup, no drawings, no wrapper of the site, no double spaces, no loose quotes', () => {
            for (const s of words) {
                expect(s, s.slice(0, 60)).not.toMatch(/<[a-z/]|&[a-z#]+;|___|Royallib|sacred-texts|\s{2}| - |^\s|\s$/i);
            }
            // straight double quotes were turned into « » for Russian; English keeps them, and they must pair up
            if (lang === 'ru') for (const s of words) expect(s.includes('"'), s.slice(0, 60)).toBe(false);
        });
    });
}
