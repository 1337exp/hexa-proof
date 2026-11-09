import { isCast } from './cast';
import type { Cast } from './types';

/**
 * One reading kept in the journal: what was thrown (the six values, never a seed), when, the question and the person's own note.
 * Одно гадание в журнале: что выпало (шесть значений, не зерно), когда, вопрос и собственная заметка человека.
 */
export interface JournalEntry {
    id: string;
    /** ISO time of the cast. / Время гадания в ISO. */
    date: string;
    question: string;
    cast: Cast;
    note: string;
}

export const JOURNAL_FORMAT = 'hexa-proof-journal';
export const JOURNAL_VERSION = 1;
export const MAX_QUESTION = 300;
export const MAX_NOTE = 4000;

export function createEntry(cast: Cast, question: string, id: string, now: Date = new Date()): JournalEntry {
    return { id, date: now.toISOString(), question: question.trim().slice(0, MAX_QUESTION), cast: [...cast] as unknown as Cast, note: '' };
}

/** The file or the stored text: a wrapper with the format name and the version, so a later change can read an old one. / Файл или хранимый текст. */
export function serializeJournal(entries: readonly JournalEntry[]): string {
    return JSON.stringify({ format: JOURNAL_FORMAT, version: JOURNAL_VERSION, entries }, null, 2);
}

/** Newest first. / Сначала новые. */
const byDate = (a: JournalEntry, b: JournalEntry) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

function toEntry(value: unknown): JournalEntry | null {
    if (typeof value !== 'object' || value === null) return null;
    const item = value as Record<string, unknown>;
    if (typeof item.id !== 'string' || item.id === '' || item.id.length > 100) return null;
    if (typeof item.date !== 'string' || Number.isNaN(Date.parse(item.date))) return null;
    if (!isCast(item.cast)) return null;
    return {
        id: item.id,
        date: new Date(item.date).toISOString(),
        question: typeof item.question === 'string' ? item.question.slice(0, MAX_QUESTION) : '',
        cast: [...item.cast] as unknown as Cast,
        note: typeof item.note === 'string' ? item.note.slice(0, MAX_NOTE) : '',
    };
}

export interface ParsedJournal {
    entries: JournalEntry[];
    /** How many records were not understood and left out. / Сколько записей не поняли и пропустили. */
    skipped: number;
}

/**
 * Reads a journal: what is not a reading is left out and counted, not fatal. Null when the text is not a journal at all.
 * Читает журнал: что не гадание, пропускается и считается, но не ломает всё. Null, если текст вообще не журнал.
 */
export function parseJournal(text: string): ParsedJournal | null {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return null;
    }
    const list = Array.isArray(data) ? data : typeof data === 'object' && data !== null && (data as { format?: unknown }).format === JOURNAL_FORMAT ? (data as { entries?: unknown }).entries : null;
    if (!Array.isArray(list)) return null;
    const seen = new Set<string>();
    const entries: JournalEntry[] = [];
    let skipped = 0;
    for (const item of list) {
        const entry = toEntry(item);
        if (!entry || seen.has(entry.id)) {
            skipped++;
            continue;
        }
        seen.add(entry.id);
        entries.push(entry);
    }
    return { entries: entries.sort(byDate), skipped };
}

/**
 * Puts the entries of a file into the journal: a reading that is already there (the same id) is kept as it is, the new ones are added.
 * Кладёт записи из файла в журнал: уже имеющееся гадание (тот же id) остаётся как есть, новые добавляются.
 */
export function mergeEntries(existing: readonly JournalEntry[], incoming: readonly JournalEntry[]): { entries: JournalEntry[]; added: number } {
    const known = new Set(existing.map((entry) => entry.id));
    const fresh = incoming.filter((entry) => !known.has(entry.id));
    return { entries: [...existing, ...fresh].sort(byDate), added: fresh.length };
}
