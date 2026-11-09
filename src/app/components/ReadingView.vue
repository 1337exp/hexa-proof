<script setup lang="ts">
import { TaoButton, TaoEmpty, TaoSegmented, TaoSegmentedOption } from '@1337exp/taoui';
import { computed } from 'vue';
import { changingPositions, primaryOf, relatingOf } from '../../core/hexagram';
import { readCast, type ReadingMode } from '../../core/reading';
import type { Cast } from '../../core/types';
import { t } from '../i18n';
import { pack } from '../texts';
import HexagramHead from './HexagramHead.vue';
import PassageCard from './PassageCard.vue';

const props = defineProps<{ cast: Cast; question: string; mode: ReadingMode }>();
const emit = defineEmits<{ again: []; 'update:mode': [mode: ReadingMode] }>();

const primary = computed(() => primaryOf(props.cast));
const relating = computed(() => relatingOf(props.cast));
const reading = computed(() => readCast(props.cast, props.mode));
const changing = computed(() => changingPositions(props.cast));

function setMode(value: string | number | boolean): void {
    emit('update:mode', value === 'all' ? 'all' : 'classic');
}
</script>

<template>
    <section class="reading" aria-labelledby="reading-title">
        <h2 id="reading-title" class="reading__title">{{ t('reading.title') }}</h2>

        <p v-if="question.trim()" class="reading__question">
            <small>{{ t('reading.yourQuestion') }}</small>
            {{ question }}
        </p>

        <div class="reading__figures">
            <HexagramHead :number="primary.number" :values="cast" :caption="t('reading.primary')" />
            <template v-if="relating">
                <span class="reading__arrow" aria-hidden="true">→</span>
                <HexagramHead :number="relating.number" :caption="t('reading.relating')" />
            </template>
        </div>
        <p class="reading__changing">{{ changing.length ? t('reading.changing', [changing.join(', ')]) : t('reading.noChange') }}</p>

        <div class="reading__mode">
            <TaoSegmented :model-value="mode" :legend="t('reading.modeLabel')" @update:model-value="setMode">
                <TaoSegmentedOption value="classic">{{ t('reading.modeClassic') }}</TaoSegmentedOption>
                <TaoSegmentedOption value="all">{{ t('reading.modeAll') }}</TaoSegmentedOption>
            </TaoSegmented>
            <p class="reading__rule">{{ t(`reading.rule.${reading.rule}`) }}</p>
        </div>

        <TaoEmpty v-if="!pack" :title="t('library.loading')" />
        <div v-else class="reading__passages">
            <PassageCard v-for="(passage, index) in reading.passages" :key="`${mode}-${index}`" :passage="passage" :main="reading.passages.length > 1 && index === reading.main" />
        </div>

        <footer class="reading__foot">
            <small v-if="pack">{{ t('texts.author', [`${pack.source.author}, ${pack.source.title}`]) }}</small>
            <TaoButton variant="secondary" @click="emit('again')">{{ t('reading.again') }}</TaoButton>
        </footer>
    </section>
</template>

<style scoped>
.reading {
    display: grid;
    gap: var(--tao-space-5);
}
.reading__title {
    margin: 0;
    font-size: 24px;
    color: var(--tao-color-text-strong);
}
.reading__question {
    margin: 0;
    display: grid;
    gap: 2px;
    color: var(--tao-color-text);
    font-style: italic;
}
.reading__question small {
    font-style: normal;
    color: var(--tao-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
}
.reading__figures {
    display: flex;
    flex-wrap: wrap;
    gap: var(--tao-space-6);
    align-items: center;
}
.reading__arrow {
    font-size: 28px;
    color: var(--hx-bronze-light);
}
.reading__changing {
    margin: 0;
    color: var(--tao-color-text-muted);
}
.reading__mode {
    display: grid;
    gap: var(--tao-space-2);
    justify-items: start;
}
.reading__rule {
    margin: 0;
    color: var(--tao-color-text);
}
.reading__passages {
    display: grid;
    gap: var(--tao-space-4);
}
.reading__foot {
    display: flex;
    flex-wrap: wrap;
    gap: var(--tao-space-4);
    align-items: center;
    justify-content: space-between;
    color: var(--tao-color-text-muted);
}
</style>
