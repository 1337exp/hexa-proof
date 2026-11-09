import { ref } from 'vue';

export type View = 'cast' | 'journal' | 'library' | 'about';

/** The section on the screen. It lives here, not in App, so that any part of the page can send the reader to another one. / Раздел на экране. */
export const view = ref<View>('cast');

/** The id of a block of the About page to scroll to when it opens. / Id блока страницы «О книге», к которому прокрутить при открытии. */
export const anchor = ref<string | null>(null);

/** Opens the About page, at a block if one is named. / Открывает «О книге», к блоку, если он назван. */
export function openAbout(block?: string): void {
    anchor.value = block ?? null;
    view.value = 'about';
}
