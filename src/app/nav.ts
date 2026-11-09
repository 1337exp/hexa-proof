import { ref } from 'vue';

export type View = 'cast' | 'journal' | 'library' | 'about';

const VIEWS: readonly View[] = ['cast', 'journal', 'library', 'about'];
const isView = (value: unknown): value is View => VIEWS.includes(value as View);

/**
 * Where the reader is, written in the address and in the history of the browser, so that the «back» of a phone (a swipe from the edge) returns to the
 * place the reader came from and does not leave the site:
 *   (nothing)  the table        #answer  the answer of the cast        #journal  the list        #journal/<id>  a reading of the journal
 *   #library   the hexagrams    #about   the book
 * The cast and the answer themselves are kept by the page, they do not depend on the address (a reload at #answer shows the table).
 * Где читатель, записано в адресе и в истории браузера, чтобы «назад» на телефоне вернуло туда, откуда пришли, а не вывело с сайта. Сам бросок и ответ хранит
 * страница, от адреса они не зависят (перезагрузка на #answer покажет стол).
 */
interface Place {
    view: View;
    answer: boolean;
    entry: string | null;
}

function placeOf(hash: string): Place {
    const [name = '', id = ''] = hash.replace(/^#/, '').split('/');
    if (name === 'answer') return { view: 'cast', answer: true, entry: null };
    if (name === 'journal') return { view: 'journal', answer: false, entry: id || null };
    return { view: isView(name) ? name : 'cast', answer: false, entry: null };
}

const hashOf = (place: Place): string => {
    if (place.answer) return '#answer';
    if (place.view === 'journal') return place.entry ? `#journal/${place.entry}` : '#journal';
    return place.view === 'cast' ? '' : `#${place.view}`;
};

const start = typeof location === 'undefined' ? { view: 'cast' as View, answer: false, entry: null } : placeOf(location.hash);

/** The section on the screen. / Раздел на экране. */
export const view = ref<View>(start.view);
/** Whether the answer of the cast is on the screen (in the section of the cast). / Показан ли ответ (в разделе гадания). */
export const answer = ref(start.answer);
/** The id of the reading of the journal that is open, if any. / Id открытой записи журнала. */
export const entry = ref<string | null>(start.entry);
/** The id of a block of the About page to scroll to when it opens. / Id блока страницы «О книге», к которому прокрутить при открытии. */
export const anchor = ref<string | null>(null);

const here = (): Place => ({ view: view.value, answer: answer.value, entry: entry.value });
const same = (a: Place, b: Place): boolean => a.view === b.view && a.answer === b.answer && a.entry === b.entry;

function apply(place: Place): void {
    view.value = place.view;
    answer.value = place.answer;
    entry.value = place.entry;
}

/** Goes to a place and leaves a step in the history. / Переходит на место и оставляет шаг в истории. */
function go(next: Place): void {
    if (same(next, here())) return;
    history.pushState({ pushed: true }, '', location.pathname + location.search + hashOf(next));
    apply(next);
}

/** Goes back to where the reader was: a step of the history if this page made it, else the address is only replaced (it came from outside). */
function goBack(next: Place): void {
    if (same(next, here())) return;
    if (history.state?.pushed) {
        history.back(); // the popstate below puts the page where the address says
        return;
    }
    history.replaceState({}, '', location.pathname + location.search + hashOf(next));
    apply(next);
}

export function showView(next: View): void {
    go({ view: next, answer: false, entry: null });
}

/** The answer is shown (true) or the table again (false). / Показать ответ (true) или снова стол (false). */
export function setAnswer(on: boolean): void {
    if (on) go({ view: 'cast', answer: true, entry: null });
    else goBack({ view: 'cast', answer: false, entry: null });
}

/** Opens a reading of the journal, or the list again (null). / Открывает запись журнала или снова список (null). */
export function setEntry(id: string | null): void {
    if (id) go({ view: 'journal', answer: false, entry: id });
    else goBack({ view: 'journal', answer: false, entry: null });
}

/** Opens the About page, at a block if one is named. / Открывает «О книге», к блоку, если он назван. */
export function openAbout(block?: string): void {
    anchor.value = block ?? null;
    showView('about');
    // already on the About page: nothing will mount to scroll, so it is done here / уже на «О книге»: монтироваться нечему, прокрутка здесь
    if (block && view.value === 'about') document.getElementById(block)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

if (typeof window !== 'undefined') {
    // the first entry of the history is ours too, so «back» to it works
    history.replaceState({}, '', location.href);
    window.addEventListener('popstate', () => {
        anchor.value = null;
        apply(placeOf(location.hash));
    });
}
