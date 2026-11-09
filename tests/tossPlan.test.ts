import { Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { Coin } from '../src/core/cast';
import { COIN_RADIUS, COIN_THICKNESS, MAX_SINK, flatQuaternion, newPose, planToss, supportHeight, upSide, type CoinPose } from '../src/scene/tossPlan';

/** mulberry32: a small seeded generator, so a failing case can be played again. / Маленький генератор с зерном, чтобы упавший случай можно повторить. */
function seeded(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const SIDES: Coin[] = [2, 3];

function randomPlan(random: () => number, startSide: Coin, side: Coin) {
    const from = new Vector3((random() - 0.5) * 6, 0.07, (random() - 0.5) * 4);
    const to = new Vector3((random() - 0.5) * 6, 0.07, (random() - 0.5) * 4);
    return { from, to, plan: planToss(from, startSide, random() * 6.28, to, side, random) };
}

describe('the side that falls up', () => {
    it('is the wanted one in the final pose, for every start side and wanted side (3000 random tosses)', () => {
        const random = seeded(20261109);
        for (let i = 0; i < 3000; i++) {
            const startSide = SIDES[i % 2]!;
            const side = SIDES[(i >> 1) % 2]!;
            const { plan, to } = randomPlan(random, startSide, side);
            const end = plan.sample(plan.duration + 1);
            expect(upSide(end.quat), `toss ${i}: ${startSide} → ${side}`).toBe(side);
            expect(end.pos.x).toBeCloseTo(to.x, 6);
            expect(end.pos.z).toBeCloseTo(to.z, 6);
            expect(end.pos.y).toBeCloseTo(COIN_THICKNESS / 2, 6);
            expect(end.scale.toArray()).toEqual([1, 1, 1]);
            expect(end.airborne).toBe(false);
        }
    });

    it('is the same side at the hit and at every moment after it: nothing turns over on the table', () => {
        const random = seeded(8);
        for (let i = 0; i < 300; i++) {
            const { plan } = randomPlan(random, SIDES[i % 2]!, SIDES[(i >> 1) % 2]!);
            for (let t = plan.landing; t <= plan.duration; t += 1 / 240) expect(upSide(plan.sample(t).quat), `toss ${i} at ${t.toFixed(3)} s`).toBe(plan.side);
        }
    });
});

describe('after the hit the coin does not hop, tilt or slide (the twitching we had)', () => {
    it('keeps its place and its flat orientation exactly, only the squash changes', () => {
        const random = seeded(61);
        for (let i = 0; i < 300; i++) {
            const { plan, to } = randomPlan(random, SIDES[i % 2]!, SIDES[(i >> 1) % 2]!);
            for (let t = plan.landing; t <= plan.duration + 0.05; t += 1 / 240) {
                const pose = plan.sample(t);
                expect(pose.pos.x, `x at ${t.toFixed(3)}`).toBeCloseTo(to.x, 9);
                expect(pose.pos.z, `z at ${t.toFixed(3)}`).toBeCloseTo(to.z, 9);
                expect(pose.quat.angleTo(plan.final.quat), `tilt at ${t.toFixed(3)}`).toBeLessThan(1e-6);
                expect(pose.airborne).toBe(false);
            }
        }
    });

    it('never rises off the felt after the hit: the bottom of the coin stays on it or a little in it', () => {
        const random = seeded(62);
        for (let i = 0; i < 300; i++) {
            const { plan } = randomPlan(random, SIDES[i % 2]!, SIDES[(i >> 1) % 2]!);
            for (let t = plan.landing; t <= plan.duration + 0.05; t += 1 / 240) {
                const pose = plan.sample(t);
                const bottom = pose.pos.y - (COIN_THICKNESS / 2) * pose.scale.y;
                expect(bottom, `bottom at ${t.toFixed(3)}`).toBeLessThanOrEqual(1e-9);
                expect(bottom, `bottom at ${t.toFixed(3)}`).toBeGreaterThanOrEqual(-MAX_SINK - 1e-9);
            }
        }
    });

    it('is squashed at the hit, overshoots at most once, and is back to its size at the end', () => {
        const random = seeded(63);
        for (let i = 0; i < 50; i++) {
            const { plan } = randomPlan(random, 3, SIDES[i % 2]!);
            const at = plan.sample(plan.landing);
            expect(at.scale.y).toBeLessThan(0.7);
            expect(at.scale.x).toBeGreaterThan(1.1);
            let crossings = 0;
            let previous = at.scale.y - 1;
            for (let t = plan.landing; t <= plan.duration; t += 1 / 480) {
                const now = plan.sample(t).scale.y - 1;
                if (Math.abs(now) > 1e-4 && Math.sign(now) !== Math.sign(previous) && Math.abs(previous) > 1e-4) crossings++;
                if (Math.abs(now) > 1e-4) previous = now;
            }
            expect(crossings).toBeLessThanOrEqual(2);
            expect(plan.sample(plan.duration).scale.toArray()).toEqual([1, 1, 1]);
        }
    });

    it('has one impact, at the moment the coin reaches the felt', () => {
        const random = seeded(64);
        const { plan } = randomPlan(random, 3, 2);
        expect(plan.impacts).toEqual([{ time: plan.landing, intensity: 1 }]);
        const before = plan.sample(plan.landing - 1 / 240);
        expect(before.airborne).toBe(true);
        expect(before.pos.y - COIN_THICKNESS / 2).toBeLessThan(0.1); // it arrives at speed, right at the felt
    });
});

describe('the flight', () => {
    it('never goes under the table', () => {
        const random = seeded(11);
        const pose: CoinPose = newPose();
        for (let i = 0; i < 400; i++) {
            const { plan } = randomPlan(random, SIDES[i % 2]!, SIDES[(i >> 1) % 2]!);
            for (let t = 0; t < plan.landing; t += 1 / 240) {
                plan.sample(t, pose);
                expect(pose.pos.y - supportHeight(pose.quat), `toss ${i} at ${t.toFixed(3)} s`).toBeGreaterThan(-1e-6);
            }
        }
    });

    it('moves smoothly at 60 frames a second: the quickest thing is the drive down, and no turn per frame is more than a third of the circle', () => {
        const random = seeded(23);
        for (let i = 0; i < 300; i++) {
            const { plan } = randomPlan(random, SIDES[i % 2]!, SIDES[(i >> 1) % 2]!);
            let previous: CoinPose | null = null;
            for (let t = 0; t <= plan.duration + 0.02; t += 1 / 60) {
                const pose = plan.sample(t);
                if (previous) {
                    expect(pose.pos.distanceTo(previous.pos), `toss ${i} at ${t.toFixed(3)} s`).toBeLessThan(0.75);
                    expect(pose.quat.angleTo(previous.quat), `toss ${i} at ${t.toFixed(3)} s`).toBeLessThan(2.1);
                }
                previous = { pos: pose.pos.clone(), quat: pose.quat.clone(), scale: pose.scale.clone(), airborne: pose.airborne };
            }
        }
    });

    it('is driven down faster and faster: it falls quicker the nearer it is to the felt', () => {
        const random = seeded(71);
        const { plan } = randomPlan(random, 3, 3);
        const heights: number[] = [];
        for (let t = plan.landing * 0.5; t <= plan.landing; t += 1 / 120) heights.push(plan.sample(t).pos.y);
        const drops = heights.slice(1).map((h, k) => heights[k]! - h);
        expect(drops[drops.length - 1]!).toBeGreaterThan(drops[Math.floor(drops.length / 2)]!);
        expect(drops.every((d) => d >= -1e-9)).toBe(true);
    });

    it('does not hang in the air: it turns at the top and is falling at once, from rest, faster and faster', () => {
        const random = seeded(72);
        for (let i = 0; i < 50; i++) {
            const { plan } = randomPlan(random, 3, SIDES[i % 2]!);
            const top = plan.sample(plan.landing * 0.45).pos.y;
            const later = (share: number) => plan.sample(plan.landing * share).pos.y;
            expect(top).toBeGreaterThan(3);
            expect(top - later(0.45 + 1 / 60)).toBeLessThan(0.05); // at the top it hardly moves in a frame
            expect(later(0.6)).toBeLessThan(top - 0.1); // and is already falling away from it a moment later: no stop at the top
            expect(top - later(0.7)).toBeGreaterThan((top - later(0.6)) * 2); // the fall quickens
        }
    });

    it('comes out of the spin flat just before the hit, and spins at least two turns in the air before it', () => {
        const random = seeded(41);
        for (let i = 0; i < 100; i++) {
            const { plan } = randomPlan(random, 3, 3);
            for (let t = plan.landing * 0.94; t < plan.landing; t += 1 / 240) expect(plan.sample(t).quat.angleTo(plan.final.quat)).toBeLessThan(1e-6);
            let flips = 0;
            let was = Math.sign(new Vector3(0, 1, 0).applyQuaternion(plan.sample(0).quat).y);
            for (let t = 0; t < plan.landing; t += 1 / 240) {
                const now = Math.sign(new Vector3(0, 1, 0).applyQuaternion(plan.sample(t).quat).y);
                if (now !== was && now !== 0) flips++;
                if (now !== 0) was = now;
            }
            expect(flips).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('the helpers', () => {
    it('knows which side is up by the orientation', () => {
        expect(upSide(flatQuaternion(3, 1.2))).toBe(3);
        expect(upSide(flatQuaternion(2, -0.7))).toBe(2);
        expect(upSide(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2))).toBeNull();
    });

    it('lifts a tilted coin so that its rim touches the table', () => {
        expect(supportHeight(new Quaternion())).toBeCloseTo(COIN_THICKNESS / 2, 9);
        expect(supportHeight(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2))).toBeCloseTo(COIN_RADIUS, 9);
    });
});
