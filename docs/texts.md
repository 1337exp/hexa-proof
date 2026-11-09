# The texts: how the packs are built and what is wrong in the sources

The application reads two ready packs, `src/data/texts/ru.json` and `en.json` (the type is `TextPack` in `src/core/texts.ts`). They are built by
`npm run texts` from the files in `sources/` (git-ignored). Every defect we found is pinned by a test, so a new one cannot slip in.

## Russian: Yu. K. Shchutsky (`scripts/lib/ru-parse.mjs`)

The source is the Royallib HTML: windows-1251, no markup, `<br>` between lines. What the parser relies on:

- a header per hexagram `------No 8. "Би". Приближение`, then six rows of `_________` (yang) / `___ ___` (yin), top row first;
- a verdict (the classic words) at the end of the explanation of the whole figure: it starts after the last colon; `scripts/overrides.ru.json` can
  say where it starts when the rule is not enough (`judgmentFrom`), and where the closing remark of hexagram 2 starts (`useAllFrom`);
- six paragraphs after lines that hold only a digit 1…6; each ends with the classic words of the line, which begin with a fixed phrase;
- a short lead-in sentence ("Поэтому в тексте сказано:") is cut off, a long one stays in the commentary.

Defects of the source file (found by the cross-check, each one pinned in `tests/ru-parse.test.ts`):

| Where | What |
|---|---|
| hexagrams 29 and 30 | stand in the opposite order; the parser goes by the number in the header |
| hexagram 9, line 2 | the file gives only «Сильная черта на втором месте.» and no words after it; the pack has an empty `text` there (the interface shows the commentary only) |
| drawings of 21, 22, 23, 24, 25, 55 | typed wrongly (21 and 22, 23 and 24 are swapped; 25 has a stray row; 55 shows 54); the names and the texts are right; our table of facts is the authority |
| drawings of 25 and 26 | seven rows instead of six |
| "Резюме" | only in hexagram 1; in hexagram 2 the closing remark sits at the end of the sixth line |

## English: James Legge (`scripts/lib/en-parse.mjs`)

sacred-texts.com is behind Cloudflare and refuses scripts, so the pages were opened in the browser by hand and their text saved as
`sources/legge/text-NN.txt` (the Text, hexagrams 1…64, `##### N` before each) and `sources/legge/image.txt` (the Great Symbolism, Appendix II).
The OCR of the same book from archive.org (`sources/legge/sbe16-archive-org.txt`) was downloaded as a fallback and is not used.

- the heading `XIII. THE THUNG ZĂN HEXAGRAM` gives the transliteration; the verdict is the paragraph before the lines;
- the six line paragraphs are taken **by position** (the transcription has a missing "3.", "S." for "5.", "2 ."), and each one is checked to name its
  own place ("the second", "the topmost"…), so a slip of positions raises a warning;
- a page number `p. 58` can fall in the middle of a sentence: what goes on after it is joined to the paragraph before;
- the small typos of the transcription are mended by a table (`TYPOS`);
- the English names of the hexagrams (`scripts/lib/names.en.mjs`) are ours, from the meaning of the Chinese name.

## The table of facts and the CSV

`src/data/hexagrams.ts` (the King Wen number, the two trigrams, the Chinese name and pinyin) is checked against `sources/wilhelm-oracle.csv`
(`tests/oracle.test.ts`, skipped when the file is absent). Result: the glyph, the figure, the name, the pinyin and the "inverse" agree for all 64.
The one disagreement is a mistake in the CSV: for hexagram 23 it gives fire as the lower trigram, while its own binary column says earth.
