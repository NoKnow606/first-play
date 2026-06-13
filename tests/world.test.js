import test from "node:test";
import assert from "node:assert/strict";

import { percentToWorld, worldToPercent } from "../src/world.js";

test("percent position maps to centered 3D world coordinates", () => {
  assert.deepEqual(percentToWorld({ x: 50, y: 50 }), { x: 0, z: 0 });
  assert.deepEqual(percentToWorld({ x: 0, y: 0 }), { x: -6, z: -4 });
  assert.deepEqual(percentToWorld({ x: 100, y: 100 }), { x: 6, z: 4 });
});

test("world position maps back to percent coordinates", () => {
  assert.deepEqual(worldToPercent({ x: 0, z: 0 }), { x: 50, y: 50 });
  assert.deepEqual(worldToPercent({ x: -6, z: -4 }), { x: 0, y: 0 });
  assert.deepEqual(worldToPercent({ x: 6, z: 4 }), { x: 100, y: 100 });
});
