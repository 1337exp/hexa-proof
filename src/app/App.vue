<script setup lang="ts">
import { TaoSegmented, TaoSegmentedOption, TaoTabs, TaoThemeToggle } from '@1337exp/taoui';
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

function again(): void {
    reset();
    reading.value = false;
}

onMounted(startPackLoading);
</script>

<template>
    <div class="app">
        <header class="app__header">
            <div class="app__brand">
                <h1 class="app__title">{{ t('app.title') }}</h1>
                <p class="app__tagline">{{ t('app.tagline') }}</p>
            </div>
            <div class="app__tools">
                <TaoSegmented :model-value="locale" :legend="t('app.language')" size="small" @update:model-value="setLanguage">
                    <TaoSegmentedOption value="en">EN</TaoSegmentedOption>
                    <TaoSegmentedOption value="ru">RU</TaoSegmentedOption>
                </TaoSegmented>
                <TaoThemeToggle />
            </div>
        </header>

        <nav class="app__nav" :aria-label="t('nav.label')">
            <TaoTabs :model-value="view" :items="tabs" @update:model-value="setView" />
        </nav>

        <main class="app__main">
            <template v-if="view === 'cast'">
                <ReadingView v-if="reading && cast" :cast="cast" :question="question" :mode="readingMode" @update:mode="setReadingMode" @again="again" />
                <CastScreen v-else @read="reading = true" />
            </template>
            <LibraryView v-else-if="view === 'library'" />
            <AboutView v-else />
        </main>
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
.app__header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--tao-space-4);
    align-items: flex-start;
    justify-content: space-between;
}
.app__title {
    margin: 0;
    font-family: var(--hx-serif);
    font-size: 28px;
    letter-spacing: 0.02em;
    color: var(--tao-color-text-strong);
}
.app__tagline {
    margin: 4px 0 0;
    max-width: 52ch;
    color: var(--tao-color-text-muted);
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
}
</style>
