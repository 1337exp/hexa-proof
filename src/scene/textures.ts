import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Coin } from '../core/cast';

/**
 * Everything is drawn with code on a canvas: no picture files. A small deterministic noise keeps the look the same on every run.
 * Всё рисуется кодом на холсте: никаких файлов с картинками. Небольшой детерминированный шум держит вид одинаковым при каждом запуске.
 */

function noise(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const element = document.createElement('canvas');
    element.width = size;
    element.height = size;
    const context = element.getContext('2d');
    if (!context) throw new Error('A 2D canvas is not available');
    return [element, context];
}

function texture(element: HTMLCanvasElement, repeat = false): CanvasTexture {
    const result = new CanvasTexture(element);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 8;
    if (repeat) result.wrapS = result.wrapT = RepeatWrapping;
    return result;
}

/**
 * One face of the coin. The texture covers the square that holds the disc (the shape goes from −1 to 1), so the marks sit where the geometry puts them.
 * Одна сторона монеты. Текстура накрывает квадрат вокруг диска (форма идёт от −1 до 1), так что знаки встают туда, куда их ставит геометрия.
 */
export function coinFaceTexture(side: Coin): CanvasTexture {
    const size = 512;
    const [element, g] = canvas(size);
    const random = noise(side === 3 ? 31 : 22);

    const metal = g.createRadialGradient(size * 0.4, size * 0.34, size * 0.05, size / 2, size / 2, size * 0.55);
    metal.addColorStop(0, '#e0a971');
    metal.addColorStop(0.55, '#b87333');
    metal.addColorStop(1, '#7a4a1d');
    g.fillStyle = metal;
    g.fillRect(0, 0, size, size);

    // patina and wear: soft dark and green-grey blotches, then fine grain
    for (let i = 0; i < 260; i++) {
        const x = random() * size;
        const y = random() * size;
        const r = 4 + random() * 26;
        const spot = g.createRadialGradient(x, y, 0, x, y, r);
        const green = random() < 0.25;
        spot.addColorStop(0, green ? 'rgba(70,110,92,0.16)' : 'rgba(40,20,8,0.17)');
        spot.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = spot;
        g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 9000; i++) {
        g.fillStyle = random() < 0.5 ? 'rgba(255,225,180,0.07)' : 'rgba(30,14,4,0.09)';
        g.fillRect(random() * size, random() * size, 1.5, 1.5);
    }

    // the raised rim, a ring just inside the edge
    const c = size / 2;
    g.lineWidth = size * 0.026;
    g.strokeStyle = 'rgba(70,38,12,0.75)';
    g.beginPath();
    g.arc(c, c, size * 0.43, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = size * 0.01;
    g.strokeStyle = 'rgba(240,200,150,0.35)';
    g.beginPath();
    g.arc(c, c, size * 0.452, 0, Math.PI * 2);
    g.stroke();

    // the marks: a solid bar for the yang, a broken one for the yin, above and below the hole
    g.fillStyle = 'rgba(58,30,10,0.9)';
    const barH = size * 0.05;
    const half = size * 0.19;
    for (const y of [size * 0.215, size * 0.785]) {
        if (side === 3) g.fillRect(c - half, y - barH / 2, half * 2, barH);
        else {
            g.fillRect(c - half, y - barH / 2, half * 0.82, barH);
            g.fillRect(c + half * 0.18, y - barH / 2, half * 0.82, barH);
        }
    }

    const result = texture(element);
    // the geometry's UV are the plain x, y of the shape, from −R to R
    result.repeat.set(0.5, 0.5);
    result.offset.set(0.5, 0.5);
    return result;
}

/** The rim of the coin and its bump: a darker, rougher metal. / Ребро монеты: более тёмный и грубый металл. */
export function rimTexture(): CanvasTexture {
    const [element, g] = canvas(64);
    g.fillStyle = '#6e4318';
    g.fillRect(0, 0, 64, 64);
    const random = noise(5);
    for (let i = 0; i < 400; i++) {
        g.fillStyle = random() < 0.5 ? 'rgba(220,170,110,0.25)' : 'rgba(20,8,0,0.3)';
        g.fillRect(random() * 64, random() * 64, 2, 2);
    }
    return texture(element, true);
}

/** A thin bright ring that fades to both sides: the shock wave on the felt. / Тонкое светлое кольцо, тающее в обе стороны: ударная волна на войлоке. */
export function ringTexture(): CanvasTexture {
    const size = 256;
    const [element, g] = canvas(size);
    const c = size / 2;
    const ring = g.createRadialGradient(c, c, size * 0.2, c, c, size * 0.5);
    ring.addColorStop(0, 'rgba(255,255,255,0)');
    ring.addColorStop(0.55, 'rgba(255,255,255,0)');
    ring.addColorStop(0.82, 'rgba(255,255,255,1)');
    ring.addColorStop(0.94, 'rgba(255,255,255,0.25)');
    ring.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = ring;
    g.fillRect(0, 0, size, size);
    return texture(element);
}
