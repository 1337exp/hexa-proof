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

/**
 * The Russian book names every line ("В начале слабая черта", "Сильная черта на втором месте"). That name must agree with the table of facts:
 * the place with the position of the line and the kind (strong = solid, weak = broken) with the figure itself. The two come from different
 * sources, so a mismatch means a line is in the wrong place or the wrong hexagram.
 * Русская книга называет каждую линию. Название должно совпадать с таблицей фактов: место с позицией, вид (сильная — сплошная, слабая — прерывистая)
 * с самой фигурой. Они из разных источников, поэтому расхождение значит, что линия не на своём месте или не в той гексаграмме.
 */
describe('the labels of the ru lines agree with the table of facts', () => {
    const PLACES = ['в начале', 'на втором', 'на третьем', 'на четвертом', 'на пятом', 'наверху'];
    let problems: string[];

    beforeAll(async () => {
        const { HEXAGRAMS } = await import('../src/data/hexagrams');
        const pack = JSON.parse(readFileSync(new URL('../src/data/texts/ru.json', import.meta.url), 'utf8')) as TextPack;
        problems = [];
        pack.hexagrams.forEach((h, i) => {
            h.lines.forEach((line, k) => {
                const label = (line.label ?? '').toLowerCase().replace(/ё/g, 'е');
                if (!label.includes(PLACES[k]!)) problems.push(`${i + 1}.${k + 1}: place in «${line.label}»`);
                const solid = label.includes('сильн');
                const broken = label.includes('слаб');
                if (solid === broken) problems.push(`${i + 1}.${k + 1}: no kind in «${line.label}»`);
                else if (solid !== (HEXAGRAMS[i]!.lines[k] === '1')) problems.push(`${i + 1}.${k + 1}: «${line.label}» against the figure ${HEXAGRAMS[i]!.lines}`);
            });
        });
    });

    it('has no line with another place or another kind than the figure says', () => {
        expect(problems).toEqual([]);
    });
});

/**
 * Found by an outside review (Grok, 2026-11-09) and checked by hand against the source: what the packs must keep right, and what is wrong in the
 * source itself and is kept as the author has it (not mended silently, a decision for a person).
 * Найдено внешней проверкой и сверено по источнику вручную: что пакеты обязаны держать верно, и что неверно в самом источнике и оставлено как у автора.
 */
describe('what the review of the packs found', () => {
    const ru = JSON.parse(readFileSync(new URL('../src/data/texts/ru.json', import.meta.url), 'utf8')) as TextPack;
    const en = JSON.parse(readFileSync(new URL('../src/data/texts/en.json', import.meta.url), 'utf8')) as TextPack;

    it('every Russian verdict begins at its beginning: with a capital letter, not in the middle of a sentence (9, 19, 51 had a colon inside)', () => {
        const wrong = ru.hexagrams.filter((h) => !/^[А-ЯЁ]/.test(h.judgment?.text ?? '')).map((h) => h.number);
        expect(wrong).toEqual([]);
        expect(ru.hexagrams[8]!.judgment!.text).toMatch(/^Воспитание малым\. Развитие\. Плотные облака/);
        expect(ru.hexagrams[18]!.judgment!.text).toMatch(/^Посещение\. Изначальное развитие/);
        expect(ru.hexagrams[50]!.judgment!.text).toMatch(/^Возбуждение\. Свершение\. Молния приходит/);
    });

    it('no commentary ends on «Книга Перемен» in the middle of a sentence (the cutter took a quote for the end of a sentence)', () => {
        const cut: string[] = [];
        for (const h of ru.hexagrams) {
            const check = (where: string, text?: string) => {
                if (text && /[«"]Книга Перемен[»"]\s*$/.test(text.trim())) cut.push(`${h.number} ${where}`);
            };
            check('judgment', h.judgment?.comment);
            h.lines.forEach((l, k) => check(`line ${k + 1}`, l.comment));
        }
        expect(cut).toEqual([]);
    });

    it('mends the three places that are wrong in the source against the Chinese original, and tells the reader so', () => {
        // 62 不宜上宜下: do not ascend, descend (the source had a sentence too many)
        const j62 = ru.hexagrams[61]!.judgment!;
        expect(j62.text).toContain('Не следует подыматься. Следует опускаться.');
        expect(j62.text).not.toContain('Следует подыматься.');
        expect(j62.note).toMatch(/китайскому тексту/);
        // 40.2 貞吉 and 64.5 貞吉: firmness brings good fortune (the source said «к сожалению» and «к несчастью»)
        const l402 = ru.hexagrams[39]!.lines[1]!;
        expect(l402.text).toMatch(/Стойкость — к счастью\.$/);
        expect(l402.note).toMatch(/китайскому тексту/);
        const l645 = ru.hexagrams[63]!.lines[4]!;
        expect(l645.text).toMatch(/^Стойкость — к счастью\./);
        expect(l645.note).toMatch(/китайскому тексту/);
        // 40.3 貞吝 stays «к сожалению»: it is right there
        expect(ru.hexagrams[39]!.lines[2]!.text).toMatch(/Стойкость — к сожалению\.$/);
        // and nothing else carries a note
        const noted = ru.hexagrams.flatMap((h) => [h.judgment?.note, ...h.lines.map((l) => l.note)]).filter(Boolean);
        expect(noted).toHaveLength(3);
    });

    it('has the circumflex in the name of the 27th hexagram and the repaired places of Legge', () => {
        expect(en.hexagrams[26]!.translit).toBe('Î');
        expect(en.hexagrams[3]!.lines[1]!.text).toContain('(even) the goodness of women');
        expect(en.hexagrams[36]!.lines[0]!.text).toContain('in his household. Occasion for repentance');
        expect(en.hexagrams[46]!.lines[3]!.text).toContain('undivided, shows its subject');
    });
});
