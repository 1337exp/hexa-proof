<script setup lang="ts">
import { confirm, TaoSegmented, TaoSegmentedOption, TaoThemeToggle } from '@1337exp/taoui';
import { onMounted, ref } from 'vue';
import AboutView from './components/AboutView.vue';
import CastScreen from './components/CastScreen.vue';
import LibraryView from './components/LibraryView.vue';
import ReadingView from './components/ReadingView.vue';
import { i18n, locale, t } from './i18n';
import { cast, question, readingMode, reset, setReadingMode } from './session';
import { startPackLoading } from './texts';
import { computed } from 'vue';

type View = 'cast' | 'library' | 'about';

const view = ref<View>('cast');
const reading = ref(false);

const tabs = computed(() => [
    { value: 'cast', label: t('nav.cast') },
    { value: 'library', label: t('nav.library') },
    { value: 'about', label: t('nav.about') },
]);

function setView(value: string): void {
    view.value = value as View;
}

function setLanguage(value: string | number | boolean): void {
    const code = String(value);
    if (i18n.isLocaleCode(code)) i18n.setLocale(code);
}

async function again(): Promise<void> {
    if (!(await confirm().title(t('reading.againTitle')).message(t('reading.againMessage')).ok(t('reading.again')).danger())) return;
    reset();
    reading.value = false;
}

onMounted(startPackLoading);
</script>

<template>
    <div class="app">
        <h1 class="visually-hidden">{{ t('app.title') }}</h1>

        <!-- The bar of the page, made like the bar of the TaoUI showcase: a glass panel, the sections as pills on the left, the language and the theme
             on the right. Unlike the showcase it does not stick: it scrolls away with the page. -->
        <header class="app__bar">
            <nav class="app__nav" :aria-label="t('nav.label')">
                <button v-for="item in tabs" :key="item.value" type="button" class="app__tab" :class="{ active: item.value === view }" :aria-current="item.value === view ? 'page' : undefined" @click="setView(item.value)">
                    {{ item.label }}
                </button>
            </nav>
            <div class="app__tools">
                <TaoSegmented :model-value="locale" :legend="t('app.language')" size="small" @update:model-value="setLanguage">
                    <TaoSegmentedOption value="en">EN</TaoSegmentedOption>
                    <TaoSegmentedOption value="ru">RU</TaoSegmentedOption>
                </TaoSegmented>
                <TaoThemeToggle />
            </div>
        </header>

        <p class="app__tagline">{{ t('app.tagline') }}</p>

        <main class="app__main">
            <template v-if="view === 'cast'">
                <ReadingView v-if="reading && cast" :cast="cast" :question="question" :mode="readingMode" @update:mode="setReadingMode" @again="void again()" />
                <CastScreen v-else @read="reading = true" />
            </template>
            <LibraryView v-else-if="view === 'library'" />
            <AboutView v-else />
        </main>

        <footer class="app__footer">
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 6px 10px;
    border: 1px solid var(--tao-color-border);
    border-radius: var(--tao-radius-panel);
    background: color-mix(in srgb, var(--tao-color-surface) 86%, transparent);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
.app__nav {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
}
.app__tab {
    display: inline-flex;
    align-items: center;
    min-height: var(--tao-control-height);
    padding: 0 12px;
    border: 0;
    border-radius: var(--tao-radius-control);
    background: transparent;
    color: var(--tao-color-text-muted);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
}
.app__tab:hover {
    background: var(--tao-color-surface-hover);
    color: var(--tao-color-text);
}
.app__tab.active {
    background: var(--tao-color-surface-sunken);
    color: var(--tao-color-accent);
}
.app__tab:focus-visible {
    outline: 2px solid var(--tao-color-accent);
    outline-offset: 1px;
}
@media (max-width: 520px) {
    /* when the room is short the switches go on a row of their own, under the tabs, and stay above the text */
    .app__bar {
        gap: 4px 8px;
        padding: 6px 8px;
    }
    .app__nav {
        gap: 2px;
    }
    .app__tab {
        padding: 0 6px;
        font-size: 12px;
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
    text-align: center;
    font-size: 14px;
    color: var(--tao-color-text-muted);
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
