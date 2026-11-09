#!/usr/bin/env node
/**
 * Screenshots of the app for the README (both languages share the same files).
 *
 *   npm run screenshot                                         starts its own dev server on a spare port
 *   SCREENSHOT_URL=http://localhost:5173 npm run screenshot    use a server that is already running
 *   SCREENSHOT_SEED=3 npm run screenshot                       another cast (the default seed is fixed)
 *
 * Needs Chrome or Edge installed (driven through playwright-core, nothing is downloaded).
 * Output: docs/media/*.png.
 *
 * The cast is fixed by replacing `crypto.getRandomValues` with a seeded generator in the page of the screenshot only:
 * the app itself always draws from the system source, and the shots are the same on every run.
 * Бросок фиксируется подменой `crypto.getRandomValues` на засеянный генератор только на странице скриншота:
 * само приложение всегда берёт системный источник, а кадры одинаковы при каждом запуске.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const PORT = 5196;
const SEED = Number(process.env.SCREENSHOT_SEED ?? 11);
const QUESTION = 'Should I take the new job?';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'media');
mkdirSync(OUT, { recursive: true });

async function waitFor(url, ms = 30000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        try {
            if ((await fetch(url)).ok) return;
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(`The dev server did not come up at ${url}`);
}

async function startServer() {
    if (process.env.SCREENSHOT_URL) return { url: process.env.SCREENSHOT_URL, stop() {} };
    const vite = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
    const child = spawn(process.execPath, [vite, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
    const url = `http://localhost:${PORT}`;
    await waitFor(url);
    return { url, stop: () => child.kill() };
}

async function launch() {
    for (const channel of ['chrome', 'msedge']) {
        try {
            return await chromium.launch({ channel, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
        } catch {
            // try the next one
        }
    }
    throw new Error('Neither Chrome nor Edge could be launched');
}

/** Runs in the page: the same numbers on every run. / Выполняется на странице: те же числа при каждом запуске. */
function seedCrypto(seed) {
    let s = seed;
    const next = () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return (t ^ (t >>> 14)) >>> 0;
    };
    crypto.getRandomValues = (array) => {
        for (let i = 0; i < array.length; i++) array[i] = next();
        return array;
    };
}

const server = await startServer();
const browser = await launch();
try {
    const shot = async (page, name) => {
        await page.screenshot({ path: join(OUT, `${name}.png`) });
        console.log(`docs/media/${name}.png`);
    };

    /** A fresh page: clean storage, English, dark, the cast fixed. */
    const open = async (options) => {
        const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: 'dark', locale: 'en-US', ...options });
        const page = await context.newPage();
        await page.addInitScript(() => localStorage.clear());
        await page.addInitScript(seedCrypto, SEED);
        await page.goto(server.url);
        await page.locator('.coin-table canvas').waitFor();
        await page.waitForTimeout(2500); // the textures of the table and the coins
        return page;
    };

    // The phone: the start of a cast, with the finger over the table.
    {
        const page = await open({ viewport: { width: 390, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await shot(page, 'phone');
        await page.context().close();
    }

    // The desktop: a whole cast, the answer, the journal.
    {
        const page = await open({ viewport: { width: 1000, height: 900 } });
        await page.getByLabel('Your question').fill(QUESTION);
        await page.getByRole('button', { name: 'All six at once' }).click();
        await page.getByRole('button', { name: 'Read the answer' }).waitFor({ timeout: 180000 });
        await page.waitForTimeout(3500); // the wave of glow after the sixth throw
        await shot(page, 'table');

        await page.getByRole('button', { name: 'Read the answer' }).click();
        await page.waitForTimeout(800);
        await shot(page, 'reading');

        await page.getByRole('button', { name: 'Save to the journal' }).click();
        await page.getByRole('button', { name: /^Journal/ }).click();
        await page.waitForTimeout(4500); // let the toast go
        await page.setViewportSize({ width: 1000, height: 480 });
        await page.waitForTimeout(300);
        await shot(page, 'journal');
        await page.context().close();
    }
} finally {
    await browser.close();
    server.stop();
}
