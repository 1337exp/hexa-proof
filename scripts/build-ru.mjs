// Builds src/data/texts/ru.json from sources/shchutsky.html (the Royallib file of Yu. K. Shchutsky).
// Собирает src/data/texts/ru.json из sources/shchutsky.html (файл Royallib с книгой Ю. К. Щуцкого).
//
//   node scripts/build-ru.mjs            build and write
//   node scripts/build-ru.mjs --report   also print every verdict, to read through
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { decodeWin1251, parseShchutsky } from './lib/ru-parse.mjs';

const root = new URL('../', import.meta.url);
const source = new URL('sources/shchutsky.html', root);
const target = new URL('src/data/texts/ru.json', root);

if (!existsSync(source)) {
    console.error('sources/shchutsky.html is missing: put the Royallib file there.');
    process.exit(1);
}

const overrides = JSON.parse(readFileSync(new URL('scripts/overrides.ru.json', root), 'utf8'));
const { about, hexagrams, warnings, leads } = parseShchutsky(decodeWin1251(readFileSync(source)), overrides);

for (const warning of warnings) console.warn(`warning: ${warning}`);

// The book names four lines wrongly: «слабая черта» where the line is solid (the words of the line and Legge agree with the figure, only the label is a
// typo of the source). The labels are mended here and pinned by tests/texts.test.ts. / Книга неверно называет четыре линии: «слабая», где линия сплошная.
for (const [where, label] of Object.entries(overrides.labels ?? {})) {
    const [number, position] = where.split('.').map(Number);
    const line = hexagrams[number - 1]?.lines[position - 1];
    if (!line) console.warn(`warning: overrides.labels ${where}: no such line`);
    else line.label = label;
}

if (process.argv.includes('--leads')) {
    // The sentences cut off before the classic words: the long ones may carry meaning and need a look.
    for (const { where, lead } of leads.filter((item) => item.lead.length > 90)) console.log(`${where} (${lead.length}): ${lead}`);
    console.log(`${leads.length} lead-ins, ${leads.filter((item) => item.lead.length > 90).length} of them longer than 90 characters`);
}

if (process.argv.includes('--report')) {
    for (const h of hexagrams) {
        console.log(`\n${h.number}. ${h.translit} — ${h.name}`);
        console.log(`  verdict: ${h.judgment ? h.judgment.text : '(none)'}`);
    }
}

const pack = {
    lang: 'ru',
    source: {
        author: 'Ю. К. Щуцкий',
        title: 'Китайская классическая «Книга перемен»',
        note: 'Интерпретация построена на основании критической школы комментаторов Ван Би, Вань И, Ито Тогай.',
    },
    about,
    // `figure` is for the cross-check only, the table of facts already has it.
    hexagrams: hexagrams.map(({ figure: _figure, ...rest }) => rest),
};

mkdirSync(new URL('src/data/texts/', root), { recursive: true });
const rows = pack.hexagrams.map((h) => `    ${JSON.stringify(h)}`).join(',\n');
const head = JSON.stringify({ lang: pack.lang, source: pack.source, about: pack.about });
writeFileSync(target, `${head.slice(0, -1)},"hexagrams":[\n${rows}\n]}\n`);

const missing = hexagrams.filter((h) => !h.judgment).length;
console.log(`ru.json: ${hexagrams.length} hexagrams, ${hexagrams.length * 6} lines, ${about.length} paragraphs of the introduction, verdict missing in ${missing}.`);
