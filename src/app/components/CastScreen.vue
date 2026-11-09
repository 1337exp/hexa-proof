<script setup lang="ts">
import { confirm, TaoButton, TaoTextarea } from '@1337exp/taoui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { LineValue } from '../../core/types';
import { t } from '../i18n';
import { cast, question, reset as resetThrows, throwNext, throws } from '../session';
import CoinFace from './CoinFace.vue';
import CoinTable from './CoinTable.vue';
import HexagramFigure from './HexagramFigure.vue';

const emit = defineEmits<{ read: [] }>();

const table = ref<InstanceType<typeof CoinTable> | null>(null);
const flat = ref(false); // no WebGL: show the flat coins / нет WebGL: плоские монеты
const busy = ref(false);
/** How many lines have landed: the figure shows only those. / Сколько линий уже упало: фигура показывает только их. */
const revealed = ref(0);
let cancelled = false;

const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const values = computed<(LineValue | null)[]>(() => Array.from({ length: 6 }, (_, k) => (k < revealed.value ? (throws.value[k]?.value ?? null) : null)));
const last = computed(() => (revealed.value ? (throws.value[revealed.value - 1] ?? null) : null));
const done = computed(() => revealed.value === 6 && cast.value !== null);

// The finger over the table: it shows before the first throw, and comes back when the table has been quiet for a while in the middle of a cast.
// Палец над столом: виден до первого броска и возвращается, если посреди гадания стол долго молчит.
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const IDLE_MS = 6000;
const idle = ref(false);
let idleTimer: ReturnType<typeof setTimeout> | undefined;

watch([busy, revealed], () => {
    clearTimeout(idleTimer);
    idle.value = false;
    if (!busy.value && revealed.value > 0 && revealed.value < 6) idleTimer = setTimeout(() => (idle.value = true), IDLE_MS);
});

const tapHint = computed(() => (!busy.value && !done.value && (revealed.value === 0 || idle.value) ? t(coarse ? 'cast.tapTable' : 'cast.clickTable') : undefined));

async function throwOne(): Promise<void> {
    if (busy.value || throws.value.length >= 6) return;
    busy.value = true;
    const next = throwNext();
    if (next) await table.value?.toss(next.coins, reducedMotion());
    revealed.value = throws.value.length;
    busy.value = false;
}

async function throwAll(): Promise<void> {
    cancelled = false;
    while (!cancelled && throws.value.length < 6) {
        await throwOne();
        if (!cancelled) await sleep(reducedMotion() ? 0 : 350);
    }
}

async function startOver(): Promise<void> {
    // a throw of the coins cannot be taken back, and one press by mistake must not cost the person the whole cast
    const sure = await confirm().title(t('cast.resetTitle')).message(t('cast.resetMessage')).ok(t('cast.resetOk')).cancel(t('cast.resetKeep')).danger();
    if (!sure) return;
    cancelled = true;
    resetThrows();
    revealed.value = 0;
    busy.value = false;
    table.value?.reset();
}

/** A press on the table or on the space bar throws the next line. / Нажатие на стол или пробел бросает следующую линию. */
function activate(): void {
    if (!done.value) void throwOne();
}

function onKey(event: KeyboardEvent): void {
    if (event.code !== 'Space' || event.repeat || event.defaultPrevented) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest('input, textarea, select, button, a, [contenteditable=""], [contenteditable="true"], [role=dialog]')) return;
    event.preventDefault();
    activate();
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
    cancelled = true;
    clearTimeout(idleTimer);
    window.removeEventListener('keydown', onKey);
});

const status = computed(() => {
    if (done.value) return t('cast.done');
    return busy.value ? t('cast.progress', [throws.value.length]) : t('cast.next', [revealed.value + 1]);
});
</script>

<template>
    <section class="cast" aria-labelledby="cast-title">
        <h2 id="cast-title" class="visually-hidden">{{ t('nav.cast') }}</h2>

        <div class="cast__question">
            <label for="cast-question" class="cast__label">{{ t('cast.questionLabel') }}</label>
            <TaoTextarea id="cast-question" v-model="question" :rows="2" :maxlength="300" :placeholder="t('cast.questionPlaceholder')" />
        </div>

        <div class="cast__stage">
            <CoinTable v-if="!flat" ref="table" :hint="tapHint" @activate="activate" @unavailable="flat = true" />
            <div v-else class="cast__flat" aria-live="polite">
                <template v-if="last">
                    <CoinFace v-for="(side, index) in last.coins" :key="`${revealed}-${index}`" :side="side" :size="72" />
                </template>
            </div>

            <div class="cast__info">
                <div class="cast__figure">
                    <HexagramFigure :values="values" :highlight="busy ? 0 : revealed" :width="120" :label="t('cast.figure')" />
                </div>
                <div class="cast__text" aria-live="polite">
                    <p class="cast__thrown">{{ last ? t('cast.justThrown', [revealed, t(`cast.line.v${last.value}`)]) : t('cast.hintStart') }}</p>
                    <small class="cast__progress">{{ status }}</small>
                </div>
            </div>
        </div>

        <div class="cast__actions">
            <!-- the coins are thrown by a press on the table or the space bar, so there is no button for one throw -->
            <TaoButton v-if="done" variant="primary" @click="emit('read')">{{ t('cast.read') }}</TaoButton>
            <TaoButton v-else variant="secondary" :disabled="busy" @click="throwAll()">{{ t('cast.throwAll') }}</TaoButton>
            <TaoButton v-if="throws.length" variant="ghost" tone="neutral" @click="void startOver()">{{ t('cast.reset') }}</TaoButton>
        </div>
    </section>
</template>

<style scoped>
.cast {
    display: grid;
    gap: var(--tao-space-6);
}
.cast__question {
    display: grid;
    gap: var(--tao-space-2);
}
.cast__label {
    color: var(--tao-color-text);
}
.cast__stage {
    display: grid;
    gap: var(--tao-space-4);
}
.cast__flat {
    display: flex;
    gap: var(--tao-space-4);
    justify-content: center;
    min-height: 100px;
    padding: var(--tao-space-6);
    border-radius: var(--tao-radius-panel);
    background: var(--hx-table);
}
/* The figure and its text stay in one row: when the room is short the gap and the text become smaller, and the text wraps, but it never drops under the figure. */
.cast__info {
    display: flex;
    flex-wrap: nowrap;
    gap: clamp(10px, 3.2vw, var(--tao-space-6));
    align-items: center;
}
.cast__figure {
    flex: 0 0 clamp(76px, 24vw, 120px);
}
.cast__figure :deep(svg) {
    width: 100%;
    height: auto;
}
.cast__text {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: anywhere;
}
.cast__thrown {
    margin: 0;
    color: var(--tao-color-text);
    font-size: clamp(13px, 3.7vw, 16px);
    line-height: 1.35;
}
.cast__progress {
    color: var(--tao-color-text-muted);
}
.cast__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--tao-space-3);
}
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}
</style>
