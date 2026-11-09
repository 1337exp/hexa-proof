import { hexagram } from '../core/hexagram';
import type { Passage } from '../core/reading';
import { t } from './i18n';
import { textOf } from './texts';

/**
 * What a place of the book looks like in words: used by the card on the screen and by the copied text, so the two never differ.
 * Как место книги выглядит словами: им пользуются и карточка на экране, и копируемый текст, чтобы они не расходились.
 */
export interface PassageContent {
    title: string;
    /** How the line is named: the book's own label, or solid / broken. / Как названа линия. */
    kind?: string;
    text: string;
    comment?: string;
    symbol?: string;
    image?: string;
}

/** Null while the pack of the book is not loaded. / Null, пока пакет книги не загружен. */
export function describePassage(passage: Passage): PassageContent | null {
    const book = textOf(passage.hexagram);
    if (!book) return null;
    if (passage.kind === 'judgment') {
        return { title: t('passage.judgmentOf', [book.name]), text: book.judgment?.text ?? '', comment: book.judgment?.comment, image: book.image?.text };
    }
    if (passage.kind === 'useAll') {
        const yang = hexagram(passage.hexagram).lines[0] === '1';
        return { title: t(yang ? 'passage.useAllNine' : 'passage.useAllSix'), text: book.useAll?.text ?? '', comment: book.useAll?.comment };
    }
    const line = book.lines[passage.position - 1];
    const solid = hexagram(passage.hexagram).lines[passage.position - 1] === '1';
    return {
        title: t('passage.lineOf', [passage.position, book.name]),
        kind: line?.label ?? t(solid ? 'passage.yang' : 'passage.yin'),
        text: line?.text ?? '',
        comment: line?.comment,
        symbol: line?.symbol,
    };
}
