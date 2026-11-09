import { startLoop, type Loop } from '@1337exp/pkt-threejs-blueprint/loop';
import { bindResize, createRenderer } from '@1337exp/pkt-threejs-blueprint/renderer';
import { disposeObject } from '@1337exp/pkt-threejs-blueprint/dispose';
import {
    ACESFilmicToneMapping,
    AdditiveBlending,
    AmbientLight,
    Color,
    HemisphereLight,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    PointLight,
    Quaternion,
    Scene,
    ShadowMaterial,
    SRGBColorSpace,
    TextureLoader,
    SpotLight,
    Vector2,
    Vector3,
    type Texture,
    type WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { Coin, Coins } from '../core/cast';
import { createCoinGeometry } from './coinGeometry';
import coinBackUrl from './assets/coin_back.webp';
import coinFrontUrl from './assets/coin_front.webp';
import tableUrl from './assets/table.webp';
import { coinFaceTexture, rimTexture, ringTexture } from './textures';
import { COIN_THICKNESS, flatQuaternion, newPose, planToss, upSide, yawOf, type CoinPose, type TossPlan } from './tossPlan';

/**
 * The table: dark lacquer, a felt mat, a warm lamp and three bronze coins. It knows nothing of the oracle: it is told which side each coin
 * must fall on, plays the toss, and says when the coins lie still.
 * Стол: тёмный лак, войлочный коврик, тёплая лампа и три бронзовые монеты. Об оракуле он ничего не знает: ему говорят, на какую сторону
 * должна лечь каждая монета, он разыгрывает бросок и сообщает, когда монеты замерли.
 */

/** Where the three coins of a throw fall: a small triangle in the middle of the felt. / Куда падают три монеты броска: маленький треугольник посередине. */
const LANDING = [new Vector3(-1.1, 0, -0.9), new Vector3(1.1, 0, -0.9), new Vector3(0, 0, 1.05)];
/** Where the coins of a throw appear: in front, at the edge of the felt. / Где появляются монеты броска: впереди, у края войлока. */
const HOME = [new Vector3(-1.5, 0, 3.2), new Vector3(0, 0, 3.4), new Vector3(1.5, 0, 3.2)];
/** A throw leaves a column of three small coins, one under another; the columns stand three on the left and three on the right. / Бросок оставляет столбик из трёх маленьких монет. */
const PARK_SCALE = 0.66;
const COLUMN_Z = [-1.45, 0.05, 1.55];
const COLUMN_X = [2.75, 4.15, 5.55]; // from the middle outwards; the first throw goes to the outermost place
/** The coins of six throws. / Монеты шести бросков. */
const THROWS = 6;

/**
 * How the columns are set: 'alternate' goes left, right, left, right… from the outer edge in; 'trigrams' puts the lines 1–3 on the left
 * (the lower trigram, left to right) and the lines 4–6 on the right (the upper trigram, left to right).
 * Как расставлять столбики: 'alternate' — влево, вправо, влево… от края к середине; 'trigrams' — линии 1–3 слева (нижняя триграмма),
 * линии 4–6 справа (верхняя триграмма), обе слева направо.
 */
export type ColumnLayout = 'alternate' | 'trigrams';

/** The place of the column of a throw. / Место столбика броска. */
export function columnX(throwIndex: number, layout: ColumnLayout = 'alternate'): number {
    if (layout === 'trigrams') return throwIndex < 3 ? -COLUMN_X[2 - throwIndex]! : COLUMN_X[throwIndex - 3]!;
    const side = throwIndex % 2 === 0 ? -1 : 1;
    return side * COLUMN_X[COLUMN_X.length - 1 - (throwIndex >> 1)]!;
}

interface Slide {
    time: number;
    from: Vector3;
    to: Vector3;
}

interface CoinState {
    mesh: Mesh;
    side: Coin;
    yaw: number;
    plan: TossPlan | null;
    time: number;
    pose: CoinPose;
    /** Where the coin goes after the hit, and the slide on the way. / Куда монета идёт после удара, и сам сдвиг. */
    park: Vector3 | null;
    slide: Slide | null;
    /** The faces of this coin: their glow is its own. / Стороны этой монеты: свечение у каждой своё. */
    faces: MeshStandardMaterial[];
    /** When the wave of glow reaches this coin, in seconds from its start. / Когда до этой монеты доходит волна свечения. */
    glowDelay: number;
    /** The coin grows out of nothing in the first moments, so that it does not pop into view. / Монета вырастает из нуля, чтобы не возникать рывком. */
    appear: number;
}

/**
 * The knobs of the look, read every frame: the laboratory turns them with sliders, the application keeps the defaults.
 * Ручки вида, читаются каждый кадр: лаборатория крутит их ползунками, приложение держит значения по умолчанию.
 */
export interface StageTuning {
    lamp: number;
    exposure: number;
    vignette: number;
    vignetteSoftness: number;
    bloomStrength: number;
    bloomThreshold: number;
    bloomRadius: number;
    glowPower: number;
    glowPulse: number;
    glowWave: number;
    shake: number;
    flash: number;
    ring: number;
}

export const DEFAULT_TUNING: Readonly<StageTuning> = {
    lamp: 150,
    exposure: 0.95,
    vignette: 0.5,
    vignetteSoftness: 0.62,
    bloomStrength: 0.55,
    bloomThreshold: 0.5,
    bloomRadius: 0.1,
    glowPower: 5,
    glowPulse: 1.5,
    glowWave: 0.95,
    shake: 0,
    flash: 0.2,
    ring: 0.8,
};

export interface TableStageOptions {
    /** Called when the person presses on the table. / Зовётся, когда человек нажимает на стол. */
    onActivate?: () => void;
    /** Called when the golden glow starts to run over the coins: for the sound. / Зовётся, когда золотое свечение побежало по монетам: для звука. */
    onGlow?: () => void;
}

export class TableStage {
    /** The speed of the time of the toss: 1 is real time, 0 stops it (for the laboratory). / Скорость времени броска. */
    speed = 1.5;

    /** Full turns of the coins in the air; the look of the toss can be tuned with it. / Полных оборотов монет в воздухе. */
    turns = 2;

    /** The knobs of the look. / Ручки вида. */
    readonly tuning: StageTuning = { ...DEFAULT_TUNING };

    /** Where the columns of the six throws stand. / Где стоят столбики шести бросков. */
    columnLayout: ColumnLayout = 'trigrams';

    private readonly renderer: WebGLRenderer;
    private readonly scene = new Scene();
    private readonly camera = new PerspectiveCamera(34, 1, 0.1, 80);
    private readonly coins: CoinState[] = [];
    private readonly loop: Loop;
    private readonly unbind: () => void;
    private readonly textures: { dispose(): void }[] = [];
    private pending: { resolve: () => void } | null = null;
    private throwIndex = 0;
    private latest: CoinState[] = [];
    private readonly target = new Vector3(0, 0, 0.45);
    private readonly cameraBase = new Vector3();
    /** The shake of the camera after a hit; it dies away by itself. / Дрожь камеры после удара; сама затухает. */
    private shake = 0;
    private flash!: PointLight;
    private flashLevel = 0;
    private ringMap!: Texture;
    private backdrop: Texture | null = null;
    private composer!: EffectComposer;
    private lamp!: SpotLight;
    private vignettePass!: ShaderPass;
    private bloom!: UnrealBloomPass;
    /** The wave of glow that runs over the coins when the sixth line is down: seconds since it began, or −1. / Волна свечения: секунды от начала или −1. */
    private glowTime = -1;
    private skipGlow = false;
    private aspect = 1.8;
    private readonly waves: { mesh: Mesh<PlaneGeometry, MeshBasicMaterial>; age: number; strength: number }[] = [];

    private readonly onGlow?: () => void;

    constructor(container: HTMLElement, options: TableStageOptions = {}) {
        this.onGlow = options.onGlow;
        this.renderer = createRenderer(container, { antialias: true });
        // The tone mapping is applied to the whole frame, the picture of the table too: it makes the table dark and deep, and that is the look we want.
        // Тонмаппинг ложится на весь кадр, на картинку стола тоже: стол выходит тёмным и глубоким, это нужный нам вид.
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.95;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';

        this.buildScene();
        // the glow: a bloom that is switched on only while the wave runs over the coins
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new Vector2(256, 256), 0, 0.85, 0.35);
        this.bloom.enabled = false;
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
        // the vignette: the corners go dark, as if the table were lit by one lamp in the middle
        this.vignettePass = new ShaderPass({
                uniforms: { tDiffuse: { value: null }, strength: { value: 0.85 }, softness: { value: 0.62 } },
                vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform float strength;
                    uniform float softness;
                    varying vec2 vUv;
                    void main() {
                        vec4 color = texture2D(tDiffuse, vUv);
                        vec2 p = (vUv - 0.5) * vec2(1.25, 1.0);
                        float edge = smoothstep(softness * 0.35, softness * 1.05, length(p));
                        color.rgb *= 1.0 - strength * edge;
                        gl_FragColor = color;
                    }`,
        });
        this.composer.addPass(this.vignettePass);
        this.unbind = bindResize(this.renderer, container, (width, height) => this.layout(width, height), { updateStyle: false });
        if (options.onActivate) this.listenForTap(this.renderer.domElement, options.onActivate);

        this.loop = startLoop((dt) => this.step(dt), { maxDt: 1 / 30 });
    }

    /**
     * A tap on the table, not a touch that begins a scroll. The renderer makes the canvas `touch-action: none` (a finger is for the game),
     * but the table has no gesture of its own, so a finger moving along the page must scroll it: `pan-y` gives that back, and the browser then
     * cancels the pointer. What counts as a tap is a short touch that has hardly moved, and it is counted when the finger or the button is lifted.
     * Касание стола, а не начало прокрутки. Рендерер ставит холсту `touch-action: none` (палец принадлежит игре), но у стола своих жестов нет,
     * поэтому палец, ведущий вдоль страницы, должен её листать: `pan-y` это возвращает, и браузер тогда отменяет указатель. Касанием считается
     * короткое и почти неподвижное, оно засчитывается, когда палец или кнопку отпустили.
     */
    private listenForTap(element: HTMLElement, onTap: () => void): void {
        const SLOP = 10; // px
        const LONGEST = 600; // ms
        // TODO: when @1337exp/pkt-threejs-blueprint 0.1.1 is published, pass `{ touchAction: 'pan-y' }` to createRenderer instead of this line.
        element.style.touchAction = 'pan-y';
        let start: { id: number; x: number; y: number; at: number; moved: boolean } | null = null;
        element.addEventListener('pointerdown', (event) => {
            start = { id: event.pointerId, x: event.clientX, y: event.clientY, at: event.timeStamp, moved: false };
        });
        element.addEventListener('pointermove', (event) => {
            if (start && start.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > SLOP) start.moved = true;
        });
        element.addEventListener('pointerup', (event) => {
            const press = start;
            start = null;
            if (press && press.id === event.pointerId && !press.moved && event.timeStamp - press.at <= LONGEST) onTap();
        });
        element.addEventListener('pointercancel', () => {
            start = null; // the browser took the touch for a scroll
        });
    }

    private buildScene(): void {
        const scene = this.scene;
        scene.background = new Color('#0e0907');

        // soft reflections in the lacquer and the metal, without a picture file
        const pmrem = new PMREMGenerator(this.renderer);
        const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = environment;
        scene.environmentIntensity = 0.3;
        pmrem.dispose();
        this.textures.push(environment);

        scene.add(new AmbientLight('#ffe6c8', 0.12));
        scene.add(new HemisphereLight('#ffd9b0', '#1a0f0a', 0.22));

        // the lamp: warm, from above and a little to the left, with soft shadows
        const lamp = (this.lamp = new SpotLight('#ffcf9a', 150, 40, 0.7, 0.9, 1.6));
        lamp.position.set(-3.5, 9.5, 4.5);
        lamp.target.position.set(0, 0, 0.3);
        lamp.castShadow = true;
        lamp.shadow.mapSize.set(2048, 2048);
        lamp.shadow.bias = -0.0004;
        lamp.shadow.radius = 5;
        scene.add(lamp, lamp.target);

        // a flash over the felt at the moment of a hit, and the ring that runs out from it
        this.flash = new PointLight('#ffb870', 0, 7, 1.6);
        scene.add(this.flash);
        this.ringMap = ringTexture();
        this.textures.push(this.ringMap);

        // The table is a picture: it is the background of the whole frame, and the plane under the coins is invisible, it only takes their shadows.
        // Стол это картинка: она фон всего кадра, а плоскость под монетами невидима и только принимает их тени.
        const ground = new Mesh(new PlaneGeometry(60, 40), new ShadowMaterial({ opacity: 0.6 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        new TextureLoader().loadAsync(tableUrl).then((map) => {
            map.colorSpace = SRGBColorSpace;
            this.backdrop = map;
            this.textures.push(map);
            scene.background = map;
            this.fitBackground();
            this.render();
        });

        const geometry = createCoinGeometry();
        // The two painted faces: the front (the animals and the good wishes) is the yang, the back (the eight trigrams) is the yin; the marks
        // of the side are drawn over each. Swap the two urls to swap the sides.
        // Две нарисованные стороны: лицевая (звери и добрые пожелания) это ян, оборотная (восемь триграмм) это инь; поверх каждой знак стороны.
        const yinMap = coinFaceTexture(coinBackUrl, 2, () => this.render());
        const yangMap = coinFaceTexture(coinFrontUrl, 3, () => this.render());
        const rimMap = rimTexture();
        this.textures.push(yinMap, yangMap, rimMap);
        // the engraving itself glows: the picture is also the map of the light the metal gives
        const face = (map: typeof yinMap) => new MeshStandardMaterial({ map, bumpMap: map, bumpScale: 1.6, metalness: 0.75, roughness: 0.5, emissive: new Color('#ffa850'), emissiveMap: map, emissiveIntensity: 0 });
        const rim = new MeshStandardMaterial({ map: rimMap, metalness: 0.85, roughness: 0.5 });

        for (let index = 0; index < THROWS * 3; index++) {
            const yinFace = face(yinMap);
            const yangFace = face(yangMap);
            const mesh = new Mesh(geometry, [yinFace, yangFace, rim]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.visible = false;
            scene.add(mesh);
            this.coins.push({ mesh, side: 3, yaw: 0, plan: null, time: 0, pose: newPose(), park: null, slide: null, appear: 1, faces: [yinFace, yangFace], glowDelay: 0 });
        }
    }

    private place(state: CoinState, pos: Vector3, quat: Quaternion): void {
        state.mesh.position.copy(pos);
        state.mesh.quaternion.copy(quat);
        state.mesh.scale.set(1, 1, 1);
    }

    /**
     * The hit: a ring runs out over the felt, a flash lights it, the camera shudders. All of it dies away by itself.
     * Удар: по войлоку бежит кольцо, вспыхивает свет, камера вздрагивает. Всё затухает само.
     */
    private impact(at: Vector3, strength: number): void {
        const mesh = new Mesh(
            new PlaneGeometry(1, 1),
            new MeshBasicMaterial({ map: this.ringMap, color: '#ffd08a', transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0 }),
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(at.x, 0.012, at.z);
        this.scene.add(mesh);
        this.waves.push({ mesh, age: 0, strength });
        this.shake = Math.max(this.shake, strength * this.tuning.shake);
        this.flash.position.set(at.x, 1.1, at.z);
        this.flashLevel = Math.max(this.flashLevel, strength * this.tuning.flash);
    }

    /**
     * The wave of glow: it runs over the coins from the left to the right, each one flares and goes out, and the bloom follows the brightest.
     * Волна свечения: бежит по монетам слева направо, каждая вспыхивает и гаснет, а bloom идёт за самой яркой.
     */
    private startGlow(): void {
        const xs = this.coins.map((state) => state.mesh.position.x);
        const left = Math.min(...xs);
        const span = Math.max(...xs) - left || 1;
        for (const state of this.coins) state.glowDelay = ((state.mesh.position.x - left) / span) * this.tuning.glowWave;
        this.glowTime = 0;
        this.onGlow?.();
    }

    /** Plays the wave of glow over the coins that lie on the table now (for the laboratory). / Пускает волну по монетам, что лежат на столе. */
    playGlow(): void {
        this.startGlow();
    }

    private applyTuning(): void {
        const t = this.tuning;
        this.lamp.intensity = t.lamp;
        this.renderer.toneMappingExposure = t.exposure;
        this.vignettePass.uniforms.strength!.value = t.vignette;
        this.vignettePass.uniforms.softness!.value = t.vignetteSoftness;
        this.bloom.threshold = t.bloomThreshold;
        this.bloom.radius = t.bloomRadius;
    }

    private animateGlow(dt: number): void {
        if (this.glowTime < 0) return;
        const PULSE = this.tuning.glowPulse;
        this.glowTime += dt;
        let level = 0;
        for (const state of this.coins) {
            const t = this.glowTime - state.glowDelay;
            const pulse = t > 0 && t < PULSE ? Math.sin((Math.PI * t) / PULSE) ** 2 : 0;
            level = Math.max(level, pulse);
            for (const face of state.faces) face.emissiveIntensity = pulse * this.tuning.glowPower;
        }
        this.bloom.strength = level * this.tuning.bloomStrength;
        this.bloom.enabled = level > 0.01;
        if (this.glowTime > this.tuning.glowWave + PULSE + 0.05) {
            this.glowTime = -1;
            this.bloom.enabled = false;
        }
    }

    /** Runs the rings, the flash and the shake by `dt`. / Двигает кольца, вспышку и дрожь на `dt`. */
    private animateEffects(dt: number): void {
        const WAVE_TIME = 0.5;
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const wave = this.waves[i]!;
            wave.age += dt;
            const k = wave.age / WAVE_TIME;
            if (k >= 1) {
                wave.mesh.removeFromParent();
                wave.mesh.geometry.dispose();
                wave.mesh.material.dispose();
                this.waves.splice(i, 1);
                continue;
            }
            wave.mesh.scale.setScalar((1.4 + k * 4.2) * this.tuning.ring);
            wave.mesh.material.opacity = 0.85 * wave.strength * (1 - k) ** 1.6;
        }
        this.flashLevel *= Math.exp(-dt * 11);
        this.flash.intensity = this.flashLevel * 26;
        this.shake *= Math.exp(-dt * 9);
    }

    /** The camera keeps the three coins in view in a wide panel and in a narrow one. / Камера держит три монеты в кадре и в широкой панели, и в узкой. */
    private layout(width: number, height: number): void {
        const aspect = width / Math.max(1, height);
        this.camera.aspect = aspect;
        this.aspect = aspect;
        const tan = Math.tan((this.camera.fov * Math.PI) / 360);
        const distance = Math.max(8.8, 6.45 / (tan * aspect), 5.2 / tan);
        const direction = new Vector3(0, 0.82, 0.57).normalize();
        this.cameraBase.copy(this.target).addScaledVector(direction, distance);
        this.camera.position.copy(this.cameraBase);
        this.camera.lookAt(this.target);
        this.camera.updateProjectionMatrix();
        this.composer.setPixelRatio(this.renderer.getPixelRatio());
        this.composer.setSize(width, height);
        this.fitBackground();
        this.render();
    }

    /** The picture covers the whole frame without being stretched: what does not fit is cut off at the sides or at the top and bottom. / Картинка накрывает весь кадр без растяжения. */
    private fitBackground(): void {
        const map = this.backdrop;
        const image = map?.image as { width: number; height: number } | undefined;
        if (!map || !image) return;
        const picture = image.width / image.height;
        if (this.aspect > picture) {
            map.repeat.set(1, picture / this.aspect);
            map.offset.set(0, (1 - map.repeat.y) / 2);
        } else {
            map.repeat.set(this.aspect / picture, 1);
            map.offset.set((1 - map.repeat.x) / 2, 0);
        }
        map.updateMatrix();
    }

    /**
     * Throws the next three coins so that they fall on the given sides: they fall in the middle, then slide aside into a column
     * (the columns go left, right, left, right…). Resolves when the coins stand in their column. After the sixth throw it starts again.
     * With `instant` the coins are just put where they end up (for a person who asked for less motion). `index` is the number of the throw, 0…5:
     * the table follows the application and does not keep a count of its own.
     * Бросает следующие три монеты так, чтобы они легли на заданные стороны: падают посередине, потом сдвигаются в столбик (влево, вправо…).
     * Завершается, когда монеты встали в столбик. После шестого броска начинает заново. С `instant` монеты просто ставятся на место.
     */
    toss(sides: Coins, options: { instant?: boolean; index?: number } = {}): Promise<void> {
        this.finish();
        if (this.throwIndex >= THROWS) this.reset();
        // the application says which throw this is (0…5): the table must never count for itself, or it can drift away from the cast
        if (options.index !== undefined) this.throwIndex = Math.min(Math.max(Math.trunc(options.index), 0), THROWS - 1);
        const index = this.throwIndex++;
        const group = this.coins.slice(index * 3, index * 3 + 3);
        this.latest = group;
        this.skipGlow = Boolean(options.instant);
        return new Promise((resolve) => {
            this.pending = { resolve };
            group.forEach((state, k) => {
                const to = LANDING[k]!.clone();
                to.x += (Math.random() - 0.5) * 0.3;
                to.z += (Math.random() - 0.5) * 0.3;
                state.side = 3;
                state.yaw = (Math.random() - 0.5) * 2;
                state.mesh.visible = true;
                this.place(state, new Vector3(HOME[k]!.x, COIN_THICKNESS / 2, HOME[k]!.z), flatQuaternion(3, state.yaw));
                state.park = new Vector3(columnX(index, this.columnLayout), (COIN_THICKNESS / 2) * PARK_SCALE, COLUMN_Z[k]!);
                state.plan = planToss(state.mesh.position.clone(), state.side, state.yaw, to, sides[k]!, Math.random, { turns: this.turns });
                state.time = -k * 0.07; // the coins leave one after another
                state.appear = 0;
                state.mesh.scale.setScalar(0.001);
            });
            if (options.instant) {
                for (const state of group) {
                    this.land(state);
                    this.endSlide(state);
                }
                this.completeIfStill();
            }
        });
    }

    /** Puts everything where it was going: ends a toss and the slides at once. / Ставит всё туда, куда шло: сразу заканчивает бросок и сдвиги. */
    private finish(): void {
        for (const state of this.coins) {
            if (state.plan) this.land(state);
            if (state.slide || state.park) this.endSlide(state);
            state.appear = 1;
        }
        this.completeIfStill();
    }

    /** The coin has hit: it stays flat where it fell, and its slide aside begins. / Монета ударилась: лежит плашмя, где упала, и начинается сдвиг. */
    private land(state: CoinState): void {
        const plan = state.plan;
        if (!plan) return;
        this.place(state, plan.final.pos, plan.final.quat);
        state.side = plan.side;
        state.yaw = yawOf(plan.final.quat);
        state.plan = null;
        if (state.park) state.slide = { time: -0.12 - (this.coins.indexOf(state) % 3) * 0.07, from: plan.final.pos.clone(), to: state.park };
    }

    /** Puts the coin in its column at once. / Сразу ставит монету в её столбик. */
    private endSlide(state: CoinState): void {
        if (state.park) {
            state.mesh.position.copy(state.park);
            state.mesh.scale.setScalar(PARK_SCALE);
        }
        state.slide = null;
        state.park = null;
    }

    private completeIfStill(): void {
        if (this.coins.some((state) => state.plan || state.slide)) return;
        const done = this.pending;
        this.pending = null;
        // the sixth line is down: the whole hexagram lies on the table, and a wave of light runs over it
        if (done && this.throwIndex >= THROWS && !this.skipGlow) this.startGlow();
        done?.resolve();
    }

    /** Which side looks up on each coin of the last throw, read from what is on the screen. / Какой стороной вверх лежит каждая монета последнего броска, по тому, что на экране. */
    upSides(): (Coin | null)[] {
        return this.latest.map((state) => upSide(state.mesh.quaternion));
    }

    /** Whether a toss or a slide is going on. / Идёт ли бросок или сдвиг. */
    get tossing(): boolean {
        return this.coins.some((state) => state.plan || state.slide);
    }

    /** Clears the table: no coins, the next throw is the first. / Очищает стол: монет нет, следующий бросок первый. */
    reset(): void {
        this.finish();
        for (const state of this.coins) {
            state.mesh.visible = false;
            state.park = null;
        }
        this.throwIndex = 0;
        this.latest = [];
        this.glowTime = -1;
        this.bloom.enabled = false;
        for (const state of this.coins) for (const face of state.faces) face.emissiveIntensity = 0;
    }

    /** Advances the time by `dt` seconds and draws a frame. The loop calls it; the laboratory calls it by hand to step frame by frame. / Двигает время на `dt` и рисует кадр. */
    step(dt: number): void {
        const scaled = dt * this.speed;
        for (const state of this.coins) {
            if (state.appear < 1) state.appear = Math.min(1, state.appear + scaled / 0.12);
            const slide = state.slide;
            if (slide) {
                slide.time += scaled;
                if (slide.time >= 0.5) this.endSlide(state);
                else if (slide.time > 0) {
                    const k = slide.time / 0.5;
                    const e = k * k * (3 - 2 * k);
                    const size = 1 + (PARK_SCALE - 1) * e;
                    state.mesh.scale.setScalar(size);
                    state.mesh.position.set(slide.from.x + (slide.to.x - slide.from.x) * e, (COIN_THICKNESS / 2) * size, slide.from.z + (slide.to.z - slide.from.z) * e);
                }
                continue;
            }
            const plan = state.plan;
            if (!plan) continue;
            const before = state.time;
            state.time += scaled;
            // the hits that fell between the last frame and this one (even when a long frame skipped over the moment itself)
            for (const hit of plan.impacts) if (hit.time > before && hit.time <= state.time) this.impact(plan.final.pos, hit.intensity);
            if (state.time >= plan.duration) {
                this.land(state);
                continue;
            }
            if (state.time < 0) {
                state.mesh.scale.setScalar(Math.max(0.001, state.appear)); // growing in at the edge of the felt, before it is thrown
                continue;
            }
            plan.sample(state.time, state.pose);
            state.mesh.position.copy(state.pose.pos);
            state.mesh.quaternion.copy(state.pose.quat);
            state.mesh.scale.copy(state.pose.scale).multiplyScalar(state.appear);
        }
        this.animateEffects(dt);
        this.applyTuning();
        this.animateGlow(scaled);
        if (this.pending) this.completeIfStill();
        this.render();
    }

    private render(): void {
        this.camera.position.copy(this.cameraBase);
        if (this.shake > 0.002) {
            const a = this.shake * 0.07;
            this.camera.position.x += (Math.random() - 0.5) * a;
            this.camera.position.y += (Math.random() - 0.5) * a;
        }
        this.composer.render();
    }

    dispose(): void {
        this.loop.stop();
        this.unbind();
        this.finish();
        this.composer.dispose();
        disposeObject(this.scene);
        for (const texture of this.textures) texture.dispose();
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
