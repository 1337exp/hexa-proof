<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { t } from '../i18n';
import { setSound, soundOn } from '../sound';
import type { Coins } from '../../core/cast';
import type { TableStage } from '../../scene/TableStage';

/**
 * The table with the three coins. The three.js scene is loaded when the component appears, as a separate chunk,
 * so the pages that do not need it (the library, the book) do not carry it.
 * Стол с тремя монетами. Сцена three.js грузится, когда компонент появляется, отдельным куском: страницы, которым она не нужна, её не несут.
 */
const emit = defineEmits<{ activate: []; impact: [strength: number]; unavailable: [] }>();
/** The words under the finger; with none, the hint is not shown. / Слова под пальцем; без них подсказки нет. */
defineProps<{ hint?: string }>();

const host = ref<HTMLElement | null>(null);
let stage: TableStage | null = null;

onMounted(async () => {
    try {
        const { TableStage: Stage } = await import('../../scene/TableStage');
        if (!host.value) return;
        stage = new Stage(host.value, { onActivate: () => emit('activate'), onImpact: (strength) => emit('impact', strength) });
    } catch {
        // no WebGL (or no 2D canvas): the screen falls back to the flat coins
        emit('unavailable');
    }
});

onBeforeUnmount(() => {
    stage?.dispose();
    stage = null;
});

defineExpose({
    /** Plays the toss; resolves when the coins lie still. Without a stage it resolves at once. / Разыгрывает бросок; без сцены завершается сразу. */
    toss: (sides: Coins, instant = false): Promise<void> => stage?.toss(sides, { instant }) ?? Promise.resolve(),
    reset: (): void => stage?.reset(),
});
</script>

<template>
    <div class="coin-table">
        <div ref="host" class="coin-table__canvas" aria-hidden="true"></div>
        <button type="button" class="coin-table__sound" :aria-pressed="soundOn" :aria-label="soundOn ? t('cast.soundOn') : t('cast.soundOff')" :title="soundOn ? t('cast.soundOn') : t('cast.soundOff')" @click="setSound(!soundOn)">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
                <path v-if="soundOn" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path v-else d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
        </button>
        <!-- The hint lets every press through (pointer-events: none): the press lands on the table itself and throws the coins. -->
        <Transition name="hint">
            <div v-if="hint" class="coin-table__hint" aria-hidden="true">
                <span class="coin-table__touch">
                    <span class="coin-table__ripple"></span>
                    <svg class="coin-table__finger" viewBox="0 0 24 24" width="64" height="64" focusable="false">
                        <path
                            d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"
                        />
                    </svg>
                </span>
                <span class="coin-table__caption">{{ hint }}</span>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.coin-table {
    position: relative;
    width: 100%;
    height: clamp(300px, 54vw, 420px);
    border-radius: var(--tao-radius-panel);
    overflow: hidden;
    background: #0e0907;
}
.coin-table__canvas {
    position: absolute;
    inset: 0;
    cursor: pointer;
}
.coin-table__sound {
    position: absolute;
    right: 8px;
    bottom: 8px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(14, 9, 7, 0.55);
    color: var(--hx-bronze-light);
    cursor: pointer;
}
.coin-table__sound:hover {
    background: rgba(14, 9, 7, 0.8);
}
.coin-table__sound[aria-pressed='false'] {
    color: rgba(255, 255, 255, 0.45);
}
.coin-table__sound:focus-visible {
    outline: 2px solid var(--tao-color-accent);
    outline-offset: 1px;
}
.coin-table__hint {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding-top: 12%; /* a little lower than the middle: the coins wait in the middle */
    pointer-events: none;
    color: var(--hx-bronze-light);
}
.coin-table__touch {
    position: relative;
    display: block;
    width: 64px;
    height: 64px;
}
/* the fingertip is where the ripple is born: the icon is drawn with the tip at 11.5/24 of its width and 3/24 of its height */
.coin-table__finger {
    position: absolute;
    inset: 0;
    fill: currentColor;
    stroke: #0e0907;
    stroke-width: 0.6;
    stroke-linejoin: round;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
    transform-origin: 48% 14%;
    animation: hx-tap 1.8s ease-in-out infinite;
}
.coin-table__ripple {
    position: absolute;
    left: 48%;
    top: 14%;
    width: 56px;
    height: 56px;
    margin: -28px 0 0 -28px;
    border: 2px solid currentColor;
    border-radius: 50%;
    opacity: 0;
    animation: hx-ripple 1.8s ease-out infinite;
}
.coin-table__caption {
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(14, 9, 7, 0.62);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
@keyframes hx-tap {
    0%,
    100% {
        transform: translateY(0) scale(1);
    }
    35% {
        transform: translateY(7px) scale(0.94); /* the press */
    }
    55% {
        transform: translateY(0) scale(1);
    }
}
@keyframes hx-ripple {
    0%,
    30% {
        opacity: 0;
        transform: scale(0.2);
    }
    38% {
        opacity: 0.85;
    }
    100% {
        opacity: 0;
        transform: scale(1.5);
    }
}
.hint-enter-active,
.hint-leave-active {
    transition: opacity 0.35s ease;
}
.hint-enter-from,
.hint-leave-to {
    opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
    .coin-table__finger,
    .coin-table__ripple {
        animation: none;
    }
    .coin-table__ripple {
        opacity: 0.6;
        transform: scale(0.8);
    }
}
</style>
