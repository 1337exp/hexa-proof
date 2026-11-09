import { ExtrudeGeometry, Path, Shape } from 'three';
import { COIN_RADIUS, COIN_THICKNESS } from './tossPlan';

/** Half of the side of the square hole. / Половина стороны квадратного отверстия. */
export const HOLE_HALF = 0.158;

/**
 * A cash coin: a disc with a square hole, a little bevel on the rim. Lies flat: the thickness is along Y, the face of the yang
 * (the solid bar) looks up (+Y), the face of the yin down (−Y). Three groups: 0 is the face that looks down, 1 the face that looks up, 2 the rim.
 * Монета с квадратным отверстием и маленькой фаской. Лежит плашмя: толщина вдоль Y, сторона ян (сплошная черта) смотрит вверх (+Y),
 * сторона инь вниз (−Y). Три группы: 0 — нижняя сторона, 1 — верхняя, 2 — ребро.
 */
export function createCoinGeometry(): ExtrudeGeometry {
    const shape = new Shape();
    shape.absarc(0, 0, COIN_RADIUS, 0, Math.PI * 2, false);
    const hole = new Path();
    hole.moveTo(-HOLE_HALF, -HOLE_HALF);
    hole.lineTo(-HOLE_HALF, HOLE_HALF);
    hole.lineTo(HOLE_HALF, HOLE_HALF);
    hole.lineTo(HOLE_HALF, -HOLE_HALF);
    hole.closePath();
    shape.holes.push(hole);

    const bevel = 0.025;
    const geometry = new ExtrudeGeometry(shape, {
        depth: COIN_THICKNESS - 2 * bevel,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        curveSegments: 64,
    });
    // the extrusion runs along Z: turn it so that it runs along Y, and centre it
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -(COIN_THICKNESS - 2 * bevel) / 2, 0);

    // ExtrudeGeometry has two groups: the lids (both in one) and the sides. Split the lids into the lower and the upper one.
    const [lids, rim] = geometry.groups;
    if (!lids || !rim) throw new Error('Unexpected groups of the extruded coin');
    const half = lids.count / 2;
    geometry.clearGroups();
    geometry.addGroup(lids.start, half, 0);
    geometry.addGroup(lids.start + half, half, 1);
    geometry.addGroup(rim.start, rim.count, 2);
    return geometry;
}
