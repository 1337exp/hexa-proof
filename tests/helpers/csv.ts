/**
 * A small CSV reader for the oracle file: a separator, quoted fields, "" inside quotes, line breaks inside quotes.
 * Маленький читатель CSV для файла-оракула: разделитель, поля в кавычках, "" внутри кавычек, переводы строк внутри кавычек.
 */
export function parseCsv(text: string, separator = ';'): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i]!;
        if (quoted) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else quoted = false;
            } else field += char;
        } else if (char === '"') quoted = true;
        else if (char === separator) {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else field += char;
    }
    if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}
