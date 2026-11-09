<script setup lang="ts">
import { TaoSpoiler } from '@1337exp/taoui';
import { computed } from 'vue';
import type { Passage } from '../../core/reading';
import { t } from '../i18n';
import { describePassage } from '../passages';

/**
 * One place of the book: the classic words first, the explanation under them, folded away.
 * Одно место книги: сначала канонические слова, под ними свёрнутое толкование.
 */
const props = defineProps<{ passage: Passage; main?: boolean }>();

const content = computed(() => describePassage(props.passage));
</script>

<template>
    <article v-if="content" class="passage" :class="{ 'passage--main': main }">
        <header class="passage__head">
            <h4 class="passage__title">{{ content.title }}</h4>
            <span v-if="main" class="passage__main">{{ t('passage.main') }}</span>
        </header>
        <small v-if="content.kind" class="passage__kind">{{ content.kind }}</small>
        <blockquote v-if="content.text" class="passage__words">{{ content.text }}</blockquote>
        <p v-else class="passage__gap">{{ t('passage.gap') }}</p>
        <p v-if="content.symbol" class="passage__symbol">{{ content.symbol }}</p>
        <div v-if="content.image" class="passage__image">
            <small>{{ t('passage.image') }}</small>
            <p>{{ content.image }}</p>
        </div>
        <TaoSpoiler v-if="content.comment" :title="t('passage.comment')">
            <p class="passage__comment">{{ content.comment }}</p>
        </TaoSpoiler>
    </article>
</template>

<style scoped>
.passage {
    display: grid;
    gap: var(--tao-space-2);
    padding: var(--tao-space-4) var(--tao-space-5);
    border: 1px solid var(--tao-color-border);
    border-radius: var(--tao-radius-panel);
    background: var(--tao-color-surface);
}
.passage__main {
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--hx-bronze-light) 16%, transparent);
    color: var(--hx-bronze-light);
    font-size: 12px;
    font-weight: 600;
}
.passage__head {
    display: flex;
    gap: var(--tao-space-3);
    align-items: center;
}
.passage__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--tao-color-text-strong);
}
.passage__kind {
    color: var(--tao-color-text-muted);
}
.passage__words {
    margin: 0;
    padding-left: var(--tao-space-4);
    border-left: 2px solid var(--hx-bronze);
    font-family: var(--hx-serif);
    font-size: 18px;
    line-height: 1.55;
    color: var(--tao-color-text-strong);
}
.passage__gap,
.passage__symbol {
    margin: 0;
    color: var(--tao-color-text-muted);
}
.passage__image {
    display: grid;
    gap: 2px;
}
.passage__image small {
    color: var(--tao-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
}
.passage__image p,
.passage__comment {
    margin: 0;
    color: var(--tao-color-text);
    line-height: 1.6;
}
</style>
