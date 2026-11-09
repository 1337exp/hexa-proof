<script setup lang="ts">
import type { Coin } from '../../core/cast';

/**
 * A bronze coin with a square hole, seen from above. One side carries a solid bar (yang, 3), the other a broken one (yin, 2).
 * Бронзовая монета с квадратным отверстием, вид сверху. На одной стороне сплошная черта (ян, 3), на другой прерывистая (инь, 2).
 */
defineProps<{ side: Coin; size?: number }>();
</script>

<template>
    <svg class="coin" :width="size ?? 64" :height="size ?? 64" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
            <radialGradient id="coin-metal" cx="38%" cy="32%" r="75%">
                <stop offset="0" stop-color="var(--hx-bronze-light)" />
                <stop offset="0.65" stop-color="var(--hx-bronze)" />
                <stop offset="1" stop-color="var(--hx-bronze-dark)" />
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#coin-metal)" />
        <circle cx="32" cy="32" r="26.5" fill="none" stroke="var(--hx-bronze-dark)" stroke-width="1.6" opacity="0.7" />
        <template v-if="side === 3">
            <rect x="14" y="13.5" width="36" height="5" rx="1.5" fill="var(--hx-bronze-dark)" />
            <rect x="14" y="45.5" width="36" height="5" rx="1.5" fill="var(--hx-bronze-dark)" />
        </template>
        <template v-else>
            <rect x="14" y="13.5" width="15" height="5" rx="1.5" fill="var(--hx-bronze-dark)" />
            <rect x="35" y="13.5" width="15" height="5" rx="1.5" fill="var(--hx-bronze-dark)" />
            <rect x="14" y="45.5" width="15" height="5" rx="1.5" fill="var(--hx-bronze-dark)" />
            <rect x="35" y="45.5" width="15" height="5" rx="1.5" fill="var(--hx-bronze-dark)" />
        </template>
        <rect x="24" y="24" width="16" height="16" rx="1" fill="var(--hx-hole)" stroke="var(--hx-bronze-dark)" stroke-width="1.6" />
    </svg>
</template>
