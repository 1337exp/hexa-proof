import type { TrigramKey } from '../core/types';

export interface Trigram {
    key: TrigramKey;
    hanzi: string;
    pinyin: string;
    /** Three lines, from the bottom one to the top one: '1' is a solid (yang) line, '0' a broken (yin) one. / Три линии снизу вверх: '1' сплошная (ян), '0' прерывистая (инь). */
    lines: string;
    /** The natural image, the same one in every tradition. / Природный образ, общий для всех традиций. */
    image: { ru: string; en: string };
}

export const TRIGRAMS: Readonly<Record<TrigramKey, Trigram>> = {
    qian: { key: 'qian', hanzi: '乾', pinyin: 'qián', lines: '111', image: { ru: 'Небо', en: 'Heaven' } },
    dui: { key: 'dui', hanzi: '兌', pinyin: 'duì', lines: '110', image: { ru: 'Озеро', en: 'Lake' } },
    li: { key: 'li', hanzi: '離', pinyin: 'lí', lines: '101', image: { ru: 'Огонь', en: 'Fire' } },
    zhen: { key: 'zhen', hanzi: '震', pinyin: 'zhèn', lines: '100', image: { ru: 'Гром', en: 'Thunder' } },
    xun: { key: 'xun', hanzi: '巽', pinyin: 'xùn', lines: '011', image: { ru: 'Ветер', en: 'Wind' } },
    kan: { key: 'kan', hanzi: '坎', pinyin: 'kǎn', lines: '010', image: { ru: 'Вода', en: 'Water' } },
    gen: { key: 'gen', hanzi: '艮', pinyin: 'gèn', lines: '001', image: { ru: 'Гора', en: 'Mountain' } },
    kun: { key: 'kun', hanzi: '坤', pinyin: 'kūn', lines: '000', image: { ru: 'Земля', en: 'Earth' } },
};

/** All eight, in the order of the Early Heaven sequence (Fu Xi). / Все восемь в порядке «раннего неба» (Фу Си). */
export const TRIGRAM_ORDER: readonly TrigramKey[] = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];

const byLines = new Map(Object.values(TRIGRAMS).map((trigram) => [trigram.lines, trigram]));

/** The trigram with these three lines (bottom to top). / Триграмма с этими тремя линиями (снизу вверх). */
export function trigramByLines(lines: string): Trigram {
    const trigram = byLines.get(lines);
    if (!trigram) throw new Error(`Not a trigram: ${lines}`);
    return trigram;
}
