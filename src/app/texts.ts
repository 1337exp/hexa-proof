import { shallowRef, watch, type ShallowRef } from 'vue';
import type { HexagramText, TextPack } from '../core/texts';
import type { Lang } from '../core/types';
import { locale } from './i18n';

// The packs are big (the book itself), so each one is a separate chunk that is loaded when its language is needed.
// Пакеты большие (сама книга), поэтому каждый лежит отдельным куском и грузится, когда нужен его язык.
const LOADERS: Record<Lang, () => Promise<{ default: unknown }>> = {
    ru: () => import('../data/texts/ru.json'),
    en: () => import('../data/texts/en.json'),
};

const cache = new Map<Lang, TextPack>();

export async function loadPack(lang: Lang): Promise<TextPack> {
    const cached = cache.get(lang);
    if (cached) return cached;
    const pack = (await LOADERS[lang]()).default as TextPack;
    cache.set(lang, pack);
    return pack;
}

/** The pack of the current language; null while it loads. / Пакет текущего языка; null, пока грузится. */
export const pack: ShallowRef<TextPack | null> = shallowRef(null);

/** Keeps `pack` in step with the interface language. / Держит `pack` в согласии с языком интерфейса. */
export function startPackLoading(): void {
    watch(
        locale,
        async (code) => {
            const lang: Lang = code === 'ru' ? 'ru' : 'en';
            const ready = cache.get(lang);
            if (ready) pack.value = ready;
            const loaded = await loadPack(lang);
            // the language may have changed while the pack was loading
            if ((locale.value === 'ru' ? 'ru' : 'en') === lang) pack.value = loaded;
        },
        { immediate: true },
    );
}

/** The text of one hexagram in the current pack. / Текст одной гексаграммы в текущем пакете. */
export function textOf(number: number): HexagramText | undefined {
    return pack.value?.hexagrams[number - 1];
}
