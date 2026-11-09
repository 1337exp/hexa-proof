export interface EnHexagram {
    number: number;
    translit: string;
    judgment: { text: string };
    lines: { text: string }[];
    useAll?: { text: string };
}

export const TYPOS: ReadonlyArray<readonly [string, string]>;
export function romanToInt(roman: string): number;
export function tidy(text: string): string;
export function paragraphsOf(block: string): string[];
export function parseText(text: string): { hexagrams: Map<number, EnHexagram>; warnings: string[] };
export function parseImages(text: string): Map<number, string>;
