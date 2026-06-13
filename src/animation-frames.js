const SPRITE_ANIMATIONS = {
  avatar: {
    walk: plan("anim-avatar-walk", 4, 520, "steps(4, end)", "feet"),
    idle: plan("anim-avatar-idle", 4, 1200, "steps(4, end)", "feet"),
  },
  npc: {
    idle: plan("anim-npc-idle", 4, 1280, "steps(4, end)", "bottom"),
    wave: plan("anim-npc-wave", 4, 900, "steps(4, end)", "bottom"),
  },
  enemy: {
    idle: plan("anim-enemy-idle", 4, 980, "steps(4, end)", "bottom"),
    hurt: plan("anim-enemy-hurt", 4, 520, "steps(4, end)", "bottom"),
  },
};

const BATTLE_MOTIONS = {
  intro: battlePlan("intro", ["flash", "enter", "ready", "hold"], "effect-encounter-cut", 4, 1100),
  attack: battlePlan("attack", ["anticipation", "lunge", "impact", "recover"], "effect-slash", 4, 560),
  alchemy: battlePlan("alchemy", ["focus", "gather", "release", "beam", "spark", "settle"], "effect-alchemy-beam", 6, 720),
  guard: battlePlan("guard", ["brace", "shield", "counter", "settle"], "effect-shield", 4, 700),
};

const UI_MOTIONS = {
  drawer: uiPlan("drawer", "motion-drawer-rise", 260),
  card: uiPlan("card", "motion-card-pop", 220),
  icon: uiPlan("icon", "motion-icon-bob", 760),
  progress: uiPlan("progress", "motion-progress-fill", 560),
};

export function getSpriteAnimationPlan(asset, action = "idle") {
  return SPRITE_ANIMATIONS[asset]?.[action] ?? SPRITE_ANIMATIONS.avatar.idle;
}

export function getBattleMotionPlan(motion = "intro") {
  return BATTLE_MOTIONS[motion] ?? BATTLE_MOTIONS.intro;
}

export function getUiMotionPlan(id) {
  return UI_MOTIONS[id] ?? UI_MOTIONS.card;
}

function plan(cssClass, frameCount, durationMs, timing, anchor) {
  return { cssClass, frameCount, durationMs, timing, anchor };
}

function battlePlan(id, phases, effectClass, frameCount, durationMs) {
  return { id, phases, effectClass, frameCount, durationMs, cssClass: `battle-motion-${id}` };
}

function uiPlan(id, cssClass, durationMs) {
  return { id, cssClass, durationMs };
}
