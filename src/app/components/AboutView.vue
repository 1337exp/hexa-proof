<script setup lang="ts">
import { TaoAlert, TaoSpoiler } from '@1337exp/taoui';
import { nextTick, onMounted } from 'vue';
import { t } from '../i18n';
import { anchor } from '../nav';
import { pack } from '../texts';

/** Opened from a help icon: scroll to the block that was asked for. / Открыто по значку помощи: прокрутить к нужному блоку. */
onMounted(async () => {
    const id = anchor.value;
    anchor.value = null;
    if (!id) return;
    await nextTick();
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
});

const RULES = ['none', 'one', 'two', 'three', 'four', 'five', 'six'] as const;
</script>

<template>
    <section class="about" aria-labelledby="about-title">
        <h2 id="about-title" class="about__title">{{ t('about.title') }}</h2>

        <div class="about__block">
            <h3>{{ t('about.how') }}</h3>
            <p>{{ t('about.howText') }}</p>
        </div>

        <div class="about__block">
            <h3>{{ t('about.marks') }}</h3>
            <p>{{ t('about.marksText') }}</p>
        </div>

        <div id="about-rules" class="about__block">
            <h3>{{ t('about.rules') }}</h3>
            <p>{{ t('about.modesText') }}</p>
            <ul>
                <li v-for="rule in RULES" :key="rule">{{ t(`reading.rule.${rule}`) }}</li>
            </ul>
        </div>

        <div class="about__block">
            <h3>{{ t('about.sources') }}</h3>
            <p>{{ t('about.sourceEn') }}</p>
            <p>{{ t('about.sourceRu') }}</p>
        </div>

        <TaoSpoiler v-if="pack?.about?.length" :title="t('about.introTitle')">
            <div class="about__intro">
                <p v-for="(paragraph, index) in pack.about.slice(1)" :key="index">{{ paragraph }}</p>
            </div>
        </TaoSpoiler>

        <TaoAlert tone="info">{{ t('about.notice') }}</TaoAlert>
    </section>
</template>

<style scoped>
.about {
    display: grid;
    gap: var(--tao-space-5);
    max-width: 70ch;
}
.about__title {
    margin: 0;
    font-size: 24px;
    color: var(--tao-color-text-strong);
}
.about__block h3 {
    margin: 0 0 var(--tao-space-2);
    font-size: 16px;
    color: var(--tao-color-text-strong);
}
.about__block p,
.about__block li,
.about__intro p {
    color: var(--tao-color-text);
    line-height: 1.6;
}
.about__block p {
    margin: 0 0 var(--tao-space-2);
}
.about__intro {
    display: grid;
    gap: var(--tao-space-3);
}
</style>
