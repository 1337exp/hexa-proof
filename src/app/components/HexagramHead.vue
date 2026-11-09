<script setup lang="ts">
import { computed } from 'vue';
import { hexagram, trigramsOf } from '../../core/hexagram';
import type { LineValue } from '../../core/types';
import { locale, t } from '../i18n';
import { textOf } from '../texts';
import HexagramFigure from './HexagramFigure.vue';

/**
 * The figure of a hexagram with its number, its name in the current book, the Chinese name and the two trigrams.
 * Фигура гексаграммы с номером, названием в текущей книге, китайским названием и двумя триграммами.
 */
const props = defineProps<{
    number: number;
    /** The values to draw, with the changing lines marked; the quiet figure of the hexagram if absent. / Значения для рисунка; без них — спокойная фигура. */
    values?: readonly LineValue[];
    caption?: string;
    width?: number;
}>();

const facts = computed(() => hexagram(props.number));
const drawn = computed(() => props.values ?? [...facts.value.lines].map((line): LineValue => (line === '1' ? 7 : 8)));
const text = computed(() => textOf(props.number));
const trigrams = computed(() => {
    const { lower, upper } = trigramsOf(props.number);
    const lang = locale.value === 'ru' ? 'ru' : 'en';
    return { lower: lower.image[lang], upper: upper.image[lang] };
});
</script>

<template>
    <div class="hexagram-head">
        <HexagramFigure :values="drawn" :width="width ?? 84" :label="`${number}. ${text?.name ?? ''}`" />
        <div class="hexagram-head__body">
            <small v-if="caption" class="hexagram-head__caption">{{ caption }}</small>
            <h3 class="hexagram-head__title">
                <span class="hexagram-head__number">{{ number }}</span> {{ text?.name ?? '' }}
            </h3>
            <div class="hexagram-head__names">
                <span class="han" lang="zh">{{ facts.hanzi }}</span>
                <span>{{ facts.pinyin }}</span>
                <span v-if="text">· {{ text.translit }}</span>
            </div>
            <small class="hexagram-head__trigrams">{{ t('library.above') }}: {{ trigrams.upper }} · {{ t('library.below') }}: {{ trigrams.lower }}</small>
        </div>
    </div>
</template>

<style scoped>
.hexagram-head {
    display: flex;
    gap: var(--tao-space-4);
    align-items: center;
}
.hexagram-head__body {
    display: grid;
    gap: 2px;
    min-width: 0;
}
.hexagram-head__caption {
    color: var(--tao-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
}
.hexagram-head__title {
    margin: 0;
    color: var(--tao-color-text-strong);
    font-size: 20px;
    font-weight: 600;
}
.hexagram-head__number {
    color: var(--hx-bronze-light);
    font-variant-numeric: tabular-nums;
    margin-right: 4px;
}
.hexagram-head__names {
    display: flex;
    gap: var(--tao-space-2);
    align-items: baseline;
    color: var(--tao-color-text);
}
.han {
    font-family: 'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', 'SimSun', serif;
    font-size: 18px;
}
.hexagram-head__trigrams {
    color: var(--tao-color-text-muted);
}
</style>
