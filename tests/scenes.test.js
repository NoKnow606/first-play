import test from "node:test";
import assert from "node:assert/strict";

import {
  getNpcHotspots,
  getScene,
  getSceneCollisionZones,
  getSceneHotspots,
  resolveSceneTransition,
  SCENE_ORDER,
} from "../src/scenes.js";

test("scene set includes workshop and three exploration scenes", () => {
  assert.deepEqual(SCENE_ORDER, ["workshop", "meadow", "mine", "sky_dock"]);
  assert.equal(getScene("workshop").name, "炼金工坊");
  assert.equal(getScene("unknown").id, "workshop");
});

test("every scene exposes unique interactable hotspots", () => {
  for (const sceneId of SCENE_ORDER) {
    const hotspots = getSceneHotspots(sceneId);
    assert.ok(hotspots.length >= 4, `${sceneId} should feel populated`);
    assert.equal(new Set(hotspots.map((hotspot) => hotspot.id)).size, hotspots.length);
    assert.ok(hotspots.every((hotspot) => Number.isFinite(hotspot.x) && Number.isFinite(hotspot.y)));
  }
});

test("scene exit hotspots resolve target scene and spawn position", () => {
  const transition = resolveSceneTransition("workshop", "exit_meadow");

  assert.equal(transition.sceneId, "meadow");
  assert.deepEqual(transition.avatar, { x: 52, y: 82, facing: "up", moving: true });
  assert.match(transition.notice, /星露草场/);
});

test("non-exit hotspots do not resolve scene transitions", () => {
  assert.equal(resolveSceneTransition("workshop", "furnace"), null);
});

test("each scene has at least one talkable NPC hotspot", () => {
  for (const sceneId of SCENE_ORDER) {
    const npcs = getNpcHotspots(sceneId);
    assert.ok(npcs.length >= 1, `${sceneId} should include an NPC`);
    assert.ok(npcs.every((hotspot) => hotspot.verb === "交谈" && hotspot.npc?.line));
  }
});

test("scene collision zones cover solid interactables without blocking their interaction radius", () => {
  const zones = getSceneCollisionZones("workshop");
  const furnace = zones.find((zone) => zone.id === "furnace");
  const mentor = zones.find((zone) => zone.id === "npc_mira");

  assert.ok(furnace);
  assert.ok(mentor);
  assert.ok(furnace.radius < getSceneHotspots("workshop").find((hotspot) => hotspot.id === "furnace").radius);
});
