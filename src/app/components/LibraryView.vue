<script setup lang="ts">
import { TaoDrawer, TaoEmpty, TaoInput } from '@1337exp/taoui';
import { computed, ref } from 'vue';
import { HEXAGRAMS } from '../../data/hexagrams';
import type { Passage } from '../../core/reading';
import { t } from '../i18n';
import { pack, textOf } from '../texts';
import HexagramFigure from './HexagramFigure.vue';
import HexagramHead from './HexagramHead.vue';
import PassageCard from './PassageCard.vue';

const search = ref('');
const open = ref(false);
const selected = ref(1);

const normalize = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const items = computed(() => {
    const query = normalize(search.value.trim());
    return HEXAGRAMS.filter((h) => {
        if (!query) return true;
        const text = textOf(h.number);
        const haystack = [String(h.number), h.hanzi, h.pinyin, text?.name ?? '', text?.translit ?? ''].map(normalize).join(' ');
        return haystack.includes(query);
    });
});

function show(number: number): void {
    selected.value = number;
    open.value = true;
}

const passages = computed<Passage[]>(() => [
    { kind: 'judgment', hexagram: selected.value },
    ...[1, 2, 3, 4, 5, 6].map((position): Passage => ({ kind: 'line', hexagram: selected.value, position })),
]);
</script>

<template>
    <section class="library" aria-labelledby="library-title">
        <h2 id="library-title" class="library__title">{{ t('library.title') }}</h2>
        <TaoInput v-model="search" :placeholder="t('library.search')" clearable :aria-label="t('library.search')" />

        <ul v-if="items.length" class="library__grid">
            <li v-for="h in items" :key="h.number">
                <button type="button" class="library__item" :aria-label="t('library.open', [h.number])" @click="show(h.number)">
                    <HexagramFigure :values="[...h.lines].map((l) => (l === '1' ? 7 : 8))" :width="52" />
                    <span class="library__number">{{ h.number }}</span>
                    <span class="library__name">{{ textOf(h.number)?.name ?? h.pinyin }}</span>
                    <span class="library__han" lang="zh">{{ h.hanzi }}</span>
                </button>
            </li>
        </ul>
        <TaoEmpty v-else :title="t('library.empty')" />

        <TaoDrawer v-model="open" side="right" :title="textOf(selected)?.name ?? ''" :close-label="t('library.close')">
            <div class="library__detail">
                <HexagramHead :number="selected" :width="72" />
                <p v-if="!pack">{{ t('library.loading') }}</p>
                <template v-else>
                    <PassageCard v-for="(passage, index) in passages" :key="`${selected}-${index}`" :passage="passage" />
                </template>
            </div>
        </TaoDrawer>
    </section>
</template>

<style scoped>
.library {
    display: grid;
    gap: var(--tao-space-5);
}
.library__title {
    margin: 0;
    font-size: 24px;
    color: var(--tao-color-text-strong);
}
.library__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
    gap: var(--tao-space-3);
}
.library__item {
    width: 100%;
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: var(--tao-space-3);
    border: 1px solid var(--tao-color-border);
    border-radius: var(--tao-radius-panel);
    background: var(--tao-color-surface);
    color: var(--tao-color-text);
    font: inherit;
    cursor: pointer;
}
.library__item:hover {
    border-color: var(--hx-bronze);
    color: var(--tao-color-text-strong);
}
.library__number {
    color: var(--hx-bronze-light);
    font-variant-numeric: tabular-nums;
    margin-top: var(--tao-space-2);
}
.library__name {
    text-align: center;
    font-size: 13px;
}
.library__han {
    color: var(--tao-color-text-muted);
    font-family: 'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', 'SimSun', serif;
}
.library__detail {
    display: grid;
    gap: var(--tao-space-4);
}
</style>
