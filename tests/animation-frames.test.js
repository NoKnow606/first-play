import test from "node:test";
import assert from "node:assert/strict";

import { getSpriteAnimationPlan, getBattleMotionPlan, getUiMotionPlan } from "../src/animation-frames.js";

test("sprite animation plans keep stable frame counts and anchors", () => {
  const avatarWalk = getSpriteAnimationPlan("avatar", "walk");
  const npcIdle = getSpriteAnimationPlan("npc", "idle");

  assert.equal(avatarWalk.frameCount, 4);
  assert.equal(avatarWalk.anchor, "feet");
  assert.equal(avatarWalk.cssClass, "anim-avatar-walk");
  assert.equal(avatarWalk.timing, "steps(4, end)");
  assert.equal(npcIdle.frameCount, 4);
  assert.equal(npcIdle.anchor, "bottom");
});

test("battle motion plans expose staged sprite forge phases", () => {
  const attack = getBattleMotionPlan("attack");
  const alchemy = getBattleMotionPlan("alchemy");
  const guard = getBattleMotionPlan("guard");

  assert.deepEqual(attack.phases, ["anticipation", "lunge", "impact", "recover"]);
  assert.equal(alchemy.effectClass, "effect-alchemy-beam");
  assert.equal(alchemy.frameCount, 6);
  assert.equal(guard.frameCount, 4);
});

test("UI motion plans cover panels, cards, icons, and progress feedback", () => {
  for (const id of ["drawer", "card", "icon", "progress"]) {
    const plan = getUiMotionPlan(id);

    assert.equal(plan.id, id);
    assert.ok(plan.cssClass.startsWith("motion-"));
    assert.ok(plan.durationMs >= 180);
  }
});
