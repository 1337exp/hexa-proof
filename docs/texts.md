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
| hexagram 9, line 2 | the file gives only «Сильная черта на втором месте.» and no words after it. The parser still finds it empty (pinned in `tests/ru-parse.test.ts`), but **the pack is filled by us** (`fills` in `scripts/overrides.ru.json`): «Тебя влекут к возвращению на собственный путь. Счастье.», made from the Chinese 牽復，吉 and Legge, in the manner of Shchutsky, with a `note` that says so |
| drawings of 21, 22, 23, 24, 25, 55 | typed wrongly (21 and 22, 23 and 24 are swapped; 25 has a stray row; 55 shows 54); the names and the texts are right; our table of facts is the authority |
| drawings of 25 and 26 | seven rows instead of six |
| labels of 30.1, 42.1, 42.6, 61.6 | «слабая черта» where the line is solid (the words of the line, Legge and our table of facts agree; only the label is a typo of the source); mended by `labels` in `scripts/overrides.ru.json`, found by `tests/texts.test.ts` (labels against the table of facts) |
| judgments of 9, 19, 51 | the verdict has a colon inside («...: они — с нашей западной окраины»), and the cutter took the part after the last colon only; mended by `judgmentFrom` in `scripts/overrides.ru.json` |
| judgment of 62 | «Не следует подыматься. Следует подыматься. Следует опускаться.»: a sentence too many in the source (the Chinese: do not ascend, descend). **Kept as the author has it**, pinned by a test; to be decided by a person |
| lines 40.2 and 64.5 | the source says «Стойкость - к сожалению» and «Стойкость - к несчастью», where the line (Legge, and the next words of 64.5 «будет и счастье») says good fortune. **Kept as the author has it**, pinned by a test; to be decided by a person |
| 54.1: MENDED (2026-11-09) | found by the review of the fortune words of all 448 passages (Grok, `docs/review-grok-fortune-2026-11-09.md`) and checked: the Chinese 歸妹初九 ends in 征吉, Legge «fortunate», the source «Поход - к несчастью» (the 征凶 of the verdict of the hexagram). Mended by `fixes`, with a `note` |
| omissions in the author's words, kept | 33.1 (厲 danger), 35.5 and 49.2 (往吉 / 征吉), 53.3 (利禦寇), 57.5 (the closing 吉), 62.4 (无咎): Shchutsky leaves a part of the formula out; the source has exactly these words, the meaning is not reversed, nothing is added in his name. 9.2 is empty in the source. 34.3, 36.3, 60 and a few more are readings of the author that differ from Legge, not reversals |
| 62, 40.2, 64.5: MENDED (2026-11-09) | checked against the Chinese original (zh.wikisource.org 周易: 小過 «不宜上宜下，大吉», 解 九二 «貞吉», 未濟 六五 «貞吉，无悔…吉») and Legge: the Russian was mended by `fixes` in `scripts/overrides.ru.json` and each place carries a `note` that tells the reader. 40.3 (貞吝) is right and stays. The checks below were made before this. |
| 62, 40.2, 64.5: checked against a second copy | 2026-11-09: the other digitisation (thelib.ru, a different copy from Royallib) has the same words in all three places: «Не следует подыматься. Следует подыматься. Следует опускаться.», «Стойкость - к сожалению», «Стойкость - к несчастью». So the claim that «the real Shchutsky has it otherwise» is not supported by the sources it quoted; either the printed book has these places, or both copies come from one source. The Chinese says otherwise in all three (不宜上，宜下; 貞吉; 貞吉，无悔) and so does Legge |
| lead-in before the classic words | the cutter took a closing quote («Книга Перемен») for the end of a sentence and left 20 comments ending in the middle of a phrase; the end of a sentence is now `. ! ?` |
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
- the transcription errors found by the review are mended by `TYPOS` (4.2, 37.1, 47.4) and the name of the 27th hexagram gets its circumflex (`Î`).

## The table of facts and the CSV

`src/data/hexagrams.ts` (the King Wen number, the two trigrams, the Chinese name and pinyin) is checked against `sources/wilhelm-oracle.csv`
(`tests/oracle.test.ts`, skipped when the file is absent). Result: the glyph, the figure, the name, the pinyin and the "inverse" agree for all 64.
The one disagreement is a mistake in the CSV: for hexagram 23 it gives fire as the lower trigram, while its own binary column says earth.
