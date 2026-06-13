import test from "node:test";
import assert from "node:assert/strict";

import {
  clampPosition,
  findNearestHotspot,
  getFrameMoveDistance,
  getMovementVectorFromKeys,
  isPositionBlocked,
  moveAvatar,
} from "../src/avatar.js";

test("moving avatar changes position by direction and speed", () => {
  const next = moveAvatar({ x: 50, y: 50, facing: "down" }, { x: 1, y: 0 }, 12, {
    width: 100,
    height: 100,
  });

  assert.deepEqual(next, { x: 62, y: 50, facing: "right", moving: true });
});

test("frame movement distance scales with elapsed time and caps long frames", () => {
  assert.equal(getFrameMoveDistance(40, 16), 0.64);
  assert.equal(getFrameMoveDistance(40, 1000), 2);
  assert.equal(getFrameMoveDistance(40, -12), 0);
});

test("held movement keys combine directions and cancel opposite inputs", () => {
  assert.deepEqual(getMovementVectorFromKeys(new Set(["KeyD", "ArrowUp"])), { x: 1, y: -1 });
  assert.deepEqual(getMovementVectorFromKeys(["ArrowLeft", "KeyD"]), { x: 0, y: 0 });
  assert.deepEqual(getMovementVectorFromKeys(["KeyW", "KeyS", "KeyA"]), { x: -1, y: 0 });
});

test("avatar movement is clamped within stage bounds", () => {
  const next = moveAvatar({ x: 6, y: 8, facing: "left" }, { x: -1, y: -1 }, 20, {
    width: 100,
    height: 100,
  });

  assert.equal(next.x, 0);
  assert.equal(next.y, 0);
  assert.equal(next.facing, "left");
});

test("clampPosition respects width and height independently", () => {
  assert.deepEqual(clampPosition({ x: 130, y: -20 }, { width: 120, height: 80 }), { x: 120, y: 0 });
});

test("nearest hotspot is returned only when within interaction radius", () => {
  const hotspots = [
    { id: "herb_patch", x: 20, y: 20, radius: 18 },
    { id: "alchemy_furnace", x: 90, y: 90, radius: 18 },
  ];

  assert.equal(findNearestHotspot({ x: 24, y: 25 }, hotspots).id, "herb_patch");
  assert.equal(findNearestHotspot({ x: 55, y: 55 }, hotspots), null);
});

test("avatar cannot walk through a solid scene object", () => {
  const next = moveAvatar(
    { x: 45, y: 50, facing: "right" },
    { x: 1, y: 0 },
    7,
    { width: 100, height: 100 },
    [{ id: "furnace", x: 52, y: 50, radius: 6 }]
  );

  assert.deepEqual(next, { x: 45, y: 50, facing: "right", moving: false });
});

test("avatar can slide along a solid object instead of sticking completely", () => {
  const next = moveAvatar(
    { x: 45, y: 43, facing: "down" },
    { x: 1, y: 1 },
    10,
    { width: 100, height: 100 },
    [{ id: "furnace", x: 52, y: 50, radius: 5 }]
  );

  assert.ok(!isPositionBlocked(next, [{ id: "furnace", x: 52, y: 50, radius: 5 }]));
  assert.equal(next.moving, true);
  assert.equal(next.facing, "right");
});
