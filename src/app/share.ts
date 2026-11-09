import { changingPositions, hexagram, primaryOf, relatingOf, trigramsOf } from '../core/hexagram';
import { readCast, type ReadingMode } from '../core/reading';
import type { Cast } from '../core/types';
import { locale, t } from './i18n';
import { describePassage } from './passages';
import { pack, textOf } from './texts';

/** «6 Суд (sòng · Сун; Сверху: Небо · Снизу: Вода)» */
function describeHexagram(number: number): string {
    const facts = hexagram(number);
    const book = textOf(number);
    const lang = locale.value === 'ru' ? 'ru' : 'en';
    const { lower, upper } = trigramsOf(number);
    const names = [facts.pinyin, book?.translit].filter(Boolean).join(' · ');
    return `${number} ${book?.name ?? ''} (${names}; ${t('library.above')}: ${upper.image[lang]} · ${t('library.below')}: ${lower.image[lang]})`.replace('  ', ' ');
}

/**
 * What was cast, as plain text: the question (if one was written), the hexagram, where it leads, the changing lines. Nothing else:
 * it is the fact of the cast, which can be sent to a friend or to an assistant as it is.
 * Что выпало, простым текстом: вопрос (если он вписан), гексаграмма, куда она ведёт, движущиеся линии. Больше ничего: это сам факт броска.
 */
export function castText(cast: Cast, question: string): string {
    const changing = changingPositions(cast);
    const relating = relatingOf(cast);
    const out: string[] = [];
    if (question.trim()) out.push(`${t('reading.myQuestion')}: ${question.trim()}`);
    out.push(`${t('reading.primary')}: ${describeHexagram(primaryOf(cast).number)}`);
    if (relating) out.push(`${t('reading.relating')}: ${describeHexagram(relating.number)}`);
    out.push(changing.length ? t('reading.changing', [changing.join(', ')]) : t('reading.noChangeShort'));
    return out.join('\n');
}

/**
 * The places of the book that the cast points at, in the chosen mode: the rule, the words and the commentary, with the name of the book.
 * Места книги, на которые указывает бросок, в выбранном режиме: правило, слова и толкование, с названием книги.
 */
export function bookText(cast: Cast, mode: ReadingMode): string {
    const reading = readCast(cast, mode);
    const out: string[] = [t(`reading.rule.${reading.rule}`)];

    reading.passages.forEach((passage, index) => {
        const content = describePassage(passage);
        if (!content) return;
        const main = reading.passages.length > 1 && index === reading.main ? ` (${t('passage.main')})` : '';
        out.push('', `## ${content.title}${main}`);
        if (content.kind) out.push(content.kind);
        out.push(content.text ? `«${content.text}»` : t('passage.gap'));
        if (content.symbol) out.push(content.symbol);
        if (content.image) out.push(`${t('passage.image')}: ${content.image}`);
        if (content.comment) out.push('', `${t('passage.comment')}: ${content.comment}`);
    });

    if (pack.value) out.push('', t('texts.author', [`${pack.value.source.author}, ${pack.value.source.title}`]));
    return out.join('\n');
}
