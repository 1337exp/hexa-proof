// Reads the Russian book of Yu. K. Shchutsky from the Royallib HTML: no markup, only markers in the text.
// Читает русскую книгу Ю. К. Щуцкого из HTML Royallib: разметки нет, есть только маркеры в тексте.
//
// What the file looks like (found out by hand, see docs/texts.md):
//   * windows-1251, <br> between lines, one <h2>; a Royallib wrapper at the start and at the end;
//   * a header per hexagram: `------No 8. "Би". Приближение`, then six rows of `_________` (yang) or `___ ___` (yin), top row first;
//   * then the explanation of the whole figure, which ends with the classic text of the verdict (after "…сказано:" or similar);
//   * then six paragraphs, each after a line holding only its number 1…6; each ends with the classic text of the line,
//     which begins with a fixed phrase ("В начале сильная черта.", "Наверху слабая черта.", "Сильная черта на пятом месте.");
//   * the hexagram 1 has a "Резюме" at the end: the verdict for the case when all the lines move;
//   * the hexagrams 29 and 30 stand in the file in the opposite order: always go by the number in the header.

const NAMED = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeWin1251(buffer) {
    return new TextDecoder('windows-1251').decode(buffer);
}

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
        if (body[0] === '#') {
            const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
            return String.fromCodePoint(code);
        }
        return NAMED[body.toLowerCase()] ?? whole;
    });
}

/** HTML to plain text: <br> becomes a line break, tags go, entities are decoded. */
export function htmlToText(html) {
    const start = html.search(/<body/i);
    let text = start >= 0 ? html.slice(start) : html;
    text = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d)>/gi, '\n').replace(/<[^>]+>/g, '');
    return decodeEntities(text).replace(/\xa0/g, ' ').replace(/\r/g, '');
}

/**
 * One paragraph in order: spaces collapsed, " - " as a dash, straight double quotes as « » (only when they pair up).
 * Один абзац: пробелы схлопнуты, « - » как тире, прямые двойные кавычки как « » (только когда они парные).
 */
export function tidy(text) {
    let out = text.replace(/\s+/g, ' ').trim().replace(/ - /g, ' — ');
    const quotes = out.match(/"/g)?.length ?? 0;
    if (quotes > 0 && quotes % 2 === 0) {
        let open = true;
        out = out.replace(/"/g, () => ((open = !open) ? '»' : '«'));
    }
    return out;
}

const LINE_MARKER = [
    /В начале\s+(?:сильная|слабая)\s+черта\./gi,
    /(?:сильная|слабая)\s+черта\s+на\s+втором\s+месте\./gi,
    /(?:сильная|слабая)\s+черта\s+на\s+третьем\s+месте\./gi,
    /(?:сильная|слабая)\s+черта\s+на\s+четв[её]ртом\s+месте\./gi,
    /(?:сильная|слабая)\s+черта\s+на\s+пятом\s+месте\./gi,
    /Наверху\s+(?:сильная|слабая)\s+черта\./gi,
];

/** Last match of a global regexp. / Последнее совпадение глобальной регулярки. */
function lastMatch(re, text) {
    let found = null;
    for (const match of text.matchAll(re)) found = match;
    return found;
}

/**
 * The sentence that leads into the classic words ("Поэтому в тексте сказано:", "…облечены в следующие образы:") ends with a colon.
 * Cuts it off the end of `before` and returns what is left and the cut sentence.
 * Предложение, которое вводит канонические слова, кончается двоеточием. Отрезает его от конца `before`.
 */
export function cutLead(before) {
    const text = before.trim();
    if (!text.endsWith(':')) return { comment: text, lead: '' };
    const head = text.slice(0, -1);
    const start = lastMatch(/[.!?»)]\s/g, head);
    const cut = start ? start.index + start[0].length : 0;
    return { comment: head.slice(0, cut).trim(), lead: head.slice(cut).trim() };
}

/**
 * A short lead-in ("Поэтому в тексте сказано:") only says "here comes the text", so it goes. A long one carries thought
 * (a remark on a damaged place, on the choice of the commentator), so it stays in the commentary, with a full stop for the colon.
 * Короткое вводное («Поэтому в тексте сказано:») лишь говорит «вот текст», его убираем. Длинное несёт мысль, оно остаётся в толковании.
 */
export function keepLong(comment, lead) {
    if (lead.length <= 90) return comment;
    return `${comment ? `${comment} ` : ''}${lead}.`;
}

/**
 * Splits a paragraph into the commentary and the classic words that end it: they begin after the last colon,
 * or at `from` when the rule is not enough (scripts/overrides.ru.json). The lead-in sentence is cut off: the interface has its own caption.
 * Делит абзац на толкование и канонические слова в его конце: они идут после последнего двоеточия или с `from`.
 */
export function splitVerdict(paragraph, from) {
    let at;
    if (from) {
        at = paragraph.indexOf(from);
        if (at < 0) throw new Error(`The anchor is not in the text: ${from}`);
        return { ...cutLead(paragraph.slice(0, at)), text: paragraph.slice(at).trim() };
    }
    at = paragraph.lastIndexOf(': ');
    if (at < 0) return null;
    return { ...cutLead(paragraph.slice(0, at + 1)), text: paragraph.slice(at + 2).trim() };
}

const HEADER = /-{20,}\s*No\s*(\d+)\s*\.?\s*"?([^"\n]*?)"?\s*\.\s*([^_\n]+?)\s+(?=_)/g;
const ROW = /\s*(_{9}|_{3}\s_{3})/y;

/**
 * Parses the whole book.
 * @param {string} html the file already decoded from windows-1251
 * @param {{ judgmentFrom?: Record<string, string> }} [overrides] where the verdict starts, for the hexagrams the rule does not find
 */
export function parseShchutsky(html, overrides = {}) {
    const full = htmlToText(html);
    const begin = full.search(/\n\s*Введение\s*\n/);
    const end = full.lastIndexOf('Спасибо, что скачали книгу');
    if (begin < 0 || end < 0) throw new Error('The wrapper of the file is not as expected');
    const text = full.slice(begin, end);

    const headers = [...text.matchAll(HEADER)];
    if (headers.length !== 64) throw new Error(`Expected 64 headers, found ${headers.length}`);

    // The introduction: from "Введение" to the first header, without the page rules and the ASCII drawings.
    const aboutRaw = text.slice(0, headers[0].index).replace(/-{10,}[^\n]*?(?=\n|$)/g, '\n');
    const about = aboutRaw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/_{3}/.test(line) && !/^ПЕРВАЯ ЧАСТЬ\b/.test(line))
        .map(tidy);

    const warnings = [];
    const leads = []; // the cut-off lead-in sentences, for a look with the eyes / отрезанные вводные предложения, чтобы посмотреть глазами
    const hexagrams = headers.map((header, index) => {
        const number = Number(header[1]);
        const label = `hexagram ${number}`;
        const bodyStart = header.index + header[0].length;
        let chunk = text.slice(bodyStart, headers[index + 1]?.index ?? text.length);

        // six rows of the figure, the top row first (the drawing of the hexagram 25 has seven: take all the rows off the text, use six)
        let at = 0;
        const rows = [];
        for (;;) {
            ROW.lastIndex = at;
            const row = ROW.exec(chunk);
            if (!row) break;
            rows.push(row[1].startsWith('_________') ? '1' : '0');
            at = ROW.lastIndex;
        }
        if (rows.length < 6) throw new Error(`${label}: the figure has only ${rows.length} rows`);
        if (rows.length > 6) warnings.push(`${label}: the drawing has ${rows.length} rows, the first six are used`);
        const figure = rows.slice(0, 6).reverse().join(''); // bottom to top, like the table of facts
        chunk = chunk.slice(at);
        chunk = chunk.replace(/-{10,}[\s\S]*$/, ''); // the rule and the title of the next part

        const markers = [...chunk.matchAll(/\n[ \t]*([1-6])[ \t]*\n/g)];
        if (markers.map((m) => m[1]).join('') !== '123456') throw new Error(`${label}: the six position markers are not as expected`);
        const parts = [chunk.slice(0, markers[0].index), ...markers.map((m, k) => chunk.slice(m.index + m[0].length, markers[k + 1]?.index ?? chunk.length))];

        // the summary that closes the last paragraph (hexagram 1)
        let useAll;
        const summaryAt = parts[6].search(/\sРезюме\s/);
        if (summaryAt >= 0) {
            const split = splitVerdict(tidy(parts[6].slice(summaryAt + 8)));
            if (!split) warnings.push(`${label}: the summary has no lead-in`);
            else {
                const comment = keepLong(split.comment, split.lead);
                useAll = { text: split.text, ...(comment ? { comment } : {}) };
                leads.push({ where: `${label}, summary`, lead: split.lead });
            }
            parts[6] = parts[6].slice(0, summaryAt);
        }

        const lines = [1, 2, 3, 4, 5, 6].map((position) => {
            const paragraph = tidy(parts[position]);
            const marker = lastMatch(LINE_MARKER[position - 1], paragraph);
            if (!marker) throw new Error(`${label}, line ${position}: the marker of the classic text is missing`);
            const cut = cutLead(paragraph.slice(0, marker.index));
            if (cut.lead) leads.push({ where: `${label}, line ${position}`, lead: cut.lead });
            const comment = keepLong(cut.comment, cut.lead);
            const line = { label: marker[0].replace(/\.$/, ''), text: paragraph.slice(marker.index + marker[0].length).trim() };
            // Hexagram 9, line 2: the file itself gives only "Сильная черта на втором месте." and no words after it.
            if (!line.text) warnings.push(`${label}, line ${position}: the classic text is empty in the source`);
            if (comment) line.comment = comment;
            return line;
        });

        // The hexagram 2 has no "Резюме": its closing remark sits at the end of the sixth line. The anchor says where the remark begins.
        const remarkFrom = overrides.useAllFrom?.[String(number)];
        if (remarkFrom && !useAll) {
            const last = lines[5];
            const at = last.text.indexOf(remarkFrom);
            if (at < 0) throw new Error(`${label}: the anchor of the remark is not in the sixth line: ${remarkFrom}`);
            const split = splitVerdict(last.text.slice(at));
            if (!split) throw new Error(`${label}: the remark has no lead-in`);
            last.text = last.text.slice(0, at).trim();
            const comment = keepLong(split.comment, split.lead);
            useAll = { text: split.text, ...(comment ? { comment } : {}) };
        }

        const intro = tidy(parts[0]);
        const split = splitVerdict(intro, overrides.judgmentFrom?.[String(number)]);
        let judgment;
        if (!split) warnings.push(`${label}: the verdict is not found (add it to overrides.judgmentFrom)`);
        else {
            const comment = keepLong(split.comment, split.lead);
            judgment = { text: split.text, ...(comment ? { comment } : {}) };
            leads.push({ where: `${label}, verdict`, lead: split.lead });
            if (split.text.length > 600) warnings.push(`${label}: the verdict is ${split.text.length} characters long, check where it starts`);
        }

        return {
            number,
            figure,
            translit: tidy(header[2]),
            name: tidy(header[3]).replace(/\.$/, ''),
            ...(judgment ? { judgment } : {}),
            lines,
            ...(useAll ? { useAll } : {}),
        };
    });

    hexagrams.sort((a, b) => a.number - b.number);
    return { about, hexagrams, warnings, leads };
}
