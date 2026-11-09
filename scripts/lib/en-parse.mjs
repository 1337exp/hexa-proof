// Reads James Legge's "The Yî King" (SBE vol. 16, 1882; public domain) from the page texts we copied out of sacred-texts.com
// by hand in the browser: sources/legge/text-NN.txt (the Text: verdict and lines, `##### N` before each hexagram) and
// sources/legge/image.txt (the Great Symbolism of Appendix II, the image, one paragraph per hexagram, by Roman number).
// Читает «Ицзин» Легга из текстов страниц, которые мы переписали руками из браузера (sacred-texts.com).
//
// What the text looks like:
//   * a heading `XIII. THE THUNG ZĂN HEXAGRAM`, then the verdict, then six paragraphs of lines ("1. The first NINE, undivided, shows…");
//   * the hexagrams 1 and 2 have a seventh paragraph (the use of the number nine or six) and, in the first, two captions to drop;
//   * the page numbers `p. 58` fall into the middle of sentences: a paragraph that goes on after one is joined to the one before;
//   * the transcription has typos (a missing "3.", "S." for "5.", "he good fortune"): lines are taken by position, typos by a table.

/** Typos of the transcription, exact replacements. / Опечатки переписи, точные замены. */
export const TYPOS = [
    ['(the manifestation) of) his virtue', '(the manifestation of) his virtue'],
    ['in accordance with this), distinguishes', 'in accordance with this, distinguishes'],
    ['in 0 accordance', 'in accordance'],
    ['there will he good fortune', 'there will be good fortune'],
    ['lets go. the little boy', 'lets go the little boy'],
    ['the mind is. penetrating', 'the mind is penetrating'],
    ['(of being accused and. apprehended)', '(of being accused and apprehended)'],
    ['like. a sheep', 'like a sheep'],
    ['in his natural. course', 'in his natural course'],
    ['(in his natural. course)', '(in his natural course)'],
    ['shows. its subject', 'shows its subject'],
    ['by his own. dignified gravity', 'by his own dignified gravity'],
    ['on the day. of the (winter) solstice', 'on the day of the (winter) solstice'],
    ['the people, and. stimulates them', 'the people, and stimulates them'],
    ['or n a high', 'or in a high'],
    ['no error is committed . He', 'no error is committed. He'],
    ['deprived of his cars', 'deprived of his ears'],
    ['Hsiâo Khû The superior man', 'Hsiâo Khû. The superior man'],
    ['Tâ Yû The superior man', 'Tâ Yû. The superior man'],
];

/** The Roman numeral as a number. / Римская цифра как число. */
export function romanToInt(roman) {
    const value = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    let total = 0;
    for (let i = 0; i < roman.length; i++) {
        const here = value[roman[i]];
        const next = value[roman[i + 1]] ?? 0;
        total += here < next ? -here : here;
    }
    return total;
}

/** Applies the table of typos and tidies spaces. / Применяет таблицу опечаток и убирает лишние пробелы. */
export function tidy(text) {
    let out = text;
    for (const [from, to] of TYPOS) out = out.split(from).join(to);
    return out.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
}

const LINE_NUMBER = /^(?:[1-7]|S|I)\s?\.\s*(?:\.\s*)?/;
const ORDINAL = [/first|lowest/i, /second/i, /third/i, /fourth/i, /fifth/i, /sixth|topmost/i];

/** The paragraphs of one hexagram, the page numbers taken out and the broken ones joined. */
export function paragraphsOf(block) {
    const raw = block.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const out = [];
    let afterPage = false;
    for (const paragraph of raw) {
        if (/^p\. \d+$/.test(paragraph)) {
            afterPage = true;
            continue;
        }
        const cleaned = paragraph.replace(/^\[paragraph continues\]\s*/, '');
        const continues = afterPage && out.length > 0 && !LINE_NUMBER.test(cleaned) && !/^\s*(?:[IVXLC]+\.\s+THE\b)/.test(cleaned);
        if (continues || cleaned !== paragraph) out[out.length - 1] = `${out[out.length - 1]} ${cleaned}`;
        else out.push(cleaned);
        afterPage = false;
    }
    return out;
}

/** Title-case of a word of the heading, keeping the diacritics. / Заглавная первая буква слова заголовка. */
const titleCase = (word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();

/**
 * Parses the Text: verdict and lines of every hexagram.
 * @param {string} text the page texts, with `##### N` before each hexagram
 */
export function parseText(text) {
    const warnings = [];
    const chunks = text.split(/^##### (\d+)\s*$/m);
    const found = new Map();

    for (let i = 1; i < chunks.length; i += 2) {
        const number = Number(chunks[i]);
        const label = `hexagram ${number}`;
        let paragraphs = paragraphsOf(chunks[i + 1]);
        paragraphs[0] = paragraphs[0].replace(/^TEXT SECTION [IVX]+\s+/, '');

        const heading = paragraphs[0]?.match(/^([IVXLC]+)\.\s+THE\s+(.+?)\s+(?:HEXAGRAM)?$/);
        if (!heading || romanToInt(heading[1]) !== number) throw new Error(`${label}: the heading is not as expected: ${paragraphs[0]}`);
        const translit = heading[2].replace(/\s+HEXAGRAM$/, '').split(/\s+/).map(titleCase).join(' ');
        paragraphs = paragraphs.slice(1).filter((p) => !/^Explanation of the /.test(p));

        const extra = number === 1 || number === 2 ? 1 : 0; // the paragraph on the use of the number nine / six
        if (paragraphs.length < 7 + extra) throw new Error(`${label}: only ${paragraphs.length} paragraphs`);
        const lineParagraphs = paragraphs.slice(paragraphs.length - 6 - extra, paragraphs.length - extra);
        const judgmentParagraphs = paragraphs.slice(0, paragraphs.length - 6 - extra);
        if (judgmentParagraphs.length !== 1) warnings.push(`${label}: ${judgmentParagraphs.length} paragraphs of verdict, expected one`);

        const lines = lineParagraphs.map((paragraph, k) => {
            const cleaned = tidy(paragraph.replace(LINE_NUMBER, ''));
            // the paragraph must speak of the line it stands for: a check that the positions did not slip
            if (!ORDINAL[k].test(cleaned.slice(0, 60))) warnings.push(`${label}, line ${k + 1}: the paragraph does not name its place: ${cleaned.slice(0, 50)}`);
            return { text: cleaned };
        });

        const hexagram = { number, translit, judgment: { text: tidy(judgmentParagraphs.join(' ')) }, lines };
        if (extra) hexagram.useAll = { text: tidy(paragraphs[paragraphs.length - 1].replace(LINE_NUMBER, '')) };
        found.set(number, hexagram);
    }

    return { hexagrams: found, warnings };
}

/** Parses the Great Symbolism (the image): number → text. */
export function parseImages(text) {
    const images = new Map();
    for (const paragraph of text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
        const match = paragraph.match(/^([IVXLC]+)\.\s+(.+)$/s);
        if (!match) throw new Error(`An image paragraph without a number: ${paragraph.slice(0, 50)}`);
        images.set(romanToInt(match[1]), tidy(match[2]));
    }
    return images;
}
