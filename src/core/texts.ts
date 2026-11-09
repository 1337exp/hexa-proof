import type { Lang } from './types';

/**
 * One line of a hexagram as the book gives it. Every part but the words themselves is optional: the books differ.
 * Одна линия гексаграммы, как её даёт книга. Всё, кроме самих слов, необязательно: книги разные.
 */
export interface LineText {
    /** How the book names the line: «В начале сильная черта». / Как книга называет линию. */
    label?: string;
    /** The classic words of the line. Empty only where the source has a gap. / Канонические слова линии. */
    text: string;
    /** The explanation that goes with it. / Толкование. */
    comment?: string;
    /** The small symbolism of the line (Legge, appendix II). / Малый образ линии. */
    symbol?: string;
}

/** The verdict (the judgment) or the closing remark: the words and the explanation. / Приговор или заключение: слова и толкование. */
export interface WordsText {
    text: string;
    comment?: string;
}

export interface HexagramText {
    /** The King Wen number, 1…64. / Номер по Вэнь-вану. */
    number: number;
    /** The name in the transliteration of this book. / Название в транскрипции этой книги. */
    translit: string;
    /** The name by meaning, in the language of the book. / Название по смыслу, на языке книги. */
    name: string;
    /** The verdict of the whole figure. / Приговор всей фигуры. */
    judgment?: WordsText;
    /** The image (the great symbolism): what the sage takes from the figure. / Образ: что берёт из фигуры мудрец. */
    image?: WordsText;
    /** The six lines, from the bottom one. / Шесть линий, от нижней. */
    lines: LineText[];
    /** What is said when all the lines move (hexagrams 1 and 2). / Что сказано, когда движутся все линии (гексаграммы 1 и 2). */
    useAll?: WordsText;
}

export interface TextSource {
    author: string;
    title: string;
    note?: string;
}

/** A book ready to read: everything the interface may show. / Книга, готовая к чтению: всё, что может показать интерфейс. */
export interface TextPack {
    lang: Lang;
    source: TextSource;
    /** The introduction, paragraph by paragraph (for the "About the book" page). / Введение по абзацам. */
    about?: string[];
    /** All 64, index = number − 1. / Все 64, индекс = номер − 1. */
    hexagrams: HexagramText[];
}
