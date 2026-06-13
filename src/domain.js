import {
  AREAS,
  ELEMENTS,
  ITEM_BY_ID,
  MATERIALS,
  MATERIAL_BY_ID,
  RECIPES,
  TASKS,
  TASK_BY_ID,
} from "./data.js";
import { ADVENTURE_ROUTE_BY_ID } from "./adventure.js";

const QUALITY_MULTIPLIER = {
  common: 1,
  fine: 1.18,
  rare: 1.45,
  epic: 1.85,
  legendary: 2.35,
};

const QUALITY_ORDER = ["legendary", "epic", "rare", "fine", "common"];

const RECIPE_BY_KEY = new Map(RECIPES.map((recipe) => [getRecipeKey(recipe.inputElementIds), recipe]));

export function createInitialState() {
  const state = {
    version: 1,
    resources: {
      coins: 120,
      inspiration: 0,
      actionPoint: 20,
      maxActionPoint: 20,
    },
    alchemist: {
      level: 1,
      exp: 0,
      furnaceLevel: 1,
    },
    inventory: {
      materials: emptyMaterialRecord(),
      elements: emptyElementRecord(),
      items: [],
    },
    proficiency: {
      schoolExp: {
        life: 0,
        weapon: 0,
        mechanical: 0,
      },
      recipeExp: {},
      itemUseExp: {},
    },
    codex: {
      discoveredMaterialIds: [],
      discoveredElementIds: [],
      discoveredRecipeIds: [],
      discoveredItemIds: [],
      highestItemQuality: {},
    },
    tasks: {
      progress: Object.fromEntries(TASKS.map((task) => [task.metric, 0])),
      claimedIds: [],
    },
    social: {
      talkedNpcIds: [],
      claimedNpcRewardIds: [],
    },
    adventure: {
      completedRuns: 0,
      routeCompletions: {},
      lastRun: null,
      activeRun: null,
    },
    recentLogs: ["欢迎来到炼金工坊。先采集材料，再提炼元素，最后尝试炼金。"],
    nextItemSeq: 1,
  };

  state.inventory.materials.dew_herb = 6;
  state.inventory.materials.wood_branch = 5;
  state.inventory.materials.flint = 4;
  state.inventory.materials.copper_ore = 2;
  state.inventory.materials.rusted_gear = 1;

  return state;
}

export function ensureStateShape(state) {
  const fallback = createInitialState();
  const merged = {
    ...fallback,
    ...state,
    resources: { ...fallback.resources, ...state?.resources },
    alchemist: { ...fallback.alchemist, ...state?.alchemist },
    inventory: {
      materials: { ...fallback.inventory.materials, ...state?.inventory?.materials },
      elements: { ...fallback.inventory.elements, ...state?.inventory?.elements },
      items: Array.isArray(state?.inventory?.items) ? state.inventory.items : [],
    },
    proficiency: {
      schoolExp: { ...fallback.proficiency.schoolExp, ...state?.proficiency?.schoolExp },
      recipeExp: { ...state?.proficiency?.recipeExp },
      itemUseExp: { ...state?.proficiency?.itemUseExp },
    },
    codex: {
      discoveredMaterialIds: [...new Set(state?.codex?.discoveredMaterialIds ?? [])],
      discoveredElementIds: [...new Set(state?.codex?.discoveredElementIds ?? [])],
      discoveredRecipeIds: [...new Set(state?.codex?.discoveredRecipeIds ?? [])],
      discoveredItemIds: [...new Set(state?.codex?.discoveredItemIds ?? [])],
      highestItemQuality: { ...state?.codex?.highestItemQuality },
    },
    tasks: {
      progress: { ...fallback.tasks.progress, ...state?.tasks?.progress },
      claimedIds: Array.isArray(state?.tasks?.claimedIds) ? state.tasks.claimedIds : [],
    },
    social: {
      talkedNpcIds: Array.isArray(state?.social?.talkedNpcIds) ? state.social.talkedNpcIds : [],
      claimedNpcRewardIds: Array.isArray(state?.social?.claimedNpcRewardIds) ? state.social.claimedNpcRewardIds : [],
    },
    adventure: {
      completedRuns: Number.isInteger(state?.adventure?.completedRuns) ? state.adventure.completedRuns : 0,
      routeCompletions: { ...state?.adventure?.routeCompletions },
      lastRun: state?.adventure?.lastRun ?? null,
      activeRun: state?.adventure?.activeRun ?? null,
    },
    recentLogs: Array.isArray(state?.recentLogs) ? state.recentLogs : fallback.recentLogs,
    nextItemSeq: Number.isInteger(state?.nextItemSeq) ? state.nextItemSeq : 1,
  };

  return merged;
}

export function getRecipeKey(elementIds) {
  return [...elementIds].sort().join("+");
}

export function findRecipe(elementIds) {
  return RECIPE_BY_KEY.get(getRecipeKey(elementIds)) ?? null;
}

export function refineMaterial(state, materialId, amount = 1, random = Math.random) {
  const material = MATERIAL_BY_ID[materialId];
  if (!material) {
    throw new Error(`Unknown material: ${materialId}`);
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Refine amount must be a positive integer");
  }
  if ((state.inventory.materials[materialId] ?? 0) < amount) {
    throw new Error(`Not enough material: ${material.name}`);
  }
  if (material.refineOutputs.length === 0) {
    throw new Error(`${material.name} cannot be refined`);
  }

  state.inventory.materials[materialId] -= amount;
  unlock(state.codex.discoveredMaterialIds, materialId);

  const isGreatSuccess = random() < 0.1;
  const gainedElements = {};

  for (let i = 0; i < amount; i += 1) {
    for (const output of material.refineOutputs) {
      const outputAmount = randomAmount(output.minAmount, output.maxAmount, random);
      if (outputAmount <= 0) continue;
      gainedElements[output.elementId] = (gainedElements[output.elementId] ?? 0) + outputAmount;
    }
  }

  if (isGreatSuccess) {
    const firstOutput = material.refineOutputs[0];
    gainedElements[firstOutput.elementId] = (gainedElements[firstOutput.elementId] ?? 0) + 1;
  }

  for (const [elementId, count] of Object.entries(gainedElements)) {
    state.inventory.elements[elementId] = (state.inventory.elements[elementId] ?? 0) + count;
    unlock(state.codex.discoveredElementIds, elementId);
  }

  incrementTask(state, "refine", amount);
  pushLog(state, `提炼 ${material.name} x${amount}，获得 ${formatElementGain(gainedElements)}。`);

  return {
    material,
    consumed: { [materialId]: amount },
    gainedElements,
    isGreatSuccess,
  };
}

export function collectArea(state, areaId, random = Math.random) {
  const area = AREAS.find((entry) => entry.id === areaId);
  if (!area) {
    throw new Error(`Unknown area: ${areaId}`);
  }
  if (state.alchemist.level < area.minAlchemistLevel) {
    throw new Error(`${area.name} requires alchemist level ${area.minAlchemistLevel}`);
  }
  if (state.resources.actionPoint < area.actionPointCost) {
    throw new Error("行动力不足");
  }

  state.resources.actionPoint -= area.actionPointCost;

  const gainedMaterials = {};
  for (const [materialId, minAmount, maxAmount] of area.drops) {
    const amount = randomAmount(minAmount, maxAmount, random);
    if (amount <= 0) continue;
    state.inventory.materials[materialId] = (state.inventory.materials[materialId] ?? 0) + amount;
    gainedMaterials[materialId] = (gainedMaterials[materialId] ?? 0) + amount;
    unlock(state.codex.discoveredMaterialIds, materialId);
  }

  incrementTask(state, "collect", 1);
  pushLog(state, `采集 ${area.name}，获得 ${formatMaterialGain(gainedMaterials)}。`);

  return {
    area,
    gainedMaterials,
  };
}

export function performAlchemy(state, options) {
  const elementIds = [...new Set(options.elementIds ?? [])];
  const random = options.random ?? Math.random;
  const recipe = findRecipe(elementIds);

  if (!recipe) {
    incrementTask(state, "alchemy", 1);
    pushLog(state, "炼金失败：元素没有形成稳定配方。");
    return {
      success: false,
      recipe: null,
      feedback: "元素没有形成稳定配方，可以换一个组合试试。",
      rewards: {},
    };
  }

  assertElementsAvailable(state, elementIds);
  for (const elementId of elementIds) {
    state.inventory.elements[elementId] -= 1;
  }

  const recipeLevel = getLevelFromExp(state.proficiency.recipeExp[recipe.id] ?? 0);
  const schoolLevel = getLevelFromExp(state.proficiency.schoolExp[recipe.school] ?? 0);
  const successRate = calculateSuccessRate({
    baseSuccessRate: recipe.baseSuccessRate,
    recipeLevel,
    schoolLevel,
    furnaceLevel: state.alchemist.furnaceLevel,
    catalystBonus: options.catalystBonus ?? 0,
    materialQualityBonus: options.materialQualityBonus ?? 0,
  });

  incrementTask(state, "alchemy", 1);

  if (random() >= successRate) {
    const rewards = grantAlchemyFailureReward(state, recipe);
    pushLog(state, `炼金失败：${recipe.name} 未稳定成形，获得炼金残渣和灵感。`);
    return {
      success: false,
      recipe,
      successRate,
      feedback: "元素产生了微弱共鸣，但缺少稳定媒介。",
      rewards,
    };
  }

  const quality = rollQuality({
    random: random(),
    recipeLevel,
    schoolLevel,
    unlockLegendary: state.alchemist.level >= 6 && recipeLevel >= 4 && schoolLevel >= 4,
  });
  const itemConfig = ITEM_BY_ID[recipe.outputItemId];
  const item = createItemInstance(state, itemConfig, recipe, quality);
  const isNewRecipe = unlock(state.codex.discoveredRecipeIds, recipe.id);
  unlock(state.codex.discoveredItemIds, item.itemId);
  updateHighestQuality(state, item.itemId, quality);

  state.inventory.items.unshift(item);
  state.proficiency.recipeExp[recipe.id] = (state.proficiency.recipeExp[recipe.id] ?? 0) + recipe.expReward;
  state.proficiency.schoolExp[recipe.school] = (state.proficiency.schoolExp[recipe.school] ?? 0) + 8;
  state.alchemist.exp += 8;
  updateAlchemistLevel(state);

  if (isNewRecipe) {
    incrementTask(state, "discoverRecipe", 1);
  }

  pushLog(state, `炼成 ${itemConfig.name}（${qualityName(quality)}）。`);

  return {
    success: true,
    recipe,
    successRate,
    isNewRecipe,
    item,
    proficiencyDelta: {
      school: recipe.school,
      schoolExp: 8,
      recipeExp: recipe.expReward,
    },
  };
}

export function calculateSuccessRate(input) {
  const rate =
    input.baseSuccessRate +
    input.recipeLevel * 0.01 +
    input.schoolLevel * 0.005 +
    input.furnaceLevel * 0.01 +
    input.catalystBonus +
    input.materialQualityBonus;

  return Number(Math.max(0.05, Math.min(rate, 0.98)).toFixed(4));
}

export function getQualityWeights({ recipeLevel, schoolLevel, unlockLegendary = false }) {
  const weights = {
    common: Math.max(15, 70 - recipeLevel * 1.2 - schoolLevel * 0.8),
    fine: 24 + recipeLevel * 0.6 + schoolLevel * 0.4,
    rare: 5 + recipeLevel * 0.45 + schoolLevel * 0.35,
    epic: Math.max(0, recipeLevel * 0.2 + schoolLevel * 0.16 - 0.2),
    legendary: unlockLegendary ? Math.max(0.3, recipeLevel * 0.05 + schoolLevel * 0.04) : 0,
  };
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / total]));
}

export function rollQuality({ random, recipeLevel, schoolLevel, unlockLegendary = false }) {
  const weights = getQualityWeights({ recipeLevel, schoolLevel, unlockLegendary });
  let cursor = 0;
  for (const quality of QUALITY_ORDER) {
    cursor += weights[quality];
    if (random <= cursor) {
      return quality;
    }
  }
  return "common";
}

export function getLevelFromExp(exp) {
  return Math.floor(Math.sqrt(exp / 100)) + 1;
}

export function getRequiredExpForLevel(level) {
  return (level - 1) * (level - 1) * 100;
}

export function getAlchemyPreview(state, elementIds) {
  const recipe = findRecipe([...new Set(elementIds)]);
  if (!recipe) {
    return {
      recipe: null,
      successRate: 0,
      known: false,
      message: "未发现稳定配方",
    };
  }

  const recipeLevel = getLevelFromExp(state.proficiency.recipeExp[recipe.id] ?? 0);
  const schoolLevel = getLevelFromExp(state.proficiency.schoolExp[recipe.school] ?? 0);
  return {
    recipe,
    known: state.codex.discoveredRecipeIds.includes(recipe.id) || recipe.unlockType === "public",
    successRate: calculateSuccessRate({
      baseSuccessRate: recipe.baseSuccessRate,
      recipeLevel,
      schoolLevel,
      furnaceLevel: state.alchemist.furnaceLevel,
      catalystBonus: 0,
      materialQualityBonus: 0,
    }),
    recipeLevel,
    schoolLevel,
    message: "元素共鸣稳定",
  };
}

export function getAdventurePreview(state, routeId) {
  const route = ADVENTURE_ROUTE_BY_ID[routeId];
  if (!route) throw new Error(`Unknown adventure route: ${routeId}`);

  const itemPower = calculateAdventurePower(state);
  const completionBonus = (state.adventure.routeCompletions[route.id] ?? 0) * 0.015;
  const successRate = clampRate(0.58 + state.alchemist.level * 0.03 + itemPower / 300 + completionBonus - route.difficulty / 100);

  return {
    route,
    itemPower,
    successRate,
    locked: state.alchemist.level < route.minAlchemistLevel,
    canAfford: state.resources.actionPoint >= route.actionPointCost,
  };
}

export function calculateAdventurePower(state) {
  return state.inventory.items.reduce((total, item) => {
    return total + Object.values(item.stats ?? {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }, 0);
}

export function runAdventure(state, routeId, options = {}) {
  const route = ADVENTURE_ROUTE_BY_ID[routeId];
  if (!route) throw new Error(`Unknown adventure route: ${routeId}`);
  if (state.alchemist.level < route.minAlchemistLevel) {
    throw new Error(`${route.name}需要炼金师 Lv.${route.minAlchemistLevel}`);
  }
  if (state.resources.actionPoint < route.actionPointCost) {
    throw new Error("行动力不足，先休整一下");
  }

  const random = options.random ?? Math.random;
  const preview = getAdventurePreview(state, routeId);
  state.resources.actionPoint -= route.actionPointCost;

  const events = route.events.slice(0, route.eventCount).map((event) => {
    const success = random() <= preview.successRate;
    const reward = success ? event.successReward : event.failureReward;
    applyAdventureReward(state, reward);
    return {
      id: event.id,
      title: event.title,
      success,
      line: success ? event.successLine : event.failureLine,
      reward,
    };
  });

  const successCount = events.filter((event) => event.success).length;
  state.adventure.completedRuns += 1;
  state.adventure.routeCompletions[route.id] = (state.adventure.routeCompletions[route.id] ?? 0) + 1;
  state.proficiency.schoolExp[route.school] = (state.proficiency.schoolExp[route.school] ?? 0) + route.schoolExpReward + successCount;
  state.alchemist.exp += route.expReward + successCount * 2;
  updateAlchemistLevel(state);

  const result = {
    route,
    successRate: preview.successRate,
    successCount,
    events,
  };
  state.adventure.lastRun = {
    routeId: route.id,
    routeName: route.name,
    successCount,
    eventCount: events.length,
    events: events.map((event) => ({
      title: event.title,
      success: event.success,
      line: event.line,
      reward: event.reward,
      battle: event.battle ?? null,
    })),
    createdAt: Date.now(),
  };

  pushLog(state, `完成冒险：${route.name}，成功处理 ${successCount}/${events.length} 个事件。`);
  return result;
}

export function startAdventureSession(state, routeId) {
  const route = ADVENTURE_ROUTE_BY_ID[routeId];
  if (!route) throw new Error(`Unknown adventure route: ${routeId}`);
  if (state.adventure.activeRun) throw new Error("已有冒险正在进行");
  if (state.alchemist.level < route.minAlchemistLevel) {
    throw new Error(`${route.name}需要炼金师 Lv.${route.minAlchemistLevel}`);
  }
  if (state.resources.actionPoint < route.actionPointCost) {
    throw new Error("行动力不足，先休整一下");
  }

  const preview = getAdventurePreview(state, routeId);
  state.resources.actionPoint -= route.actionPointCost;
  state.adventure.activeRun = {
    routeId: route.id,
    routeName: route.name,
    sceneId: route.sceneId,
    successRate: preview.successRate,
    nextEventIndex: 0,
    successCount: 0,
    events: [],
    startedAt: Date.now(),
  };
  pushLog(state, `出发冒险：${route.name}。`);

  return {
    ...state.adventure.activeRun,
    route,
    currentEvent: route.events[0],
  };
}

export function getActiveAdventureEvent(state) {
  const activeRun = state.adventure.activeRun;
  if (!activeRun) return null;
  const route = ADVENTURE_ROUTE_BY_ID[activeRun.routeId];
  if (!route) return null;
  const event = route.events[activeRun.nextEventIndex];
  return event ? { route, event, index: activeRun.nextEventIndex } : null;
}

export function resolveAdventureEvent(state, options = {}) {
  const active = getActiveAdventureEvent(state);
  if (!active) throw new Error("当前没有可处理的冒险事件");
  if (state.adventure.activeRun.activeBattle) throw new Error("先完成当前战斗");
  if (active.event.encounter) throw new Error("当前事件是遭遇战，需要先完成遭遇战");

  const random = options.random ?? Math.random;
  const success = random() <= state.adventure.activeRun.successRate;
  return finishAdventureEvent(state, active, success);
}

export function startAdventureBattle(state) {
  const active = getActiveAdventureEvent(state);
  if (!active) throw new Error("当前没有可处理的冒险事件");
  if (state.adventure.activeRun.activeBattle) return state.adventure.activeRun.activeBattle;
  if (!active.event.encounter) throw new Error("当前事件没有遭遇战");

  const stats = calculateBattleStats(state, active.route);
  const enemy = active.event.encounter;
  const battle = {
    eventId: active.event.id,
    eventTitle: active.event.title,
    routeId: active.route.id,
    enemyId: enemy.id,
    enemyName: enemy.name,
    enemyDescription: enemy.description,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.hp,
    enemyAttack: enemy.attack,
    enemyDefense: enemy.defense,
    playerHp: stats.maxHp,
    playerMaxHp: stats.maxHp,
    turn: 1,
    lastAction: "intro",
    stats,
    logs: [`遭遇 ${enemy.name}，进入回合战。`],
  };
  state.adventure.activeRun.activeBattle = battle;
  pushLog(state, `遭遇战：${enemy.name}。`);
  return battle;
}

export function takeBattleTurn(state, action, options = {}) {
  const active = getActiveAdventureEvent(state);
  const battle = state.adventure.activeRun?.activeBattle;
  if (!active || !battle) throw new Error("当前没有进行中的战斗");
  if (battle.eventId !== active.event.id) throw new Error("战斗事件状态异常");

  const battleAction = normalizeBattleAction(action);
  const playerResult = applyPlayerBattleAction(battle, battleAction, options.random ?? Math.random);
  battle.lastAction = battleAction;
  if (battle.enemyHp <= 0) {
    const adventure = finishBattleAdventureEvent(state, active, true, battle, `${playerResult.label}击退了${battle.enemyName}。`);
    return {
      action: battleAction,
      battleComplete: true,
      won: true,
      playerResult,
      battle: { ...battle, enemyHp: 0 },
      adventure,
    };
  }

  const enemyResult = applyEnemyBattleAction(battle, battleAction);
  if (battle.playerHp <= 0) {
    const adventure = finishBattleAdventureEvent(state, active, false, battle, `${battle.enemyName}占了上风，你暂时撤退。`);
    return {
      action: battleAction,
      battleComplete: true,
      won: false,
      playerResult,
      enemyResult,
      battle: { ...battle, playerHp: 0 },
      adventure,
    };
  }

  battle.turn += 1;
  battle.logs = [...battle.logs, `${playerResult.line} ${enemyResult.line}`].slice(-5);
  return {
    action: battleAction,
    battleComplete: false,
    won: false,
    playerResult,
    enemyResult,
    battle,
  };
}

function finishBattleAdventureEvent(state, active, success, battle, battleLine) {
  battle.logs = [...battle.logs, battleLine].slice(-5);
  state.adventure.activeRun.activeBattle = null;
  return finishAdventureEvent(state, active, success, {
    line: success ? active.event.successLine : active.event.failureLine,
    battle: {
      enemyName: battle.enemyName,
      turns: battle.turn,
      outcome: success ? "win" : "lose",
      line: battleLine,
    },
  });
}

function finishAdventureEvent(state, active, success, options = {}) {
  const reward = success ? active.event.successReward : active.event.failureReward;
  applyAdventureReward(state, reward);

  const resolved = {
    id: active.event.id,
    title: active.event.title,
    success,
    line: options.line ?? (success ? active.event.successLine : active.event.failureLine),
    reward,
    battle: options.battle ?? null,
  };
  state.adventure.activeRun.events.push(resolved);
  if (success) state.adventure.activeRun.successCount += 1;
  state.adventure.activeRun.nextEventIndex += 1;

  const complete = state.adventure.activeRun.nextEventIndex >= active.route.eventCount;
  if (!complete) {
    pushLog(state, `冒险事件：${resolved.title} ${success ? "处理成功" : "处理失手"}。`);
    return {
      route: active.route,
      event: resolved,
      complete: false,
      nextEvent: active.route.events[state.adventure.activeRun.nextEventIndex],
    };
  }

  const successCount = state.adventure.activeRun.successCount;
  const events = state.adventure.activeRun.events;
  state.adventure.completedRuns += 1;
  state.adventure.routeCompletions[active.route.id] = (state.adventure.routeCompletions[active.route.id] ?? 0) + 1;
  state.proficiency.schoolExp[active.route.school] = (state.proficiency.schoolExp[active.route.school] ?? 0) + active.route.schoolExpReward + successCount;
  state.alchemist.exp += active.route.expReward + successCount * 2;
  updateAlchemistLevel(state);
  state.adventure.lastRun = {
    routeId: active.route.id,
    routeName: active.route.name,
    successCount,
    eventCount: events.length,
    events: events.map((event) => ({
      title: event.title,
      success: event.success,
      line: event.line,
      reward: event.reward,
      battle: event.battle ?? null,
    })),
    createdAt: Date.now(),
  };
  state.adventure.activeRun = null;
  pushLog(state, `完成冒险：${active.route.name}，成功处理 ${successCount}/${events.length} 个事件。`);

  return {
    route: active.route,
    event: resolved,
    complete: true,
    successCount,
    events,
  };
}

function calculateBattleStats(state, route) {
  const itemStats = aggregateItemStats(state);
  const schoolLevel = getLevelFromExp(state.proficiency.schoolExp[route.school] ?? 0);
  const maxHp = Math.round(42 + state.alchemist.level * 6 + (itemStats.defense ?? 0) * 0.45 + (itemStats.sustain ?? 0) * 0.35);
  return {
    maxHp,
    attack: Math.round(10 + state.alchemist.level * 2 + (itemStats.attack ?? 0) * 0.18 + (itemStats.mobility ?? 0) * 0.08),
    alchemy: Math.round(12 + schoolLevel * 2 + (itemStats.control ?? 0) * 0.18 + (itemStats.discovery ?? 0) * 0.1),
    defense: Math.round(3 + (itemStats.defense ?? 0) * 0.12 + (itemStats.sustain ?? 0) * 0.08),
    heal: Math.round(4 + (itemStats.heal ?? 0) * 0.12 + (itemStats.sustain ?? 0) * 0.14),
  };
}

function aggregateItemStats(state) {
  return state.inventory.items.reduce((stats, item) => {
    for (const [key, value] of Object.entries(item.stats ?? {})) {
      stats[key] = (stats[key] ?? 0) + Number(value || 0);
    }
    return stats;
  }, {});
}

function normalizeBattleAction(action) {
  if (["attack", "alchemy", "guard"].includes(action)) return action;
  throw new Error("未知战斗行动");
}

function applyPlayerBattleAction(battle, action, random) {
  if (action === "guard") {
    const damage = Math.max(1, Math.round(battle.stats.attack * 0.45 - battle.enemyDefense));
    const healed = Math.min(battle.stats.heal, battle.playerMaxHp - battle.playerHp);
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.playerHp += healed;
    return {
      label: "守势反击",
      damage,
      healed,
      line: `守势反击造成 ${damage} 点伤害${healed ? `，回复 ${healed} 点生命` : ""}。`,
    };
  }

  const baseDamage = action === "alchemy" ? battle.stats.alchemy : battle.stats.attack;
  const variance = 0.94 + random() * 0.12;
  const damage = Math.max(1, Math.round(baseDamage * variance - battle.enemyDefense));
  battle.enemyHp = Math.max(0, battle.enemyHp - damage);
  if (action === "alchemy") {
    const healed = Math.min(Math.max(1, Math.floor(battle.stats.heal / 2)), battle.playerMaxHp - battle.playerHp);
    battle.playerHp += healed;
    return {
      label: "炼金术",
      damage,
      healed,
      line: `炼金术造成 ${damage} 点伤害${healed ? `，稳定回复 ${healed} 点生命` : ""}。`,
    };
  }

  return {
    label: "普通攻击",
    damage,
    healed: 0,
    line: `普通攻击造成 ${damage} 点伤害。`,
  };
}

function applyEnemyBattleAction(battle, playerAction) {
  const guardMultiplier = playerAction === "guard" ? 0.45 : 1;
  const damage = Math.max(1, Math.round((battle.enemyAttack - battle.stats.defense) * guardMultiplier));
  battle.playerHp = Math.max(0, battle.playerHp - damage);
  return {
    damage,
    line: `${battle.enemyName}反击造成 ${damage} 点伤害。`,
  };
}

export function claimTaskReward(state, taskId) {
  const task = TASK_BY_ID[taskId];
  if (!task) throw new Error(`Unknown task: ${taskId}`);
  if (state.tasks.claimedIds.includes(taskId)) throw new Error("任务奖励已领取");
  if ((state.tasks.progress[task.metric] ?? 0) < task.target) throw new Error("任务尚未完成");

  state.tasks.claimedIds.push(taskId);
  state.resources.coins += task.reward.coins ?? 0;
  state.resources.inspiration += task.reward.inspiration ?? 0;
  pushLog(state, `领取任务奖励：${task.title}。`);

  return task.reward;
}

export function interactWithNpc(state, npc) {
  if (!npc?.id) throw new Error("Unknown NPC");

  const firstTalk = !state.social.talkedNpcIds.includes(npc.id);
  unlock(state.social.talkedNpcIds, npc.id);

  let rewardClaimed = false;
  const reward = npc.reward ?? null;
  if (reward && !state.social.claimedNpcRewardIds.includes(npc.id)) {
    applyNpcReward(state, reward);
    state.social.claimedNpcRewardIds.push(npc.id);
    rewardClaimed = true;
  }

  const line = firstTalk ? npc.line : npc.repeatLine || npc.line;
  pushLog(state, `与 ${npc.name ?? "NPC"} 交谈：${line}`);

  return {
    npc,
    line,
    firstTalk,
    reward,
    rewardClaimed,
  };
}

function emptyMaterialRecord() {
  return Object.fromEntries(MATERIALS.map((material) => [material.id, 0]));
}

function emptyElementRecord() {
  return Object.fromEntries(ELEMENTS.map((element) => [element.id, 0]));
}

function assertElementsAvailable(state, elementIds) {
  for (const elementId of elementIds) {
    if ((state.inventory.elements[elementId] ?? 0) < 1) {
      throw new Error(`Not enough element: ${elementId}`);
    }
  }
}

function createItemInstance(state, itemConfig, recipe, quality) {
  const multiplier = QUALITY_MULTIPLIER[quality];
  const stats = Object.fromEntries(
    Object.entries(itemConfig.baseStats).map(([key, value]) => [key, Math.round(value * multiplier)])
  );

  return {
    instanceId: `item_${String(state.nextItemSeq++).padStart(4, "0")}`,
    itemId: itemConfig.id,
    name: itemConfig.name,
    category: itemConfig.category,
    school: itemConfig.school,
    quality,
    stats,
    createdByRecipeId: recipe.id,
    locked: false,
    createdAt: Date.now(),
  };
}

function grantAlchemyFailureReward(state, recipe) {
  state.inventory.materials.alchemy_residue = (state.inventory.materials.alchemy_residue ?? 0) + 2;
  state.resources.inspiration += 1;
  state.proficiency.recipeExp[recipe.id] = (state.proficiency.recipeExp[recipe.id] ?? 0) + 3;
  state.proficiency.schoolExp[recipe.school] = (state.proficiency.schoolExp[recipe.school] ?? 0) + 1;

  return {
    alchemy_residue: 2,
    inspiration: 1,
    recipeExp: 3,
  };
}

function applyNpcReward(state, reward) {
  state.resources.coins += reward.coins ?? 0;
  state.resources.inspiration += reward.inspiration ?? 0;
  if (reward.actionPoint) {
    state.resources.actionPoint = Math.min(state.resources.maxActionPoint, state.resources.actionPoint + reward.actionPoint);
  }

  for (const [materialId, count] of Object.entries(reward.materials ?? {})) {
    state.inventory.materials[materialId] = (state.inventory.materials[materialId] ?? 0) + count;
    unlock(state.codex.discoveredMaterialIds, materialId);
  }

  for (const [elementId, count] of Object.entries(reward.elements ?? {})) {
    state.inventory.elements[elementId] = (state.inventory.elements[elementId] ?? 0) + count;
    unlock(state.codex.discoveredElementIds, elementId);
  }

  pushLog(state, `获得 NPC 赠礼：${formatRewardGain(reward)}。`);
}

function applyAdventureReward(state, reward) {
  state.resources.coins += reward.coins ?? 0;
  state.resources.inspiration += reward.inspiration ?? 0;
  for (const [materialId, count] of Object.entries(reward.materials ?? {})) {
    state.inventory.materials[materialId] = (state.inventory.materials[materialId] ?? 0) + count;
    unlock(state.codex.discoveredMaterialIds, materialId);
  }
  for (const [elementId, count] of Object.entries(reward.elements ?? {})) {
    state.inventory.elements[elementId] = (state.inventory.elements[elementId] ?? 0) + count;
    unlock(state.codex.discoveredElementIds, elementId);
  }
}

function updateHighestQuality(state, itemId, quality) {
  const current = state.codex.highestItemQuality[itemId];
  if (!current || qualityRank(quality) > qualityRank(current)) {
    state.codex.highestItemQuality[itemId] = quality;
  }
}

function qualityRank(quality) {
  return ["common", "fine", "rare", "epic", "legendary"].indexOf(quality);
}

function unlock(collection, id) {
  if (collection.includes(id)) return false;
  collection.push(id);
  return true;
}

function incrementTask(state, metric, amount) {
  state.tasks.progress[metric] = (state.tasks.progress[metric] ?? 0) + amount;
}

function updateAlchemistLevel(state) {
  state.alchemist.level = getLevelFromExp(state.alchemist.exp);
}

function randomAmount(minAmount, maxAmount, random) {
  if (maxAmount <= minAmount) return minAmount;
  return minAmount + Math.floor(random() * (maxAmount - minAmount + 1));
}

function clampRate(value) {
  return Number(Math.max(0.25, Math.min(value, 0.95)).toFixed(4));
}

function pushLog(state, message) {
  state.recentLogs.unshift(message);
  state.recentLogs = state.recentLogs.slice(0, 8);
}

function formatElementGain(gainedElements) {
  const entries = Object.entries(gainedElements);
  if (entries.length === 0) return "少量灵感";
  return entries.map(([id, count]) => `${id} x${count}`).join("、");
}

function formatMaterialGain(gainedMaterials) {
  const entries = Object.entries(gainedMaterials);
  if (entries.length === 0) return "没有可用材料";
  return entries.map(([id, count]) => `${MATERIAL_BY_ID[id]?.name ?? id} x${count}`).join("、");
}

function formatRewardGain(reward) {
  const entries = [];
  if (reward.coins) entries.push(`金币 x${reward.coins}`);
  if (reward.inspiration) entries.push(`灵感 x${reward.inspiration}`);
  if (reward.actionPoint) entries.push(`行动力 x${reward.actionPoint}`);
  for (const [id, count] of Object.entries(reward.materials ?? {})) {
    entries.push(`${MATERIAL_BY_ID[id]?.name ?? id} x${count}`);
  }
  for (const [id, count] of Object.entries(reward.elements ?? {})) {
    entries.push(`${id} x${count}`);
  }
  return entries.join("、") || "一句提示";
}

function qualityName(quality) {
  return {
    common: "普通",
    fine: "优秀",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说",
  }[quality];
}
