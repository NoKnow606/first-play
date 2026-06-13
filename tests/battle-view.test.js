import test from "node:test";
import assert from "node:assert/strict";

import { getBattlePresentation } from "../src/battle-view.js";

test("battle presentation builds a staged encounter view", () => {
  const battle = {
    enemyId: "berry_slime",
    enemyName: "露莓史莱姆",
    enemyHp: 11,
    enemyMaxHp: 22,
    playerHp: 36,
    playerMaxHp: 48,
    logs: ["遭遇 露莓史莱姆，进入回合战。"],
  };

  const view = getBattlePresentation(battle, { id: "meadow" });

  assert.equal(view.sceneClass, "battle-scene-meadow");
  assert.equal(view.motion, "intro");
  assert.equal(view.enemySprite, "slime");
  assert.equal(view.playerPercent, 75);
  assert.equal(view.enemyPercent, 50);
  assert.equal(view.effect, "spark");
  assert.equal(view.caption, "遭遇 露莓史莱姆，进入回合战。");
});

test("battle presentation maps turn actions to visual effects", () => {
  const battle = {
    enemyId: "ember_bat",
    enemyName: "余烬蝠",
    enemyHp: 12,
    enemyMaxHp: 26,
    playerHp: 40,
    playerMaxHp: 48,
    lastAction: "alchemy",
    logs: ["炼金术造成 12 点伤害，稳定回复 6 点生命。"],
  };

  const view = getBattlePresentation(battle, { id: "mine" });

  assert.equal(view.sceneClass, "battle-scene-mine");
  assert.equal(view.motion, "alchemy");
  assert.equal(view.enemySprite, "bat");
  assert.equal(view.effect, "alchemy");
  assert.equal(view.caption, "炼金术造成 12 点伤害，稳定回复 6 点生命。");
});
