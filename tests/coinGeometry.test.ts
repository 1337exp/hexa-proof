import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createCoinGeometry } from '../src/scene/coinGeometry';
import { COIN_RADIUS, COIN_THICKNESS } from '../src/scene/tossPlan';

describe('the geometry of the coin', () => {
    const geometry = createCoinGeometry();
    const position = geometry.getAttribute('position');
    const index = geometry.getIndex();

    /** The normal of a triangle of the index, from the winding. / Нормаль треугольника по обходу. */
    function normalOf(triangle: number): Vector3 {
        const at = (k: number) => new Vector3().fromBufferAttribute(position, index ? index.getX(triangle * 3 + k) : triangle * 3 + k);
        const [a, b, c] = [at(0), at(1), at(2)];
        return new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).normalize();
    }

    it('is a disc of the right size lying flat, centred on the origin', () => {
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        expect(box.max.x).toBeCloseTo(COIN_RADIUS + 0.025, 2);
        expect(box.max.y).toBeCloseTo(COIN_THICKNESS / 2, 5);
        expect(box.min.y).toBeCloseTo(-COIN_THICKNESS / 2, 5);
    });

    it('has three groups: the lower face, the upper face and the rim', () => {
        expect(geometry.groups.map((g) => g.materialIndex)).toEqual([0, 1, 2]);
        const total = index ? index.count : position.count;
        expect(geometry.groups.reduce((sum, g) => sum + g.count, 0)).toBe(total);
    });

    it('has the face of group 1 looking up and the face of group 0 looking down (the yang is on the upper one)', () => {
        const [lower, upper] = geometry.groups;
        const normalLower = normalOf(lower!.start / 3 + 1);
        const normalUpper = normalOf(upper!.start / 3 + 1);
        expect(normalUpper.y).toBeGreaterThan(0.99);
        expect(normalLower.y).toBeLessThan(-0.99);
    });
});
