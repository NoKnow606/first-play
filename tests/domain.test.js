import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSuccessRate,
  createInitialState,
  findRecipe,
  getLevelFromExp,
  getRecipeKey,
  interactWithNpc,
  performAlchemy,
  refineMaterial,
} from "../src/domain.js";

test("recipe keys are stable regardless of element order", () => {
  assert.equal(getRecipeKey(["wood", "water"]), "water+wood");
  assert.equal(getRecipeKey(["water", "wood"]), "water+wood");
});

test("known recipes are matched by their element combination", () => {
  const recipe = findRecipe(["wood", "water"]);

  assert.equal(recipe.id, "small_healing_potion");
  assert.equal(recipe.outputItemId, "small_healing_potion");
});

test("refining material consumes inventory, grants elements, and updates codex", () => {
  const state = createInitialState();

  const result = refineMaterial(state, "dew_herb", 2, () => 0.2);

  assert.equal(result.gainedElements.water, 2);
  assert.equal(result.gainedElements.life, 2);
  assert.equal(state.inventory.materials.dew_herb, 4);
  assert.equal(state.inventory.elements.water, 2);
  assert.equal(state.inventory.elements.life, 2);
  assert.ok(state.codex.discoveredMaterialIds.includes("dew_herb"));
  assert.ok(state.codex.discoveredElementIds.includes("water"));
});

test("successful alchemy consumes elements, creates item, unlocks codex, and gains proficiency", () => {
  const state = createInitialState();
  state.inventory.elements.water = 3;
  state.inventory.elements.wood = 3;

  const result = performAlchemy(state, {
    elementIds: ["water", "wood"],
    random: sequence([0.01, 0.2]),
  });

  assert.equal(result.success, true);
  assert.equal(result.recipe.id, "small_healing_potion");
  assert.equal(result.item.itemId, "small_healing_potion");
  assert.equal(result.item.quality, "fine");
  assert.equal(state.inventory.elements.water, 2);
  assert.equal(state.inventory.elements.wood, 2);
  assert.equal(state.inventory.items.length, 1);
  assert.ok(state.codex.discoveredRecipeIds.includes("small_healing_potion"));
  assert.ok(state.codex.discoveredItemIds.includes("small_healing_potion"));
  assert.equal(state.proficiency.schoolExp.life, 8);
  assert.equal(state.proficiency.recipeExp.small_healing_potion, 12);
});

test("failed alchemy gives residue, inspiration, and practice experience", () => {
  const state = createInitialState();
  state.inventory.elements.fire = 1;
  state.inventory.elements.mechanical = 1;
  state.inventory.elements.metal = 1;

  const result = performAlchemy(state, {
    elementIds: ["fire", "mechanical", "metal"],
    random: () => 0.99,
  });

  assert.equal(result.success, false);
  assert.equal(result.recipe.id, "flame_projector");
  assert.equal(state.inventory.items.length, 0);
  assert.equal(state.inventory.elements.fire, 0);
  assert.equal(state.inventory.elements.mechanical, 0);
  assert.equal(state.inventory.elements.metal, 0);
  assert.equal(state.inventory.materials.alchemy_residue, 2);
  assert.equal(state.resources.inspiration, 1);
  assert.equal(state.proficiency.recipeExp.flame_projector, 3);
});

test("success rate improves with recipe, school, furnace, catalyst, and material bonuses", () => {
  const rate = calculateSuccessRate({
    baseSuccessRate: 0.5,
    recipeLevel: 5,
    schoolLevel: 4,
    furnaceLevel: 2,
    catalystBonus: 0.08,
    materialQualityBonus: 0.04,
  });

  assert.equal(rate, 0.71);
});

test("proficiency level follows square growth", () => {
  assert.equal(getLevelFromExp(0), 1);
  assert.equal(getLevelFromExp(100), 2);
  assert.equal(getLevelFromExp(900), 4);
});

test("npc interaction grants first-time reward and then switches to repeat line", () => {
  const state = createInitialState();
  const npc = {
    id: "npc_mira",
    name: "米拉导师",
    line: "先别急着炸炉，水和木很适合练手。",
    repeatLine: "记住，稳定比华丽更重要。",
    reward: {
      inspiration: 2,
      materials: { dew_herb: 1 },
    },
  };

  const first = interactWithNpc(state, npc);

  assert.equal(first.line, npc.line);
  assert.equal(first.rewardClaimed, true);
  assert.equal(state.resources.inspiration, 2);
  assert.equal(state.inventory.materials.dew_herb, 7);
  assert.ok(state.social.talkedNpcIds.includes("npc_mira"));
  assert.ok(state.social.claimedNpcRewardIds.includes("npc_mira"));

  const second = interactWithNpc(state, npc);

  assert.equal(second.line, npc.repeatLine);
  assert.equal(second.rewardClaimed, false);
  assert.equal(state.resources.inspiration, 2);
  assert.equal(state.inventory.materials.dew_herb, 7);
});

function sequence(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}
