# Third-party notices / Сторонние материалы

The code of this project is MIT (see `LICENSE`). The books below are not part of that licence.
Код проекта под MIT (`LICENSE`). Книги ниже в эту лицензию не входят.

## James Legge, *The Yî King* (1882)

- Source / Источник: *The Sacred Books of the East*, vol. 16, Oxford, Clarendon Press, 1882. The English pack (`src/data/texts/en.json`) is made from it.
- Status: public domain (the translator died in 1897). The text was copied by hand from the pages of the Internet Sacred Text Archive ([sacred-texts.com](https://sacred-texts.com/book/the-i-ching)); the obvious typos of that transcription are mended by a table in `scripts/lib/en-parse.mjs`.
- What is used: the Text (the verdict and the six lines of every hexagram, and the closing paragraph of hexagrams 1 and 2) and the Great Symbolism of Appendix II (the image).
- What is not: the footnotes, the introduction, the Thwan (Appendix I) and the small symbolism of the lines (Appendix II): not yet.

## Ю. К. Щуцкий, «Китайская классическая Книга перемен»

- Source / Источник: the text of the book from the Royallib library (the file is kept only on our machines, in `sources/`). The Russian pack (`src/data/texts/ru.json`) is made from it.
- Status: **in the public domain from 1 January 2027; do not publish before that date.** Yu. K. Shchutsky was shot on 18 February 1938 and rehabilitated after his death in 1956. Under Russian law (art. 1281 of the Civil Code) the term of protection of a repressed and posthumously rehabilitated author runs 70 years from 1 January of the year after the rehabilitation, i.e. from 1 January 1957, and ends on 31 December 2026. Until then the repository stays private (the pack is committed locally only). This is our reading of the law, not legal advice.
- Статус: **общественное достояние с 1 января 2027; до этой даты не публиковать.** Щуцкий расстрелян 18 февраля 1938, реабилитирован посмертно в 1956. По ст. 1281 ГК РФ срок охраны репрессированного и посмертно реабилитированного автора идёт 70 лет с 1 января года, следующего за годом реабилитации, то есть с 1 января 1957, и кончается 31 декабря 2026. До тех пор репозиторий остаётся закрытым (пакет лежит только в локальном коммите). Это наше прочтение закона, не юридическая консультация.
- Defects of the file are listed in `docs/texts.md`. **The pack changes the words of the author in five places** (62 verdict, lines 40.2, 54.1, 64.5 and the empty 9.2), after the Chinese original and Legge; each place carries a `note` that the application shows. Everything else is the author's text, only cut into parts.

## Roboto

- Source: the package `@fontsource-variable/roboto` 5.3.0, the variable font (weight 100–900), Latin and Cyrillic subsets, normal and italic, in `src/assets/font`.
- Licence: SIL Open Font License 1.1, the text is in `src/assets/font/LICENSE.txt`. The files are unchanged.
- Шрифт Roboto (переменный, латиница и кириллица), лицензия SIL OFL 1.1, файлы без изменений; взяты из проекта next-up.

## Sounds / Звуки

- `src/assets/sound/taiko.mp3`: a stroke of a taiko drum (the file was named `_Taiko_Drum_Sticks-2.mp3`); played when the golden glow starts.
- `src/assets/sound/coin-flip.mp3`: a coin flip (the file was named `_Coin_flip.mp3`); played when the coins are thrown.
- Both were found by the author of the project as royalty-free sounds and are used unchanged. **The source and the licence terms are still to be written here before the public release.**
- Оба звука нашёл автор проекта как бесплатные для использования; файлы не менялись. **Источник и условия лицензии нужно вписать сюда до публикации.**

## Not used / Не используем

`iching_wilhelm_translation.csv` (the English text of Cary F. Baynes after Richard Wilhelm, 1950, still under copyright, whatever the licence note on the CSV says) is kept only on our machines for a check of the table of facts and does not enter the product.
Английский CSV (перевод Бейнс по Вильгельму, 1950, права действуют) лежит только у нас для сверки таблицы фактов и в продукт не входит.
