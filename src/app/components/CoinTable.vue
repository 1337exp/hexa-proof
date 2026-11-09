<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Coins } from '../../core/cast';
import type { TableStage } from '../../scene/TableStage';

/**
 * The table with the three coins. The three.js scene is loaded when the component appears, as a separate chunk,
 * so the pages that do not need it (the library, the book) do not carry it.
 * Стол с тремя монетами. Сцена three.js грузится, когда компонент появляется, отдельным куском: страницы, которым она не нужна, её не несут.
 */
const emit = defineEmits<{ activate: []; unavailable: [] }>();

const host = ref<HTMLElement | null>(null);
let stage: TableStage | null = null;

onMounted(async () => {
    try {
        const { TableStage: Stage } = await import('../../scene/TableStage');
        if (!host.value) return;
        stage = new Stage(host.value, { onActivate: () => emit('activate') });
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
    <div ref="host" class="coin-table" aria-hidden="true"></div>
</template>

<style scoped>
.coin-table {
    position: relative;
    width: 100%;
    height: clamp(300px, 54vw, 420px);
    border-radius: var(--tao-radius-panel);
    overflow: hidden;
    background: #0e0907;
    cursor: pointer;
}
.coin-table::after {
    /* the glow of the lamp on the edges of the picture: a soft vignette */
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(8, 4, 2, 0.55) 100%);
}
</style>
