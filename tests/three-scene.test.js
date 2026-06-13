import test from "node:test";
import assert from "node:assert/strict";

import {
  AVATAR_MOTION,
  dampValue,
  getAvatarSilhouettePlan,
  getFacingRotation,
  shouldWriteDiagnostics,
  shortestAngleDelta,
} from "../src/three-scene.js";

test("diagnostics are throttled instead of running every frame", () => {
  assert.equal(shouldWriteDiagnostics(1.1, 1.0), false);
  assert.equal(shouldWriteDiagnostics(1.4, 1.0), true);
});

test("avatar motion uses smoothing constants for non-snappy movement", () => {
  assert.ok(AVATAR_MOTION.followStrength > 6);
  assert.ok(AVATAR_MOTION.walkBobHeight > 0.04);
  assert.ok(AVATAR_MOTION.bodySway > 0);
  assert.ok(AVATAR_MOTION.headSway > 0);

  const firstFrame = dampValue(0, 10, AVATAR_MOTION.followStrength, 1 / 60);
  assert.ok(firstFrame > 0);
  assert.ok(firstFrame < 10);

  const laterFrame = dampValue(firstFrame, 10, AVATAR_MOTION.followStrength, 1 / 60);
  assert.ok(laterFrame > firstFrame);
  assert.ok(laterFrame < 10);
});

test("avatar silhouette plan keeps a chibi pixel alchemist profile", () => {
  const plan = getAvatarSilhouettePlan();

  assert.equal(plan.style, "pixel-chibi-alchemist");
  assert.ok(plan.head.width > plan.body.width);
  assert.ok(plan.head.height >= plan.body.height * 0.75);
  assert.ok(plan.parts.includes("companion-orb"));
  assert.ok(plan.parts.includes("potion-belt"));
  assert.ok(plan.parts.length >= 16);
});

test("avatar turns through the shortest angle", () => {
  const delta = shortestAngleDelta((Math.PI * 3) / 4, (-Math.PI * 3) / 4);

  assert.ok(delta > 0);
  assert.ok(delta < Math.PI);
});

test("avatar face points toward the requested screen direction", () => {
  assert.equal(getFacingRotation("up"), 0);
  assert.equal(getFacingRotation("down"), Math.PI);
  assert.equal(getFacingRotation("right"), -Math.PI / 2);
  assert.equal(getFacingRotation("left"), Math.PI / 2);
});
