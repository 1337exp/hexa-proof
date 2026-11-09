<script setup lang="ts">
import { confirm, TaoButton, TaoSegmented, TaoSegmentedOption, TaoTag, TaoThemeToggle, toast } from '@1337exp/taoui';
import { onMounted, ref } from 'vue';
import AboutView from './components/AboutView.vue';
import JournalView from './components/JournalView.vue';
import CastScreen from './components/CastScreen.vue';
import LibraryView from './components/LibraryView.vue';
import ReadingView from './components/ReadingView.vue';
import { i18n, locale, t } from './i18n';
import { addEntry, entries, startJournal } from './journal';
import { cast, question, readingMode, reset, setReadingMode } from './session';
import { startPackLoading } from './texts';
import { computed } from 'vue';

type View = 'cast' | 'journal' | 'library' | 'about';

const view = ref<View>('cast');
const reading = ref(false);

/** The three working sections are the tiles; the book is a quiet link in the top row. / Три рабочих раздела это плитки; книга это тихая ссылка в верхнем ряду. */
const tiles = computed(() => [
    { value: 'cast', label: t('nav.cast') },
    { value: 'journal', label: entries.value.length ? `${t('nav.journal')} (${entries.value.length})` : t('nav.journal') },
    { value: 'library', label: t('nav.library') },
]);

function setView(value: string): void {
    view.value = value as View;
}

function setLanguage(value: string | number | boolean): void {
    const code = String(value);
    if (i18n.isLocaleCode(code)) i18n.setLocale(code);
}

/** The id of the journal entry that holds the answer on the screen, once it is saved. / Id записи журнала с ответом на экране, когда он сохранён. */
const savedId = ref<string | null>(null);

function save(): void {
    if (!cast.value || savedId.value) return;
    const entry = addEntry(cast.value, question.value);
    if (entry) {
        savedId.value = entry.id;
        toast().success().message(t('journal.saved'));
    }
}

async function again(): Promise<void> {
    // a saved answer is safe in the journal: only an unsaved one is worth a question
    if (!savedId.value && !(await confirm().title(t('reading.againTitle')).message(t('reading.againMessage')).ok(t('reading.again')).danger())) return;
    savedId.value = null;
    reset();
    reading.value = false;
}

onMounted(() => {
    startPackLoading();
    startJournal();
});
</script>

<template>
    <div class="app">
        <h1 class="visually-hidden">{{ t('app.title') }}</h1>

        <!-- The bar of the page: a glass panel with two rows. The top one has the book on the left and the language and the theme on the right;
             under it the three sections are tiles of equal width, easy to hit with a thumb. It does not stick: it scrolls away with the page. -->
        <header class="app__bar">
            <div class="app__top">
                <div class="app__tools">
                    <TaoSegmented :model-value="locale" :legend="t('app.language')" size="small" @update:model-value="setLanguage">
                        <TaoSegmentedOption value="en">EN</TaoSegmentedOption>
                        <TaoSegmentedOption value="ru">RU</TaoSegmentedOption>
                    </TaoSegmented>
                    <TaoThemeToggle />
                </div>
            </div>
            <nav class="app__tiles" :aria-label="t('nav.label')">
                <button v-for="item in tiles" :key="item.value" type="button" class="app__tile" :class="{ active: item.value === view }" :aria-current="item.value === view ? 'page' : undefined" @click="setView(item.value)">
                    {{ item.label }}
                </button>
            </nav>
        </header>

        <p class="app__tagline">{{ t('app.tagline') }}</p>

        <main class="app__main">
            <template v-if="view === 'cast'">
                <ReadingView v-if="reading && cast" :cast="cast" :question="question" :mode="readingMode" @update:mode="setReadingMode">
                    <template #actions>
                        <TaoTag v-if="savedId" tone="success" flat>{{ t('journal.saved') }}</TaoTag>
                        <TaoButton v-else variant="primary" @click="save()">{{ t('journal.save') }}</TaoButton>
                        <TaoButton variant="secondary" @click="void again()">{{ t('reading.again') }}</TaoButton>
                    </template>
                </ReadingView>
                <CastScreen v-else @read="reading = true" />
            </template>
            <JournalView v-else-if="view === 'journal'" />
            <LibraryView v-else-if="view === 'library'" />
            <AboutView v-else />
        </main>

        <footer class="app__footer">
            <button type="button" class="app__about" :aria-current="view === 'about' ? 'page' : undefined" @click="setView('about')">{{ t('nav.about') }}</button>
            <a href="https://666.io" target="_blank" rel="noopener">666.io</a>
        </footer>
    </div>
</template>

<style scoped>
.app {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--tao-space-6) 16px var(--tao-space-10);
    display: grid;
    gap: var(--tao-space-5);
}
.app__bar {
    display: grid;
    gap: 8px;
    padding: 8px 10px 10px;
    border: 1px solid var(--tao-color-border);
    border-radius: var(--tao-radius-panel);
    background: color-mix(in srgb, var(--tao-color-surface) 86%, transparent);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
.app__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.app__tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}
.app__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 6px;
    border: 1px solid var(--tao-color-border);
    border-radius: var(--tao-radius-control);
    background: var(--tao-color-surface);
    color: var(--tao-color-text);
    font: inherit;
    font-size: clamp(13px, 3.6vw, 15px);
    font-weight: 600;
    text-align: center;
    cursor: pointer;
}
.app__tile:hover {
    background: var(--tao-color-surface-hover);
    color: var(--tao-color-text-strong);
}
.app__tile.active {
    border-color: var(--tao-color-accent);
    background: var(--tao-color-surface-sunken);
    color: var(--tao-color-accent);
}
.app__tile:focus-visible {
    outline: 2px solid var(--tao-color-accent);
    outline-offset: 1px;
}
@media (max-width: 520px) {
    .app__bar {
        padding: 8px;
    }
    .app__tools {
        gap: 4px;
    }
}
.app__tagline {
    margin: 0;
    max-width: 56ch;
    font-size: 14px;
    color: var(--tao-color-text-muted);
}
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}
.app__footer {
    margin-top: var(--tao-space-10);
    padding-top: var(--tao-space-6);
    border-top: 1px solid var(--tao-color-border);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--tao-space-2) var(--tao-space-6);
    font-size: 14px;
    color: var(--tao-color-text-muted);
}
.app__about {
    padding: 0;
    border: 0;
    background: none;
    color: var(--tao-color-text);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
}
.app__about:hover,
.app__about[aria-current='page'] {
    color: var(--tao-color-accent);
}
.app__about:focus-visible {
    outline: 2px solid var(--tao-color-accent);
    outline-offset: 2px;
}
.app__footer a {
    color: var(--tao-color-text);
}
.app__footer a:hover {
    color: var(--tao-color-text-strong);
}
/* the name of the language switch is for screen readers only: the two letters speak for themselves */
.app__tools :deep(.tao-segmented__legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}
.app__tools {
    display: flex;
    gap: var(--tao-space-3);
    align-items: center;
    margin-inline-start: auto;
}
</style>
