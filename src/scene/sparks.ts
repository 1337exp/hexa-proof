import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three';
import { mulberry32 } from '@1337exp/pkt-threejs-blueprint/rng';

/**
 * Soft sparks that rise from the front edge of the table and fade: warm specks of light, like the sparks over a lamp.
 *
 * It costs almost nothing. It is one `Points` object (one draw call) of a few dozen vertices, and the vertex shader finds where every speck is
 * from a single number, the time: there is no array that the code updates and no buffer that is uploaded again, the CPU only writes one uniform per
 * frame. The speck is a soft disc drawn in the fragment shader (no texture), blended additively.
 *
 * Мягкие искорки поднимаются от ближнего края стола и гаснут: тёплые точки света, как искры над лампой.
 * Почти ничего не стоит. Это один объект `Points` (один вызов отрисовки) из нескольких десятков вершин, а положение каждой искры вертексный
 * шейдер находит по одному числу, времени: нет массива, который код обновляет, и буфера, который заново грузится, процессор пишет за кадр один uniform.
 * Искра это мягкий диск из фрагментного шейдера (без текстуры), с аддитивным смешиванием.
 */
export interface Sparks {
    readonly points: Points;
    /** `time` in seconds, `opacity` 0…1 (0 hides the sparks and draws nothing), `pixelRatio` of the renderer. / Время, прозрачность, плотность пикселей. */
    update(time: number, opacity: number, pixelRatio: number): void;
    dispose(): void;
}

/** The area they rise from, on the table: wide, and nearer to the viewer than the coins. / Откуда поднимаются: по ширине стола, ближе к зрителю, чем монеты. */
const AREA = { x: 7.5, zNear: 5.2, zFar: 1.2 };

const VERTEX = /* glsl */ `
    attribute vec4 aSeed; // x: the share across, y: the share in depth, z: the phase, w: the life in seconds
    uniform float uTime;
    uniform float uSize;
    uniform float uPixelRatio;
    uniform float uOpacity;
    varying float vAlpha;

    void main() {
        float age = fract(uTime / aSeed.w + aSeed.z);
        vec3 p = position;
        p.y = age * (0.9 + 1.5 * aSeed.y);               // up
        p.x += sin(uTime * 0.8 + aSeed.z * 6.2831) * 0.2; // a slow sway
        p.z -= age * 0.5;                                 // and a little away from the viewer
        float fade = smoothstep(0.0, 0.18, age) * (1.0 - smoothstep(0.55, 1.0, age));
        float flicker = 0.75 + 0.25 * sin(uTime * 6.0 + aSeed.z * 40.0);
        vAlpha = fade * flicker * uOpacity;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uPixelRatio * (0.55 + 0.9 * aSeed.x) / max(0.5, -mv.z);
        gl_Position = projectionMatrix * mv;
    }
`;

const FRAGMENT = /* glsl */ `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float disc = 1.0 - smoothstep(0.0, 1.0, d);
        float a = disc * disc * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor * a * 1.8, a);
    }
`;

export function createSparks(count = 64, seed = 20261109): Sparks {
    const random = mulberry32(seed);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
        const across = random();
        const depth = random();
        positions[i * 3] = (across * 2 - 1) * AREA.x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = AREA.zFar + (AREA.zNear - AREA.zFar) * Math.sqrt(depth); // more of them near the viewer
        seeds[i * 4] = random();
        seeds[i * 4 + 1] = random();
        seeds[i * 4 + 2] = random();
        seeds[i * 4 + 3] = 4 + random() * 5;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4));

    const material = new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: 130 },
            uPixelRatio: { value: 1 },
            uOpacity: { value: 1 },
            uColor: { value: new Color('#ffbd66') },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false; // the positions are made in the shader, the box of the geometry would be wrong
    points.renderOrder = 2;

    return {
        points,
        update(time, opacity, pixelRatio) {
            points.visible = opacity > 0.001;
            material.uniforms.uTime!.value = time;
            material.uniforms.uOpacity!.value = opacity;
            material.uniforms.uPixelRatio!.value = pixelRatio;
        },
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}
