# The mutation check of the core

`scripts/mutations.core.json` breaks the logic of `src/core` in 20 places, one at a time, in a copy of the project (the cast, the changing lines, the
numbering, the trigrams, the rules of Zhu Xi, the chances of the coins). A mutant that survives means a test is too weak. Run it with the helper from our
base: `node <base>/snippets/mutate.mjs . scripts/mutations.core.json`. 2026-11-09: all 20 are caught.

Ломающая проверка ядра: `scripts/mutations.core.json` портит логику `src/core` в 20 местах, по одному, в копии проекта. Выживший мутант значит слабый тест.
Запуск: `node <база>/snippets/mutate.mjs . scripts/mutations.core.json`. 2026-11-09: пойманы все 20.
