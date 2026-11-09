import { describe, expect, it } from 'vitest';
import { createEntry, JOURNAL_FORMAT, MAX_NOTE, MAX_QUESTION, mergeEntries, parseJournal, serializeJournal, type JournalEntry } from '../src/core/journal';
import type { Cast } from '../src/core/types';

const CAST: Cast = [9, 7, 8, 6, 7, 8];
const entry = (id: string, date: string, extra: Partial<JournalEntry> = {}): JournalEntry => ({ id, date, question: '', cast: CAST, note: '', ...extra });

describe('a journal entry', () => {
    it('keeps the values of the cast, the trimmed question and the time', () => {
        const made = createEntry(CAST, '  Will it rain?  ', 'a1', new Date('2026-11-09T12:00:00Z'));
        expect(made).toEqual({ id: 'a1', date: '2026-11-09T12:00:00.000Z', question: 'Will it rain?', cast: CAST, note: '' });
        expect(made.cast).not.toBe(CAST); // a copy: the cast on the screen may change
    });

    it('cuts a question that is too long', () => {
        expect(createEntry(CAST, 'x'.repeat(1000), 'a', new Date()).question).toHaveLength(MAX_QUESTION);
    });
});

describe('the file of a journal', () => {
    it('comes back as it went', () => {
        const entries = [entry('b', '2026-11-09T10:00:00.000Z', { question: 'Q?', note: 'N' }), entry('a', '2026-11-08T10:00:00.000Z')];
        const parsed = parseJournal(serializeJournal(entries))!;
        expect(parsed.skipped).toBe(0);
        expect(parsed.entries).toEqual(entries);
        expect(JSON.parse(serializeJournal(entries)).format).toBe(JOURNAL_FORMAT);
    });

    it('is read newest first whatever the order in the file', () => {
        const text = serializeJournal([entry('old', '2026-01-01T00:00:00.000Z'), entry('new', '2026-12-01T00:00:00.000Z')]);
        expect(parseJournal(text)!.entries.map((e) => e.id)).toEqual(['new', 'old']);
    });

    it('is not a journal when it is not JSON or has no list', () => {
        expect(parseJournal('not json')).toBeNull();
        expect(parseJournal('{"hello": 1}')).toBeNull();
        expect(parseJournal('"text"')).toBeNull();
    });

    it('leaves out what is not a reading and counts it: a wrong cast, a missing id, a bad date, a repeated id', () => {
        const text = JSON.stringify({
            format: JOURNAL_FORMAT,
            version: 1,
            entries: [
                entry('ok', '2026-11-09T10:00:00.000Z'),
                { ...entry('bad-cast', '2026-11-09T10:00:00.000Z'), cast: [1, 2, 3, 4, 5, 6] },
                { ...entry('', '2026-11-09T10:00:00.000Z') },
                { ...entry('bad-date', 'yesterday') },
                entry('ok', '2026-11-09T11:00:00.000Z'),
                'junk',
                null,
            ],
        });
        const parsed = parseJournal(text)!;
        expect(parsed.entries.map((e) => e.id)).toEqual(['ok']);
        expect(parsed.skipped).toBe(6);
    });

    it('cuts a note that is too long and drops fields it does not know', () => {
        const text = JSON.stringify([{ ...entry('n', '2026-11-09T10:00:00.000Z'), note: 'z'.repeat(MAX_NOTE + 50), secret: 'x' }]);
        const parsed = parseJournal(text)!;
        expect(parsed.entries[0]!.note).toHaveLength(MAX_NOTE);
        expect(Object.keys(parsed.entries[0]!).sort()).toEqual(['cast', 'date', 'id', 'note', 'question']);
    });
});

describe('putting a file into the journal', () => {
    it('adds the new readings, keeps the ones already there as they are, and sorts', () => {
        const mine = [entry('a', '2026-11-01T00:00:00.000Z', { note: 'my own note' })];
        const theirs = [entry('a', '2026-11-01T00:00:00.000Z', { note: 'other' }), entry('b', '2026-11-05T00:00:00.000Z')];
        const merged = mergeEntries(mine, theirs);
        expect(merged.added).toBe(1);
        expect(merged.entries.map((e) => e.id)).toEqual(['b', 'a']);
        expect(merged.entries.find((e) => e.id === 'a')!.note).toBe('my own note');
    });

    it('adds nothing when everything is there already', () => {
        const same = [entry('a', '2026-11-01T00:00:00.000Z')];
        expect(mergeEntries(same, same)).toEqual({ entries: same, added: 0 });
    });
});
