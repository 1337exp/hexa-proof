<script setup lang="ts">
import { computed } from 'vue';
import type { LineValue } from '../../core/types';

/**
 * A hexagram drawn with six bars, the top line first, the way it is written. A line that is not cast yet is a dashed outline;
 * an old line carries a mark on its right: a circle for the old yang, a cross for the old yin.
 * Гексаграмма шестью чертами, верхняя линия первой, как её пишут. Ещё не брошенная линия — пунктир; у старой линии справа знак.
 */
const props = withDefaults(
    defineProps<{
        /** Six values from the bottom line; null is a line that is not cast yet. / Шесть значений от нижней линии; null — ещё не брошена. */
        values: readonly (LineValue | null)[];
        /** A position (1…6 from the bottom) to light up. / Позиция (1…6 снизу), которую подсветить. */
        highlight?: number;
        /** The width in px. / Ширина в px. */
        width?: number;
        label?: string;
        /** A line that appears fades in (for the cast screen, where the figure grows line by line). / Появляющаяся линия плавно проявляется. */
        animate?: boolean;
    }>(),
    { highlight: 0, width: 96, label: '', animate: false },
);

const BAR = 9;
const GAP = 8;
const W = 120;
const MARK = 22; // room for the mark on the right
const H = 6 * BAR + 5 * GAP;
const MARK_CX = W + MARK / 2 + 2; // both marks, the circle and the cross, stand on one centre, so they keep the same gap from the line
const CROSS = 4.2; // half of the cross, as the radius of the circle

const rows = computed(() =>
    Array.from({ length: 6 }, (_, k) => {
        const position = 6 - k; // the top row is the sixth line
        const value = props.values[position - 1] ?? null;
        return { position, value, y: k * (BAR + GAP), yang: value === 7 || value === 9, old: value === 6 || value === 9 };
    }),
);

const height = computed(() => Math.round((props.width * H) / (W + MARK)));
</script>

<template>
    <svg class="hexagram-figure" :class="{ animate }" :width="width" :height="height" :viewBox="`0 0 ${W + MARK} ${H}`" role="img" :aria-label="label || undefined" :aria-hidden="label ? undefined : true">
        <g v-for="row in rows" :key="row.position" :class="{ lit: row.position === highlight }">
            <template v-if="row.value === null">
                <rect class="empty" x="0.5" :y="row.y + 0.5" :width="W - 1" :height="BAR - 1" rx="2" />
            </template>
            <template v-else-if="row.yang">
                <rect class="bar" x="0" :y="row.y" :width="W" :height="BAR" rx="2" />
            </template>
            <template v-else>
                <rect class="bar" x="0" :y="row.y" :width="W * 0.43" :height="BAR" rx="2" />
                <rect class="bar" :x="W * 0.57" :y="row.y" :width="W * 0.43" :height="BAR" rx="2" />
            </template>
            <template v-if="row.old">
                <circle v-if="row.yang" class="mark" :cx="MARK_CX" :cy="row.y + BAR / 2" :r="CROSS" />
                <path v-else class="mark" :d="`M${MARK_CX - CROSS} ${row.y + BAR / 2 - CROSS}l${2 * CROSS} ${2 * CROSS}m0 -${2 * CROSS}l-${2 * CROSS} ${2 * CROSS}`" />
            </template>
        </g>
    </svg>
</template>

<style scoped>
.hexagram-figure {
    display: block;
    color: var(--tao-color-text-strong);
    overflow: visible;
}
.bar {
    fill: currentColor;
}
.empty {
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.28;
}
.mark {
    fill: none;
    stroke: var(--hx-bronze-light);
    stroke-width: 2;
    stroke-linecap: round;
}
.animate .bar,
.animate .mark {
    animation: hx-line-in 0.55s ease-out both;
}
@keyframes hx-line-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
@media (prefers-reduced-motion: reduce) {
    .animate .bar,
    .animate .mark {
        animation: none;
    }
}
.lit .bar {
    fill: var(--hx-bronze-light);
}
</style>
