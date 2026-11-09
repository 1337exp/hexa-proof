import { changingPositions, hexagram, primaryOf, relatingOf, trigramsOf } from '../core/hexagram';
import { readCast, type ReadingMode } from '../core/reading';
import type { Cast } from '../core/types';
import { locale, t } from './i18n';
import { describePassage } from './passages';
import { pack, textOf } from './texts';

/** «6 Conflict (sòng · Sun; Above: Heaven · Below: Water)» */
function describeHexagram(number: number): string {
    const facts = hexagram(number);
    const book = textOf(number);
    const lang = locale.value === 'ru' ? 'ru' : 'en';
    const { lower, upper } = trigramsOf(number);
    const names = [facts.pinyin, book?.translit].filter(Boolean).join(' · ');
    return `${number} ${book?.name ?? ''} (${names}; ${t('library.above')}: ${upper.image[lang]} · ${t('library.below')}: ${lower.image[lang]})`.replace('  ', ' ');
}

/**
 * The answer as plain text that can be sent to a friend or to an assistant: the question, both hexagrams, the changing lines,
 * and the places of the book, in the language of the interface.
 * Ответ простым текстом, который можно отправить другу или ассистенту: вопрос, обе гексаграммы, движущиеся линии и места книги.
 */
export function answerText(cast: Cast, question: string, mode: ReadingMode): string {
    const reading = readCast(cast, mode);
    const changing = changingPositions(cast);
    const relating = relatingOf(cast);
    const out: string[] = [`${t('app.title')}: ${t('reading.title')}`, ''];

    if (question.trim()) out.push(`${t('reading.yourQuestion')}: ${question.trim()}`);
    out.push(`${t('reading.primary')}: ${describeHexagram(primaryOf(cast).number)}`);
    out.push(changing.length ? t('reading.changing', [changing.join(', ')]) : t('reading.noChange'));
    if (relating) out.push(`${t('reading.relating')}: ${describeHexagram(relating.number)}`);
    out.push(t(`reading.rule.${reading.rule}`));

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
