import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// The laboratory (lab/*.html) is served by the dev server only: the build starts from index.html.
// Лаборатория (lab/*.html) есть только в dev-сервере: сборка идёт от index.html.
export default defineConfig({
    // Relative, so the build works from any folder: GitHub Pages under /repo/, or a static host.
    // Относительный путь: сборка работает из любой папки.
    base: './',
    plugins: [vue()],
    build: { sourcemap: true },
});
