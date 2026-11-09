import { changingPositions, primaryOf, relatingOf } from './hexagram';
import type { Cast } from './types';

/**
 * How to choose the places of the book to read.
 *  - classic: the rule of Zhu Xi (12th century), the common one: it keeps a reading short and tells what weighs most;
 *  - all: everything the cast points at, as Wilhelm does: the verdict, every changing line, and the verdict of the relating hexagram.
 * Как выбирать места книги для чтения: «classic» по правилу Чжу Си (коротко и с главным), «all» — всё, на что указывает бросок.
 */
export type ReadingMode = 'classic' | 'all';

/** A place of the book. / Место книги. */
export type Passage =
    | { kind: 'judgment'; hexagram: number }
    | { kind: 'line'; hexagram: number; position: number }
    /** What is said when all the lines move: only for the hexagrams 1 and 2. / Что сказано, когда движутся все линии. */
    | { kind: 'useAll'; hexagram: number };

/** The name of the rule that was applied, for the explanation shown to the reader. / Имя применённого правила, для пояснения читателю. */
export type RuleId = 'none' | 'one' | 'two' | 'three' | 'threeLater' | 'four' | 'five' | 'six' | 'sixWhole' | 'all';

export interface Reading {
    /** The primary hexagram: where we are. / Основная гексаграмма: где мы сейчас. */
    primary: number;
    /** The relating hexagram: where it leads. Null when no line moves. / Вторая гексаграмма: куда ведёт. */
    relating: number | null;
    /** The moving positions, 1…6 from the bottom. / Движущиеся позиции. */
    changing: number[];
    rule: RuleId;
    /** What to read, in the order of reading. / Что читать, в порядке чтения. */
    passages: Passage[];
    /** Index in `passages` of the place that weighs most. / Индекс самого важного места. */
    main: number;
}

const judgment = (hexagram: number): Passage => ({ kind: 'judgment', hexagram });
const line = (hexagram: number, position: number): Passage => ({ kind: 'line', hexagram, position });

/** The positions 1…6 that do not move. / Позиции, которые не движутся. */
const resting = (changing: readonly number[]): number[] => [1, 2, 3, 4, 5, 6].filter((position) => !changing.includes(position));

/**
 * Which places of the book a cast points at.
 * Какие места книги указывает бросок.
 */
export function readCast(cast: Cast, mode: ReadingMode = 'classic'): Reading {
    const primary = primaryOf(cast).number;
    const relatingHexagram = relatingOf(cast);
    const relating = relatingHexagram?.number ?? null;
    const changing = changingPositions(cast);
    const base = { primary, relating, changing };

    if (changing.length === 0) return { ...base, rule: 'none', passages: [judgment(primary)], main: 0 };

    if (mode === 'all') {
        const passages: Passage[] = [judgment(primary), ...changing.map((position) => line(primary, position))];
        // all six moving in the Creative or the Receptive: the book has a word for just this case
        if (changing.length === 6 && (primary === 1 || primary === 2)) passages.push({ kind: 'useAll', hexagram: primary });
        passages.push(judgment(relating!));
        return { ...base, rule: 'all', passages, main: 0 };
    }

    switch (changing.length) {
        case 1:
            return { ...base, rule: 'one', passages: [line(primary, changing[0]!)], main: 0 };
        case 2:
            // both lines; the upper one weighs more
            return { ...base, rule: 'two', passages: changing.map((position) => line(primary, position)), main: 1 };
        case 3: {
            // the present and where it leads. Zhu Xi (Yixue qimeng): the primary hexagram is the «chen» (the one asked), the relating one the «hui»; of the twenty
            // ways three lines can move, the first ten (the ones that include the first line) are governed by the primary one, the other ten by the relating one
            // Настоящее и куда оно ведёт. Чжу Си: из двадцати сочетаний трёх линий первые десять (в них есть первая линия) ведёт основная гексаграмма, остальные десять вторая
            const first = changing.includes(1);
            return { ...base, rule: first ? 'three' : 'threeLater', passages: [judgment(primary), judgment(relating!)], main: first ? 0 : 1 };
        }
        case 4:
            // the two lines of the relating hexagram that did not move; the lower one weighs more
            return { ...base, rule: 'four', passages: resting(changing).map((position) => line(relating!, position)), main: 0 };
        case 5:
            return { ...base, rule: 'five', passages: [line(relating!, resting(changing)[0]!)], main: 0 };
        default:
            // all six: the verdict of the relating hexagram, and in the Creative and the Receptive their own word for it
            if (primary === 1 || primary === 2) return { ...base, rule: 'sixWhole', passages: [{ kind: 'useAll', hexagram: primary }], main: 0 };
            return { ...base, rule: 'six', passages: [judgment(relating!)], main: 0 };
    }
}
