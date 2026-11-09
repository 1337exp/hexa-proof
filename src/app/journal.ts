import { toast } from '@1337exp/taoui';
import { downloadText, MAX_FILE_BYTES, readTextFile } from '@1337exp/taoux/file';
import { uuid } from '@1337exp/taoux/ids';
import { createSavedStorage } from '@1337exp/taoux/storage';
import { ref } from 'vue';
import { createEntry, MAX_NOTE, mergeEntries, parseJournal, serializeJournal, type JournalEntry } from '../core/journal';
import type { Cast } from '../core/types';
import { t } from './i18n';

const storage = createSavedStorage('hexa-proof.journal');

/** The readings kept on this device, newest first. / Гадания, сохранённые на этом устройстве, сначала новые. */
export const entries = ref<JournalEntry[]>([]);

function read(text: string | null): void {
    if (text === null) {
        entries.value = [];
        return;
    }
    const parsed = parseJournal(text);
    if (!parsed) {
        // it cannot be read: the copy is set aside, so that the next save does not overwrite what may still be saved by hand
        storage.backupBroken(text);
        entries.value = [];
        return;
    }
    entries.value = parsed.entries;
}

/** Loads the journal and follows the other tabs of the site. / Загружает журнал и следит за другими вкладками. */
export function startJournal(): void {
    read(storage.read());
    storage.subscribe((text) => read(text));
}

/** Writes the journal; if the browser refuses (a full quota, private mode) the person is told. / Пишет журнал; если браузер отказал, человеку говорят. */
function persist(): boolean {
    const result = storage.tryWrite(serializeJournal(entries.value));
    if (!result.ok) toast().danger().message(t(result.reason === 'quota' ? 'journal.quota' : 'journal.saveFailed'));
    return result.ok;
}

export function addEntry(cast: Cast, question: string): JournalEntry | null {
    const entry = createEntry(cast, question, uuid());
    entries.value = [entry, ...entries.value];
    if (persist()) return entry;
    entries.value = entries.value.filter((item) => item.id !== entry.id);
    return null;
}

export function setNote(id: string, note: string): void {
    entries.value = entries.value.map((entry) => (entry.id === id ? { ...entry, note: note.slice(0, MAX_NOTE) } : entry));
    persist();
}

export function removeEntry(id: string): void {
    entries.value = entries.value.filter((entry) => entry.id !== id);
    persist();
}

export function exportJournal(): void {
    const day = new Date().toISOString().slice(0, 10);
    downloadText(`hexa-proof-journal-${day}.json`, serializeJournal(entries.value));
}

/** Puts a file of a journal into this one: what is already here stays as it is. / Кладёт файл журнала в этот: что уже есть, остаётся как есть. */
export async function importJournal(file: File): Promise<void> {
    const read = await readTextFile(file, MAX_FILE_BYTES);
    if (!read.ok) {
        toast().danger().message(t(read.error === 'tooLarge' ? 'journal.importTooBig' : 'journal.importBad'));
        return;
    }
    const parsed = parseJournal(read.text);
    if (!parsed) {
        toast().danger().message(t('journal.importBad'));
        return;
    }
    const merged = mergeEntries(entries.value, parsed.entries);
    const before = entries.value;
    entries.value = merged.entries;
    if (!persist()) {
        entries.value = before;
        return;
    }
    const message = t('journal.importDone', [merged.added]);
    toast().success().message(parsed.skipped ? `${message} ${t('journal.importSkipped', [parsed.skipped])}` : message);
}
