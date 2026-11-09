import type { Coin, Coins } from '../src/core/cast';
import { TableStage } from '../src/scene/TableStage';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const stage = new TableStage($('stage'));
(window as unknown as { __stage: TableStage }).__stage = stage;

const sides = (): Coins => [0, 1, 2].map((k) => Number($<HTMLSelectElement>(`c${k}`).value) as Coin) as unknown as Coins;

function judge(wanted: readonly Coin[]): { ok: boolean; text: string } {
    const got = stage.upSides();
    const ok = wanted.every((side, k) => got[k] === side);
    return { ok, text: `wanted ${wanted.join(' ')}, the scene shows ${got.map((s) => s ?? '?').join(' ')}` };
}

async function toss(): Promise<boolean> {
    const wanted = sides();
    await stage.toss(wanted);
    const verdict = judge(wanted);
    $('verdict').innerHTML = `<span class="${verdict.ok ? 'ok' : 'bad'}">${verdict.ok ? 'OK' : 'WRONG'}</span> ${verdict.text}`;
    return verdict.ok;
}

$('toss').addEventListener('click', () => void toss());
$('reset').addEventListener('click', () => stage.reset());
$<HTMLInputElement>('speed').addEventListener('input', (event) => {
    stage.speed = Number((event.target as HTMLInputElement).value);
    $('speedOut').textContent = String(stage.speed);
});
$<HTMLInputElement>('turns').addEventListener('input', (event) => {
    const value = Number((event.target as HTMLInputElement).value);
    if (value > 0) stage.turns = value;
});
$('slow').addEventListener('click', () => {
    stage.speed = 0.1;
    $<HTMLInputElement>('speed').value = '0.1';
    $('speedOut').textContent = '0.1';
});
// With the speed at 0 the time stands still: one button moves it by one frame at a time, to look at the seams between the phases.
$('frame').addEventListener('click', () => {
    const was = stage.speed;
    stage.speed = 1;
    stage.step(1 / 60);
    stage.speed = was;
});

$('all').addEventListener('click', async () => {
    const was = stage.speed;
    stage.speed = 12;
    const table = $('results');
    table.innerHTML = '<tr><th>Wanted</th><th>Run 1</th><th>Run 2</th><th>Run 3</th></tr>';
    let wrong = 0;
    for (let n = 0; n < 8; n++) {
        const wanted: Coins = [(n & 1 ? 2 : 3) as Coin, (n & 2 ? 2 : 3) as Coin, (n & 4 ? 2 : 3) as Coin];
        const cells: string[] = [];
        for (let run = 0; run < 3; run++) {
            await stage.toss(wanted);
            const verdict = judge(wanted);
            if (!verdict.ok) wrong++;
            cells.push(`<td class="${verdict.ok ? 'ok' : 'bad'}">${verdict.ok ? 'OK' : verdict.text}</td>`);
        }
        table.insertAdjacentHTML('beforeend', `<tr><td>${wanted.join(' ')}</td>${cells.join('')}</tr>`);
    }
    stage.speed = was;
    $('verdict').innerHTML = wrong ? `<span class="bad">${wrong} of 24 tosses are wrong</span>` : '<span class="ok">All 24 tosses landed on the wanted sides.</span>';
});
