import type { TrigramKey } from '../core/types';
import { TRIGRAMS } from './trigrams';

export interface HexagramFacts {
    /** The King Wen number, 1…64. / Номер по порядку Вэнь-вана, 1…64. */
    number: number;
    upper: TrigramKey;
    lower: TrigramKey;
    hanzi: string;
    pinyin: string;
    /** Six lines, from the bottom one to the top one: '1' solid (yang), '0' broken (yin). / Шесть линий снизу вверх. */
    lines: string;
}

// [upper, lower, hanzi, pinyin], in the King Wen order. Facts, not text: the names and the trigram pairs are the same in every edition.
// [верхняя, нижняя, иероглиф, пиньинь] в порядке Вэнь-вана. Это факты, а не текст: пары триграмм и названия одинаковы во всех изданиях.
const ROWS: ReadonlyArray<readonly [TrigramKey, TrigramKey, string, string]> = [
    ['qian', 'qian', '乾', 'qián'],
    ['kun', 'kun', '坤', 'kūn'],
    ['kan', 'zhen', '屯', 'zhūn'],
    ['gen', 'kan', '蒙', 'méng'],
    ['kan', 'qian', '需', 'xū'],
    ['qian', 'kan', '訟', 'sòng'],
    ['kun', 'kan', '師', 'shī'],
    ['kan', 'kun', '比', 'bǐ'],
    ['xun', 'qian', '小畜', 'xiǎochù'],
    ['qian', 'dui', '履', 'lǚ'],
    ['kun', 'qian', '泰', 'tài'],
    ['qian', 'kun', '否', 'pǐ'],
    ['qian', 'li', '同人', 'tóngrén'],
    ['li', 'qian', '大有', 'dàyǒu'],
    ['kun', 'gen', '謙', 'qiān'],
    ['zhen', 'kun', '豫', 'yù'],
    ['dui', 'zhen', '隨', 'suí'],
    ['gen', 'xun', '蠱', 'gǔ'],
    ['kun', 'dui', '臨', 'lín'],
    ['xun', 'kun', '觀', 'guān'],
    ['li', 'zhen', '噬嗑', 'shìkè'],
    ['gen', 'li', '賁', 'bì'],
    ['gen', 'kun', '剝', 'bō'],
    ['kun', 'zhen', '復', 'fù'],
    ['qian', 'zhen', '無妄', 'wúwàng'],
    ['gen', 'qian', '大畜', 'dàchù'],
    ['gen', 'zhen', '頤', 'yí'],
    ['dui', 'xun', '大過', 'dàguò'],
    ['kan', 'kan', '坎', 'kǎn'],
    ['li', 'li', '離', 'lí'],
    ['dui', 'gen', '咸', 'xián'],
    ['zhen', 'xun', '恆', 'héng'],
    ['qian', 'gen', '遯', 'dùn'],
    ['zhen', 'qian', '大壯', 'dàzhuàng'],
    ['li', 'kun', '晉', 'jìn'],
    ['kun', 'li', '明夷', 'míngyí'],
    ['xun', 'li', '家人', 'jiārén'],
    ['li', 'dui', '睽', 'kuí'],
    ['kan', 'gen', '蹇', 'jiǎn'],
    ['zhen', 'kan', '解', 'xiè'],
    ['gen', 'dui', '損', 'sǔn'],
    ['xun', 'zhen', '益', 'yì'],
    ['dui', 'qian', '夬', 'guài'],
    ['qian', 'xun', '姤', 'gòu'],
    ['dui', 'kun', '萃', 'cuì'],
    ['kun', 'xun', '升', 'shēng'],
    ['dui', 'kan', '困', 'kùn'],
    ['kan', 'xun', '井', 'jǐng'],
    ['dui', 'li', '革', 'gé'],
    ['li', 'xun', '鼎', 'dǐng'],
    ['zhen', 'zhen', '震', 'zhèn'],
    ['gen', 'gen', '艮', 'gèn'],
    ['xun', 'gen', '漸', 'jiàn'],
    ['zhen', 'dui', '歸妹', 'guīmèi'],
    ['zhen', 'li', '豐', 'fēng'],
    ['li', 'gen', '旅', 'lǚ'],
    ['xun', 'xun', '巽', 'xùn'],
    ['dui', 'dui', '兌', 'duì'],
    ['xun', 'kan', '渙', 'huàn'],
    ['kan', 'dui', '節', 'jié'],
    ['xun', 'dui', '中孚', 'zhōngfú'],
    ['zhen', 'gen', '小過', 'xiǎoguò'],
    ['kan', 'li', '既濟', 'jìjì'],
    ['li', 'kan', '未濟', 'wèijì'],
];

/** All 64 hexagrams, index = number − 1. / Все 64 гексаграммы, индекс = номер − 1. */
export const HEXAGRAMS: readonly HexagramFacts[] = ROWS.map(([upper, lower, hanzi, pinyin], index) => ({
    number: index + 1,
    upper,
    lower,
    hanzi,
    pinyin,
    lines: TRIGRAMS[lower].lines + TRIGRAMS[upper].lines,
}));
