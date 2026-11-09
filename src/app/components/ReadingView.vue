<script setup lang="ts">
import { TaoButton, TaoDivider, TaoEmpty, TaoSegmented, TaoSegmentedOption, toast } from '@1337exp/taoui';
import { computed } from 'vue';
import { changingPositions, primaryOf, relatingOf } from '../../core/hexagram';
import { readCast, type ReadingMode } from '../../core/reading';
import type { Cast } from '../../core/types';
import { t } from '../i18n';
import { bookText, castText } from '../share';
import { pack } from '../texts';
import HexagramHead from './HexagramHead.vue';
import PassageCard from './PassageCard.vue';

const props = defineProps<{ cast: Cast; question: string; mode: ReadingMode }>();
const emit = defineEmits<{ 'update:mode': [mode: ReadingMode] }>();

const primary = computed(() => primaryOf(props.cast));
const relating = computed(() => relatingOf(props.cast));
const reading = computed(() => readCast(props.cast, props.mode));
const changing = computed(() => changingPositions(props.cast));

/** Puts on the clipboard, as plain text, what was cast or the text of the book: to send to somebody or to an assistant. / Кладёт в буфер простым текстом, что выпало, или текст книги. */
async function copy(what: 'cast' | 'book'): Promise<void> {
    try {
        await navigator.clipboard.writeText(what === 'cast' ? castText(props.cast, props.question) : bookText(props.cast, props.mode));
        toast().success().message(t('reading.copied'));
    } catch {
        toast().danger().message(t('reading.copyFailed'));
    }
}

function setMode(value: string | number | boolean): void {
    emit('update:mode', value === 'all' ? 'all' : 'classic');
}
</script>

<template>
    <section class="reading" aria-labelledby="reading-title">
        <div class="reading__titlebar">
            <h2 id="reading-title" class="reading__title">{{ t('reading.title') }}</h2>
            <TaoButton variant="ghost" tone="neutral" icon="tao-copy" :aria-label="t('reading.copy')" :title="t('reading.copy')" @click="void copy('cast')" />
        </div>

        <p v-if="question.trim()" class="reading__question">
            <small>{{ t('reading.yourQuestion') }}</small>
            {{ question }}
        </p>

        <!-- Both hexagrams stand in one row while they fit; when they do not, they all go under each other and the arrow turns down and
             stands in the middle, so it is clear what it points at. The container decides, not the window. -->
        <div class="reading__figures-box">
            <div class="reading__figures">
                <HexagramHead :number="primary.number" :values="cast" :caption="t('reading.primary')" />
                <template v-if="relating">
                    <span class="reading__arrow" aria-hidden="true">→</span>
                    <HexagramHead :number="relating.number" :caption="t('reading.relating')" />
                </template>
            </div>
        </div>
        <p class="reading__changing">{{ changing.length ? t('reading.changing', [changing.join(', ')]) : t('reading.noChange') }}</p>

        <TaoDivider />

        <div class="reading__mode">
            <div class="reading__modebar">
                <TaoSegmented :model-value="mode" :legend="t('reading.modeLabel')" @update:model-value="setMode">
                    <TaoSegmentedOption value="classic">{{ t('reading.modeClassic') }}</TaoSegmentedOption>
                    <TaoSegmentedOption value="all">{{ t('reading.modeAll') }}</TaoSegmentedOption>
                </TaoSegmented>
                <TaoButton variant="ghost" tone="neutral" icon="tao-copy" :aria-label="t('reading.copyText')" :title="t('reading.copyText')" :disabled="!pack" @click="void copy('book')" />
            </div>
            <p class="reading__rule">{{ t(`reading.rule.${reading.rule}`) }}</p>
        </div>

        <TaoEmpty v-if="!pack" :title="t('library.loading')" />
        <div v-else class="reading__passages">
            <PassageCard v-for="(passage, index) in reading.passages" :key="`${mode}-${index}`" :passage="passage" :main="reading.passages.length > 1 && index === reading.main" />
        </div>

        <footer class="reading__foot">
            <small v-if="pack">{{ t('texts.author', [`${pack.source.author}, ${pack.source.title}`]) }}</small>
            <div class="reading__actions"><slot name="actions" /></div>
        </footer>
    </section>
</template>

<style scoped>
.reading {
    display: grid;
    gap: var(--tao-space-5);
}
.reading__titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--tao-space-2);
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
.reading__figures-box {
    container-type: inline-size;
}
.reading__figures {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--tao-space-6);
    align-items: center;
}
.reading__figures > :deep(.hexagram-head) {
    min-width: 0;
}
.reading__arrow {
    flex: none;
    font-size: 28px;
    line-height: 1;
    color: var(--hx-bronze-light);
}
@container (max-width: 679px) {
    .reading__figures {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--tao-space-3);
    }
    .reading__arrow {
        align-self: center;
        transform: rotate(90deg);
    }
}
.reading__changing {
    margin: 0;
    color: var(--tao-color-text-muted);
}
.reading__mode {
    display: grid;
    gap: var(--tao-space-2);
}
/* the name of the switch is for screen readers only: the rule written under it says what is read */
.reading__mode :deep(.tao-segmented__legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}
.reading__modebar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--tao-space-3);
}
.reading__rule {
    margin: 0;
    color: var(--tao-color-text);
    font-size: 14px;
}
.reading__passages {
    display: grid;
    gap: var(--tao-space-4);
}
.reading__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--tao-space-3);
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
