/**
 * The value of one cast line (three coins): 6 old yin (changing), 7 young yang, 8 young yin, 9 old yang (changing).
 * Значение одной брошенной линии (три монеты): 6 старый инь (движущаяся), 7 молодой ян, 8 молодой инь, 9 старый ян (движущаяся).
 */
export type LineValue = 6 | 7 | 8 | 9;

/** Six line values, from the bottom line to the top one. / Шесть значений, от нижней линии к верхней. */
export type Cast = readonly [LineValue, LineValue, LineValue, LineValue, LineValue, LineValue];

export type TrigramKey = 'qian' | 'dui' | 'li' | 'zhen' | 'xun' | 'kan' | 'gen' | 'kun';

/** Interface and text languages. / Языки интерфейса и текстов. */
export type Lang = 'ru' | 'en';
