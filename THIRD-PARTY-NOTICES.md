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
- Status: **to check before a public release.** Yu. K. Shchutsky was shot in 1938 and rehabilitated after his death; under Russian law the term of protection of a repressed and posthumously rehabilitated author runs 70 years from 1 January of the year after the rehabilitation. The year of the rehabilitation is not confirmed yet (we believe 1956, which would end the protection on 31 December 2026). Until it is checked the Russian pack must not go into a public repository. This is not legal advice.
- Статус: **проверить перед публикацией.** Щуцкий расстрелян в 1938, реабилитирован посмертно; срок охраны у репрессированного и посмертно реабилитированного автора идёт 70 лет с 1 января года, следующего за годом реабилитации. Год реабилитации не подтверждён (считаем, что 1956, тогда охрана кончается 31 декабря 2026). До проверки русский пакет в публичный репозиторий не выкладывать.
- Defects of the file are listed in `docs/texts.md`; the pack corrects none of the words of the author, it only cuts the book into parts.

## Not used / Не используем

`iching_wilhelm_translation.csv` (the English text of Cary F. Baynes after Richard Wilhelm, 1950, still under copyright, whatever the licence note on the CSV says) is kept only on our machines for a check of the table of facts and does not enter the product.
Английский CSV (перевод Бейнс по Вильгельму, 1950, права действуют) лежит только у нас для сверки таблицы фактов и в продукт не входит.
