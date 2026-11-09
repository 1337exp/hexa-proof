import { MathUtils, Quaternion, Vector3 } from 'three';
import type { Coin } from '../core/cast';

/**
 * The toss of one coin as a storyboard, not as physics: the side it falls on is known beforehand, so the coin is led exactly to it.
 * The plan is built from the end: the final pose has the wanted side up, and the spin in the flight is chosen to arrive there
 * (the number of half-turns has the right parity). Same idea as the throw of the die in pkt-dice.
 * Бросок одной монеты как раскадровка, а не физика: сторона, на которую она ляжет, известна заранее, и монету выводят ровно на неё.
 * План строится с конца: в финале нужная сторона сверху, а кручение в полёте подбирается так, чтобы к ней прийти (чётность числа полуоборотов).
 *
 * Phases, the way the cards are slammed in pkt-cards: a throw up with a few turns → the coin hangs flat above its place → it is driven
 * straight down, faster and faster → the hit: the coin is squashed into the felt and springs back once, without any hop or rocking.
 * Фазы, как «вбиваются» карты в pkt-cards: бросок вверх с несколькими оборотами → монета зависает плашмя над своим местом →
 * её вбивают вертикально вниз, всё быстрее → удар: монета сплющивается в войлок и один раз пружинит назад, без прыжков и покачиваний.
 */

/** Radius of the coin and its thickness, in the units of the scene. / Радиус монеты и её толщина в единицах сцены. */
export const COIN_RADIUS = 1;
export const COIN_THICKNESS = 0.14;

/** How deep the coin sinks into the soft felt at the hit at most. / Насколько глубоко монета уходит в мягкий войлок при ударе, не больше. */
export const MAX_SINK = 0.035;

const UP = new Vector3(0, 1, 0);
const FLAT = [new Quaternion(), new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI)] as const;

/** The orientation of a coin that lies flat: side 3 (yang) up is the identity, side 2 (yin) up is turned over. / Монета плашмя. */
export const flatQuaternion = (side: Coin, yaw = 0, out = new Quaternion()): Quaternion =>
    out.setFromAxisAngle(UP, yaw).multiply(FLAT[side === 3 ? 0 : 1]);

/** The heading of a coin that lies flat, read from its orientation (turning the coin over does not change it). / Курс лежащей монеты. */
export function yawOf(quat: Quaternion): number {
    const x = new Vector3(1, 0, 0).applyQuaternion(quat);
    return Math.atan2(-x.z, x.x);
}

/** The side that looks up in this orientation, read from the orientation itself. / Сторона, которая смотрит вверх при этой ориентации. */
export function upSide(quat: Quaternion): Coin | null {
    const ny = new Vector3(0, 1, 0).applyQuaternion(quat).y;
    if (ny > 0.999) return 3;
    if (ny < -0.999) return 2;
    return null;
}

/** How high the centre must be so that the coin, tilted like this, just touches the table. / На какой высоте центр, чтобы наклонённая монета едва касалась стола. */
export function supportHeight(quat: Quaternion): number {
    const ny = Math.abs(new Vector3(0, 1, 0).applyQuaternion(quat).y);
    return COIN_RADIUS * Math.sqrt(Math.max(0, 1 - ny * ny)) + (COIN_THICKNESS / 2) * ny;
}

export interface CoinPose {
    pos: Vector3;
    quat: Quaternion;
    /** The squash of the hit: y is the height of the coin, x and z keep its volume. / Сплющивание от удара. */
    scale: Vector3;
    airborne: boolean;
}

export const newPose = (): CoinPose => ({ pos: new Vector3(), quat: new Quaternion(), scale: new Vector3(1, 1, 1), airborne: false });

export interface Impact {
    time: number;
    /** 1 is the full hit. / 1 — полный удар. */
    intensity: number;
}

export interface TossPlan {
    /** The side that will be up. / Сторона, которая окажется сверху. */
    side: Coin;
    duration: number;
    /** When the coin hits the table. / Когда монета бьётся о стол. */
    landing: number;
    impacts: Impact[];
    final: { pos: Vector3; quat: Quaternion };
    sample(time: number, out?: CoinPose): CoinPose;
}

export interface TossOptions {
    flightTime?: number;
    apex?: number;
    /** Full turns of the spin (a coin may add up to a half-turn more, and the number is bent to land on the wanted side). / Полных оборотов (монета может добавить до полуоборота, число подгоняется под нужную сторону). */
    turns?: number;
}

/** The share of the flight when the coin is at the top: it was drawn up, spinning, and from here it is driven down. / Доля полёта, когда монета наверху: её оттянули вверх, крутя, и отсюда вбивают. */
const APEX_AT = 0.45;
/** The travel over the table ends a little before the hit, so the last part of the fall is straight down. / Путь над столом кончается чуть раньше удара. */
const TRAVEL_END = 0.85;
/** The spin ends just before the hit: the coin comes flat out of the turn, with the speed it has. / Кручение кончается перед ударом. */
const SPIN_END = 0.93;
const SPIN_START = 0;
/** How long the coin springs after the hit. / Сколько монета пружинит после удара. */
const SETTLE_TIME = 0.5;

const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

/**
 * @param from where the coin lies now (the centre)
 * @param startSide the side that is up now
 * @param startYaw the heading it lies at now
 * @param to where it must lie at the end
 * @param side the side that must be up at the end
 */
export function planToss(from: Vector3, startSide: Coin, startYaw: number, to: Vector3, side: Coin, random: () => number = Math.random, options: TossOptions = {}): TossPlan {
    const flightTime = options.flightTime ?? 0.95 + random() * 0.1;
    const apex = options.apex ?? 3.3 + random() * 0.6;
    const rest = COIN_THICKNESS / 2;

    const start = new Vector3(from.x, rest, from.z);
    const end = new Vector3(to.x, rest, to.z);

    // The spin: a horizontal axis at a random heading; the number of half-turns is odd when the side has to change.
    const axisAngle = random() * Math.PI * 2;
    const axis = new Vector3(Math.cos(axisAngle), 0, Math.sin(axisAngle));
    let halfTurns = Math.max(2, Math.round((options.turns ?? 2) * 2)) + Math.floor(random() * 2);
    if ((halfTurns % 2 === 1) !== (startSide !== side)) halfTurns += 1;
    const spin = halfTurns * Math.PI;
    const yawTurn = (random() - 0.5) * 2.4;
    const startFlat = flatQuaternion(startSide, startYaw);

    const qRoll = new Quaternion();
    const qYaw = new Quaternion();
    const quatInFlight = (u: number, out: Quaternion): Quaternion => {
        const progress = easeInOutCubic(MathUtils.clamp((u - SPIN_START) / (SPIN_END - SPIN_START), 0, 1));
        qRoll.setFromAxisAngle(axis, spin * progress);
        qYaw.setFromAxisAngle(UP, yawTurn * progress);
        return out.copy(qYaw).multiply(qRoll).multiply(startFlat);
    };

    // A roll by a half-turn about a horizontal axis also changes the heading of the coin, so the final heading is read from the spin itself.
    const flat = quatInFlight(1, new Quaternion());

    /**
     * The height above the felt in the flight: thrown up, slowing smoothly to the top (the coin is drawn back while it still spins),
     * then from rest at the top driven down, faster and faster. No hanging in the air: the top is a turning point, not a stop.
     * Высота над войлоком: подброс с плавным торможением до вершины (монету оттягивают, пока она крутится), затем с нулевой скорости
     * наверху вбивание, всё быстрее. Без зависания: вершина это точка разворота, а не остановка.
     */
    const heightAt = (u: number): number => {
        if (u < APEX_AT) return apex * Math.sin((Math.PI / 2) * (u / APEX_AT));
        const m = (u - APEX_AT) / (1 - APEX_AT);
        return apex * (1 - m ** 2.2);
    };

    const landing = flightTime;
    const duration = landing + SETTLE_TIME;

    // The squash after the hit: a spring that starts compressed and overshoots once, then stops (zeta below 1, but dies out quickly).
    const zeta = 0.5;
    const omega = Math.PI * 2 * 3.2;
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    const squash = -0.5;
    const compression = (tau: number): number => {
        const decay = Math.exp(-zeta * omega * tau);
        const spring = decay * (Math.cos(omegaD * tau) + ((zeta * omega) / omegaD) * Math.sin(omegaD * tau));
        const fade = 1 - MathUtils.smoothstep(tau, SETTLE_TIME * 0.7, SETTLE_TIME); // exactly 1 again at the end
        return 1 + squash * spring * fade;
    };

    return {
        side,
        duration,
        landing,
        impacts: [{ time: landing, intensity: 1 }],
        final: { pos: end.clone(), quat: flat.clone() },
        sample(time, out = newPose()) {
            if (time >= duration) {
                out.pos.copy(end);
                out.quat.copy(flat);
                out.scale.set(1, 1, 1);
                out.airborne = false;
                return out;
            }
            if (time < landing) {
                const u = MathUtils.clamp(time / flightTime, 0, 1);
                const travel = easeInOutCubic(MathUtils.clamp(u / TRAVEL_END, 0, 1));
                out.pos.lerpVectors(start, end, travel);
                out.quat.copy(quatInFlight(u, out.quat));
                if (u >= SPIN_END) out.quat.copy(flat); // exactly flat for the last of the fall: rounding must not leave a tilt
                out.pos.y = Math.max(rest + heightAt(u), supportHeight(out.quat));
                out.scale.set(1, 1, 1);
                out.airborne = true;
                return out;
            }
            // after the hit the coin does not move or tilt at all: only the squash springs back
            const sy = compression(time - landing);
            const sxz = 1 / Math.sqrt(sy);
            out.quat.copy(flat);
            out.scale.set(sxz, sy, sxz);
            // the bottom stays on the felt, and the coin presses a little into it while it is squashed
            const sink = MAX_SINK * MathUtils.clamp((1 - sy) / 0.5, 0, 1);
            out.pos.set(end.x, rest * sy - sink, end.z);
            out.airborne = false;
            return out;
        },
    };
}
