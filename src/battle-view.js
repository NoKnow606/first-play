const ENEMY_SPRITE_BY_ID = {
  berry_slime: "slime",
  ember_bat: "bat",
  tether_construct: "construct",
};

const EFFECT_BY_ACTION = {
  intro: "spark",
  attack: "slash",
  alchemy: "alchemy",
  guard: "shield",
};

export function getBattlePresentation(battle, scene = {}) {
  const motion = normalizeMotion(battle.lastAction);
  return {
    sceneClass: `battle-scene-${scene.id ?? "workshop"}`,
    motion,
    effect: EFFECT_BY_ACTION[motion],
    enemySprite: ENEMY_SPRITE_BY_ID[battle.enemyId] ?? "construct",
    playerPercent: percent(battle.playerHp, battle.playerMaxHp),
    enemyPercent: percent(battle.enemyHp, battle.enemyMaxHp),
    caption: battle.logs.at(-1) ?? "遭遇战开始。",
  };
}

function normalizeMotion(action) {
  return ["attack", "alchemy", "guard"].includes(action) ? action : "intro";
}

function percent(value, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}
