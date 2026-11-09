// Builds src/data/texts/en.json from the page texts of James Legge's "The Yî King" (1882, public domain) in sources/legge/.
// Собирает src/data/texts/en.json из текстов страниц «Ицзин» Джеймса Легга (1882, общественное достояние) в sources/legge/.
//
//   node scripts/build-en.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseImages, parseText } from './lib/en-parse.mjs';
import { NAMES_EN } from './lib/names.en.mjs';

const root = new URL('../', import.meta.url);
const dir = new URL('sources/legge/', root);
const target = new URL('src/data/texts/en.json', root);

if (!existsSync(dir)) {
    console.error('sources/legge/ is missing.');
    process.exit(1);
}

const files = readdirSync(dir).filter((name) => /^text-\d+\.txt$/.test(name)).sort();
const { hexagrams, warnings } = parseText(files.map((name) => readFileSync(new URL(name, dir), 'utf8')).join('\n'));
const images = parseImages(readFileSync(new URL('image.txt', dir), 'utf8'));

for (const warning of warnings) console.warn(`warning: ${warning}`);

const list = [];
for (let number = 1; number <= 64; number++) {
    const hexagram = hexagrams.get(number);
    if (!hexagram) throw new Error(`Hexagram ${number} is missing in the text files`);
    const image = images.get(number);
    if (!image) throw new Error(`The image of hexagram ${number} is missing`);
    const { translit, ...rest } = hexagram;
    list.push({ number, translit, name: NAMES_EN[number - 1], judgment: rest.judgment, image: { text: image }, lines: rest.lines, ...(rest.useAll ? { useAll: rest.useAll } : {}) });
}

const pack = {
    lang: 'en',
    source: {
        author: 'James Legge',
        title: 'The Yî King (The Sacred Books of the East, vol. 16)',
        note: 'Translated in 1882; public domain. The text is typed from sacred-texts.com (Internet Sacred Text Archive) by hand; the obvious typos of that transcription are corrected.',
    },
    hexagrams: list,
};

mkdirSync(new URL('src/data/texts/', root), { recursive: true });
const rows = pack.hexagrams.map((h) => `    ${JSON.stringify(h)}`).join(',\n');
const head = JSON.stringify({ lang: pack.lang, source: pack.source });
writeFileSync(target, `${head.slice(0, -1)},"hexagrams":[\n${rows}\n]}\n`);
console.log(`en.json: ${list.length} hexagrams, ${list.length * 6} lines, ${warnings.length} warnings.`);
