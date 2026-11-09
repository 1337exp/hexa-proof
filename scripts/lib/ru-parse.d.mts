export interface RuLine {
    label: string;
    text: string;
    comment?: string;
}

export interface RuHexagram {
    number: number;
    /** Six lines from the bottom, '1' solid: read from the drawing in the file, for the cross-check only. */
    figure: string;
    translit: string;
    name: string;
    judgment?: { text: string; comment?: string };
    lines: RuLine[];
    useAll?: { text: string; comment?: string };
}

export interface Overrides {
    judgmentFrom?: Record<string, string>;
    useAllFrom?: Record<string, string>;
}

export function decodeWin1251(buffer: Uint8Array): string;
export function htmlToText(html: string): string;
export function tidy(text: string): string;
export function cutLead(before: string): { comment: string; lead: string };
export function keepLong(comment: string, lead: string): string;
export function splitVerdict(paragraph: string, from?: string): { comment: string; lead: string; text: string } | null;
export function parseShchutsky(
    html: string,
    overrides?: Overrides,
): { about: string[]; hexagrams: RuHexagram[]; warnings: string[]; leads: { where: string; lead: string }[] };
