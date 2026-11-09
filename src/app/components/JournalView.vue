<script setup lang="ts">
import { confirm, TaoButton, TaoEmpty, TaoTextarea } from '@1337exp/taoui';
import { computed, ref } from 'vue';
import { primaryOf, relatingOf } from '../../core/hexagram';
import { MAX_NOTE } from '../../core/journal';
import { exportJournal, entries, importJournal, removeEntry, setNote } from '../journal';
import { locale, t } from '../i18n';
import { readingMode, setReadingMode } from '../session';
import { textOf } from '../texts';
import HexagramFigure from './HexagramFigure.vue';
import ReadingView from './ReadingView.vue';

const openId = ref<string | null>(null);
const picker = ref<HTMLInputElement | null>(null);

const current = computed(() => entries.value.find((entry) => entry.id === openId.value) ?? null);

const formatDate = (iso: string): string =>
    new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

/** «24 Return → 2 Earth»: what the cast was, in the words of the current book. / Что выпало, словами текущей книги. */
function title(cast: (typeof entries.value)[number]['cast']): string {
    const primary = primaryOf(cast);
    const relating = relatingOf(cast);
    const name = (n: number) => `${n} ${textOf(n)?.name ?? ''}`.trim();
    return relating ? `${name(primary.number)} → ${name(relating.number)}` : name(primary.number);
}

async function remove(id: string): Promise<void> {
    if (!(await confirm().title(t('journal.deleteTitle')).message(t('journal.deleteMessage')).ok(t('journal.delete')).danger())) return;
    removeEntry(id);
    openId.value = null;
}

async function onPick(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // the same file can be picked again
    if (file) await importJournal(file);
}
</script>

<template>
    <section v-if="!current" class="journal" aria-labelledby="journal-title">
        <header class="journal__head">
            <h2 id="journal-title" class="journal__title">{{ t('journal.title') }}</h2>
            <div class="journal__tools">
                <TaoButton variant="ghost" tone="neutral" :disabled="!entries.length" @click="exportJournal()">{{ t('journal.export') }}</TaoButton>
                <TaoButton variant="ghost" tone="neutral" @click="picker?.click()">{{ t('journal.import') }}</TaoButton>
                <input ref="picker" type="file" accept=".json,application/json" class="journal__file" :aria-label="t('journal.import')" @change="onPick" />
            </div>
        </header>

        <TaoEmpty v-if="!entries.length" :title="t('journal.empty')">{{ t('journal.emptyHint') }}</TaoEmpty>
        <ul v-else class="journal__list">
            <li v-for="entry in entries" :key="entry.id">
                <button type="button" class="journal__item" @click="openId = entry.id">
                    <HexagramFigure :values="entry.cast" :width="56" />
                    <span class="journal__body">
                        <span class="journal__name">{{ title(entry.cast) }}</span>
                        <span class="journal__question">{{ entry.question || t('journal.noQuestion') }}</span>
                        <small class="journal__date">{{ formatDate(entry.date) }}</small>
                    </span>
                </button>
            </li>
        </ul>
    </section>

    <section v-else class="journal journal--open">
        <div class="journal__bar">
            <TaoButton variant="ghost" tone="neutral" @click="openId = null">← {{ t('journal.back') }}</TaoButton>
            <small class="journal__date">{{ formatDate(current.date) }}</small>
        </div>

        <ReadingView :cast="current.cast" :question="current.question" :mode="readingMode" @update:mode="setReadingMode">
            <template #actions>
                <TaoButton variant="ghost" tone="danger" @click="void remove(current.id)">{{ t('journal.delete') }}</TaoButton>
            </template>
        </ReadingView>

        <div class="journal__note">
            <label :for="`note-${current.id}`">{{ t('journal.noteLabel') }}</label>
            <TaoTextarea :id="`note-${current.id}`" :model-value="current.note" :rows="3" :maxlength="MAX_NOTE" :placeholder="t('journal.notePlaceholder')" @update:model-value="setNote(current.id, $event)" />
        </div>
    </section>
</template>

<style scoped>
.journal {
    display: grid;
    gap: var(--tao-space-5);
}
.journal__head,
.journal__bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--tao-space-3);
    align-items: center;
    justify-content: space-between;
}
.journal__title {
    margin: 0;
    font-size: 24px;
    color: var(--tao-color-text-strong);
}
.journal__tools {
    display: flex;
    gap: var(--tao-space-2);
}
.journal__file {
    display: none;
}
.journal__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--tao-space-3);
}
.journal__item {
    width: 100%;
    display: flex;
    gap: var(--tao-space-4);
    align-items: center;
    padding: var(--tao-space-3) var(--tao-space-4);
    border: 1px solid var(--tao-color-border);
    border-radius: var(--tao-radius-panel);
    background: var(--tao-color-surface);
    color: var(--tao-color-text);
    font: inherit;
    text-align: start;
    cursor: pointer;
}
.journal__item:hover {
    border-color: var(--hx-bronze);
}
.journal__item:focus-visible {
    outline: 2px solid var(--tao-color-accent);
    outline-offset: 1px;
}
.journal__body {
    display: grid;
    gap: 2px;
    min-width: 0;
}
.journal__name {
    color: var(--tao-color-text-strong);
    font-weight: 600;
}
.journal__question {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--tao-color-text);
}
.journal__date {
    color: var(--tao-color-text-muted);
}
.journal__note {
    display: grid;
    gap: var(--tao-space-2);
}
.journal__note label {
    color: var(--tao-color-text);
}
</style>
