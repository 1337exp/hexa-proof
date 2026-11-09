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
 * One face of the coin: the painted picture, and over it the marks that say which side it is: a solid bar for the yang, a broken one
 * for the yin, above and below the hole. The picture is drawn when it has loaded (the texture is updated then, and `onReady` is called).
 * The texture covers the square that holds the disc, so the marks sit where the geometry puts them.
 * Одна сторона монеты: нарисованная картинка и поверх неё знак стороны: сплошная черта для ян, прерывистая для инь, над отверстием и под ним.
 * Картинка дорисовывается, когда загрузится. Текстура накрывает квадрат вокруг диска, так что знаки встают туда, куда их ставит геометрия.
 */
export function coinFaceTexture(url: string, side: Coin, onReady?: () => void): CanvasTexture {
    // The coins are small on the screen: the picture and the canvas are 256 px, which the eye does not tell from more (128 px was too greedy).
    // Монеты на экране мелкие: картинка и холст по 256 px, большего глаз не отличит (128 px было жадно).
    const size = 256;
    const [element, g] = canvas(size);
    g.fillStyle = '#4a3a24';
    g.fillRect(0, 0, size, size);
    const result = texture(element);
    // the geometry's UV are the plain x, y of the shape, from −R to R
    result.repeat.set(0.5, 0.5);
    result.offset.set(0.5, 0.5);

    const image = new Image();
    image.onload = () => {
        g.drawImage(image, 0, 0, size, size);
        drawMarks(g, size, side);
        result.needsUpdate = true;
        onReady?.();
    };
    image.src = url;
    return result;
}

/** The marks of a side, drawn big and dark on a light edge, so that they can be read from the far end of the table. / Знаки стороны, крупные и тёмные на светлой кайме, чтобы читались с дальнего края стола. */
function drawMarks(g: CanvasRenderingContext2D, size: number, side: Coin): void {
    const c = size / 2;
    const barH = size * 0.085;
    const half = size * 0.25;
    for (const y of [size * 0.19, size * 0.81]) {
        const pieces: [number, number][] = side === 3 ? [[c - half, half * 2]] : [[c - half, half * 0.84], [c + half * 0.16, half * 0.84]];
        for (const [x, w] of pieces) {
            g.fillStyle = 'rgba(14,8,3,0.88)';
            g.strokeStyle = 'rgba(244,206,140,0.95)';
            g.lineWidth = size * 0.01;
            g.beginPath();
            g.roundRect(x, y - barH / 2, w, barH, barH * 0.25);
            g.fill();
            g.stroke();
        }
    }
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
