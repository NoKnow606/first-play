import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialState,
  getAdventurePreview,
  resolveAdventureEvent,
  runAdventure,
  startAdventureBattle,
  startAdventureSession,
  takeBattleTurn,
} from "../src/domain.js";
import { getAdventureSceneSwitchGuard } from "../src/adventure-flow.js";

test("running an adventure consumes action points and grants route rewards", () => {
  const state = createInitialState();

  const result = runAdventure(state, "meadow_patrol", { random: () => 0 });

  assert.equal(result.route.id, "meadow_patrol");
  assert.equal(result.events.length, 3);
  assert.equal(result.successCount, 3);
  assert.equal(state.resources.actionPoint, 18);
  assert.ok(state.inventory.materials.dew_herb > 6);
  assert.equal(state.adventure.completedRuns, 1);
  assert.equal(state.adventure.routeCompletions.meadow_patrol, 1);
  assert.ok(state.proficiency.schoolExp.life > 0);
  assert.ok(state.alchemist.exp > 0);
});

test("locked adventure routes reject low-level alchemists", () => {
  const state = createInitialState();

  assert.throws(() => runAdventure(state, "sky_dock_trial"), /需要炼金师 Lv\.3/);
});

test("crafted item stats improve adventure preview success rate", () => {
  const state = createInitialState();
  const base = getAdventurePreview(state, "mine_scout").successRate;

  state.inventory.items.push({
    instanceId: "item_test",
    itemId: "gear_drone",
    stats: { discovery: 40, mobility: 20 },
  });

  const boosted = getAdventurePreview(state, "mine_scout").successRate;

  assert.ok(boosted > base);
});

test("failed adventure events still give light compensation", () => {
  const state = createInitialState();

  const result = runAdventure(state, "mine_scout", { random: () => 0.99 });

  assert.equal(result.successCount, 0);
  assert.ok(state.resources.inspiration > 0);
  assert.ok(state.inventory.materials.alchemy_residue > 0);
});

test("starting an adventure creates a scene-bound session without resolving rewards", () => {
  const state = createInitialState();

  const session = startAdventureSession(state, "meadow_patrol");

  assert.equal(session.sceneId, "meadow");
  assert.equal(session.currentEvent.title, "浆果灌木");
  assert.ok(session.currentEvent.encounter);
  assert.equal(state.resources.actionPoint, 18);
  assert.equal(state.inventory.materials.clear_spring, 0);
  assert.equal(state.adventure.activeRun.routeId, "meadow_patrol");
  assert.equal(state.adventure.activeRun.nextEventIndex, 0);
});

test("adventure session resolves events one by one before completion", () => {
  const state = createInitialState();
  startAdventureSession(state, "meadow_patrol");

  startAdventureBattle(state);
  state.adventure.activeRun.activeBattle.enemyHp = 3;
  const first = takeBattleTurn(state, "attack", { random: () => 0 });

  assert.equal(first.battleComplete, true);
  assert.equal(first.adventure.complete, false);
  assert.equal(first.adventure.event.title, "浆果灌木");
  assert.equal(state.adventure.activeRun.nextEventIndex, 1);
  assert.equal(state.adventure.completedRuns, 0);

  const second = resolveAdventureEvent(state, { random: () => 0 });
  assert.equal(second.event.title, "露水小径");
  const final = resolveAdventureEvent(state, { random: () => 0 });

  assert.equal(final.complete, true);
  assert.equal(final.successCount, 3);
  assert.equal(state.adventure.activeRun, null);
  assert.equal(state.adventure.completedRuns, 1);
  assert.equal(state.adventure.lastRun.routeName, "星露草场巡游");
});

test("encounter events cannot skip the turn-based battle", () => {
  const state = createInitialState();
  startAdventureSession(state, "meadow_patrol");

  assert.throws(() => resolveAdventureEvent(state, { random: () => 0 }), /遭遇战/);
});

test("encounter events start a turn-based battle without resolving adventure rewards", () => {
  const state = createInitialState();
  startAdventureSession(state, "meadow_patrol");

  const battle = startAdventureBattle(state);

  assert.equal(battle.eventId, "berry_hollow");
  assert.equal(battle.enemyName, "露莓史莱姆");
  assert.equal(battle.turn, 1);
  assert.ok(battle.playerHp > 0);
  assert.ok(battle.enemyHp > 0);
  assert.equal(state.adventure.activeRun.nextEventIndex, 0);
  assert.equal(state.adventure.activeRun.events.length, 0);
  assert.equal(state.inventory.materials.red_berry, 0);
});

test("winning a battle resolves the encounter event and advances the route", () => {
  const state = createInitialState();
  startAdventureSession(state, "meadow_patrol");
  startAdventureBattle(state);
  state.adventure.activeRun.activeBattle.enemyHp = 3;

  const result = takeBattleTurn(state, "attack");

  assert.equal(result.battleComplete, true);
  assert.equal(result.won, true);
  assert.equal(result.adventure.event.title, "浆果灌木");
  assert.equal(result.adventure.event.success, true);
  assert.equal(result.adventure.nextEvent.title, "露水小径");
  assert.equal(state.adventure.activeRun.activeBattle, null);
  assert.equal(state.adventure.activeRun.nextEventIndex, 1);
  assert.ok(state.inventory.materials.red_berry > 0);
});

test("completed adventure logs preserve battle summaries", () => {
  const state = createInitialState();
  startAdventureSession(state, "meadow_patrol");
  startAdventureBattle(state);
  state.adventure.activeRun.activeBattle.enemyHp = 3;
  takeBattleTurn(state, "attack");
  resolveAdventureEvent(state, { random: () => 0 });
  resolveAdventureEvent(state, { random: () => 0 });

  const battleEvent = state.adventure.lastRun.events.find((event) => event.title === "浆果灌木");
  assert.equal(battleEvent.battle.enemyName, "露莓史莱姆");
  assert.equal(battleEvent.battle.outcome, "win");
});

test("active adventure sessions keep scene switching on the route scene", () => {
  const activeRun = { routeName: "星露草场巡游", sceneId: "meadow" };
  const routeScene = { id: "meadow", name: "星露草场" };

  const allowed = getAdventureSceneSwitchGuard(activeRun, routeScene, routeScene);
  assert.equal(allowed.canSwitch, true);
  assert.equal(allowed.notice, "");

  const blocked = getAdventureSceneSwitchGuard(activeRun, { id: "workshop", name: "炼金工坊" }, routeScene);
  assert.equal(blocked.canSwitch, false);
  assert.match(blocked.notice, /星露草场巡游/);
  assert.match(blocked.notice, /星露草场/);
});
