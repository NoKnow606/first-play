export const QUALITIES = ["common", "fine", "rare", "epic", "legendary"];

export const QUALITY_LABELS = {
  common: "普通",
  fine: "优秀",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

export const QUALITY_CLASS = {
  common: "quality-common",
  fine: "quality-fine",
  rare: "quality-rare",
  epic: "quality-epic",
  legendary: "quality-legendary",
};

export const SCHOOL_LABELS = {
  life: "生命炼金",
  weapon: "武器炼金",
  mechanical: "机械炼金",
};

export const CATEGORY_LABELS = {
  potion: "药剂",
  weapon: "武器",
  armor: "铠甲",
  aircraft: "飞行器",
  trinket: "饰品",
  tool: "装置",
  catalyst: "催化剂",
  junk: "副产物",
};

export const ELEMENTS = [
  { id: "fire", name: "火", schoolTags: ["weapon", "mechanical"], description: "攻击、爆炸、锻造。" },
  { id: "water", name: "水", schoolTags: ["life"], description: "治疗、净化、冷却。" },
  { id: "earth", name: "土", schoolTags: ["mechanical"], description: "防护、承载、矿物。" },
  { id: "wind", name: "风", schoolTags: ["mechanical"], description: "速度、飞行、闪避。" },
  { id: "metal", name: "金", schoolTags: ["weapon", "mechanical"], description: "武器、结构、强化。" },
  { id: "wood", name: "木", schoolTags: ["life"], description: "生长、草药、恢复。" },
  { id: "life", name: "生命", schoolTags: ["life"], description: "治疗、复苏、活化。" },
  { id: "mechanical", name: "机械", schoolTags: ["mechanical"], description: "装置、飞行器、自动化。" },
];

export const MATERIALS = [
  material("dew_herb", "露水草", "common", ["starter_meadow"], [["water", 1, 1], ["life", 1, 1]]),
  material("wood_branch", "木枝", "common", ["starter_meadow"], [["wood", 1, 1], ["earth", 0, 1]]),
  material("flint", "燧石", "common", ["starter_meadow", "shallow_mine"], [["fire", 1, 1], ["earth", 1, 1]]),
  material("copper_ore", "青铜矿", "common", ["shallow_mine"], [["metal", 1, 1], ["earth", 1, 1]]),
  material("iron_sand", "铁砂", "common", ["shallow_mine"], [["metal", 1, 2], ["fire", 0, 1]]),
  material("wind_feather", "风羽", "fine", ["mist_forest"], [["wind", 1, 2], ["life", 0, 1]]),
  material("beast_bone", "兽骨", "fine", ["mist_forest"], [["earth", 1, 2], ["life", 0, 1]]),
  material("rusted_gear", "锈齿轮", "fine", ["old_ruins"], [["mechanical", 1, 2], ["metal", 1, 1]]),
  material("glow_moss", "微光苔", "fine", ["mist_forest"], [["life", 1, 2], ["fire", 0, 1]]),
  material("clear_spring", "清泉水", "common", ["starter_meadow"], [["water", 1, 2], ["wind", 0, 1]]),
  material("red_berry", "红浆果", "common", ["starter_meadow"], [["life", 1, 1], ["wood", 1, 1]]),
  material("tough_hide", "韧皮革", "fine", ["mist_forest"], [["earth", 1, 1], ["wood", 1, 1]]),
  material("silver_ore", "银矿", "rare", ["shallow_mine"], [["metal", 2, 3], ["water", 0, 1]]),
  material("amber_resin", "琥珀脂", "fine", ["mist_forest"], [["wood", 1, 2], ["fire", 0, 1]]),
  material("magnetic_stone", "磁石", "rare", ["old_ruins"], [["metal", 1, 2], ["mechanical", 1, 2]]),
  material("cloud_silk", "云丝", "rare", ["sky_ridge"], [["wind", 2, 3], ["water", 0, 1]]),
  material("oil_seed", "油籽", "common", ["starter_meadow"], [["fire", 1, 1], ["wood", 1, 1]]),
  material("clay", "黏土", "common", ["starter_meadow"], [["earth", 1, 1], ["water", 1, 1]]),
  material("charcoal", "木炭", "common", ["shallow_mine"], [["fire", 1, 2], ["wood", 0, 1]]),
  material("thorn_vine", "刺藤", "fine", ["mist_forest"], [["wood", 1, 2], ["metal", 0, 1]]),
  material("quartz_shard", "石英碎片", "fine", ["shallow_mine"], [["earth", 1, 2], ["wind", 0, 1]]),
  material("bat_wing", "蝠翼", "fine", ["old_ruins"], [["wind", 1, 2], ["fire", 0, 1]]),
  material("clockwork_spring", "发条弹簧", "rare", ["old_ruins"], [["mechanical", 2, 3], ["wind", 0, 1]]),
  material("mist_flower", "雾花", "fine", ["mist_forest"], [["water", 1, 2], ["life", 1, 1]]),
  material("sun_seed", "日光种", "rare", ["sky_ridge"], [["fire", 1, 2], ["life", 1, 2]]),
  material("stone_shell", "石壳", "fine", ["shallow_mine"], [["earth", 2, 2], ["metal", 0, 1]]),
  material("blue_crystal", "蓝晶", "rare", ["old_ruins"], [["water", 1, 2], ["metal", 1, 2]]),
  material("ember_core", "余烬核心", "rare", ["old_ruins"], [["fire", 2, 3], ["mechanical", 0, 1]]),
  material("ancient_screw", "古代螺钉", "rare", ["old_ruins"], [["mechanical", 1, 3], ["earth", 0, 1]]),
  material("life_spore", "生命孢子", "rare", ["mist_forest"], [["life", 2, 3], ["wood", 1, 1]]),
  {
    id: "alchemy_residue",
    name: "炼金残渣",
    quality: "common",
    sourceAreaIds: [],
    refineOutputs: [],
    directAlchemyTags: ["residue"],
    description: "失败炼金留下的可回收副产物。",
  },
];

export const AREAS = [
  {
    id: "starter_meadow",
    name: "新手草地",
    minAlchemistLevel: 1,
    actionPointCost: 0,
    drops: [
      ["dew_herb", 3, 5],
      ["wood_branch", 2, 4],
      ["flint", 1, 3],
      ["red_berry", 1, 2],
      ["clay", 1, 2],
    ],
    description: "适合新手采集草药、木枝和基础矿物。",
  },
  {
    id: "shallow_mine",
    name: "矿洞浅层",
    minAlchemistLevel: 2,
    actionPointCost: 2,
    drops: [
      ["copper_ore", 2, 4],
      ["iron_sand", 1, 3],
      ["charcoal", 1, 3],
      ["quartz_shard", 1, 2],
      ["stone_shell", 1, 2],
    ],
    description: "出产金属和土系材料。",
  },
  {
    id: "mist_forest",
    name: "迷雾森林",
    minAlchemistLevel: 3,
    actionPointCost: 3,
    drops: [
      ["wind_feather", 1, 3],
      ["beast_bone", 1, 3],
      ["glow_moss", 1, 2],
      ["thorn_vine", 1, 2],
      ["life_spore", 0, 1],
    ],
    description: "适合寻找生命、木和风相关素材。",
  },
  {
    id: "old_ruins",
    name: "旧机械废墟",
    minAlchemistLevel: 4,
    actionPointCost: 4,
    drops: [
      ["rusted_gear", 2, 4],
      ["magnetic_stone", 0, 2],
      ["bat_wing", 1, 2],
      ["blue_crystal", 0, 2],
      ["ancient_screw", 0, 1],
    ],
    description: "机械学派的重要材料来源。",
  },
  {
    id: "sky_ridge",
    name: "浮空岛入口",
    minAlchemistLevel: 5,
    actionPointCost: 5,
    drops: [
      ["cloud_silk", 1, 2],
      ["sun_seed", 0, 2],
      ["ember_core", 0, 2],
      ["wind_feather", 1, 3],
      ["clockwork_spring", 0, 1],
    ],
    description: "需要更高等级才能稳定探索的后期采集点。",
  },
];

export const ITEMS = [
  item("small_healing_potion", "小型治疗药剂", "potion", "life", { heal: 30 }),
  item("fresh_bandage", "新鲜绷带", "potion", "life", { heal: 18, sustain: 6 }),
  item("clear_antidote", "清澈解毒剂", "potion", "life", { cleanse: 24 }),
  item("stamina_draught", "耐力药酒", "potion", "life", { sustain: 28 }),
  item("growth_elixir", "生长灵药", "potion", "life", { heal: 20, discovery: 8 }),
  item("cooling_salve", "冷却药膏", "potion", "life", { defense: 8, cleanse: 12 }),
  item("wind_tonic", "轻风补剂", "potion", "life", { mobility: 18 }),
  item("iron_skin_potion", "铁肤药剂", "potion", "life", { defense: 22 }),
  item("sleep_mist", "安眠雾瓶", "potion", "life", { control: 22 }),
  item("revive_spark", "复苏火花", "potion", "life", { heal: 45, rarity: 8 }),
  item("thorn_dagger", "刺藤短匕", "weapon", "weapon", { attack: 24 }),
  item("flint_bomb", "燧石炸弹", "weapon", "weapon", { attack: 30 }),
  item("bronze_blade", "青铜刃", "weapon", "weapon", { attack: 28 }),
  item("wind_crossbow", "疾风弩", "weapon", "weapon", { attack: 20, mobility: 8 }),
  item("bone_spear", "骨矛", "weapon", "weapon", { attack: 26, defense: 4 }),
  item("fire_arrow", "火焰箭束", "weapon", "weapon", { attack: 34 }),
  item("shock_trap", "震荡陷阱", "weapon", "weapon", { attack: 25, control: 10 }),
  item("frost_orb", "霜晶法球", "weapon", "weapon", { attack: 22, control: 12 }),
  item("stone_hammer", "石锤", "weapon", "weapon", { attack: 32 }),
  item("flame_projector", "火焰喷射器", "weapon", "weapon", { attack: 42 }),
  item("gear_drone", "齿轮助手", "tool", "mechanical", { discovery: 18 }),
  item("simple_glider", "简易滑翔翼", "aircraft", "mechanical", { mobility: 35 }),
  item("auto_collector", "自动采集器", "tool", "mechanical", { discovery: 28 }),
  item("survey_lens", "勘探透镜", "tool", "mechanical", { discovery: 20 }),
  item("spring_boots", "弹簧靴", "tool", "mechanical", { mobility: 22 }),
  item("steam_core", "蒸汽核心", "tool", "mechanical", { attack: 8, mobility: 18 }),
  item("magnetic_compass", "磁力罗盘", "tool", "mechanical", { discovery: 24 }),
  item("repair_kit", "修理套件", "tool", "mechanical", { defense: 12, sustain: 12 }),
  item("clockwork_shield", "发条护盾", "armor", "mechanical", { defense: 34 }),
  item("air_pump", "风压泵", "tool", "mechanical", { mobility: 18, defense: 6 }),
  item("guardian_charm", "守护符", "trinket", "life", { defense: 18 }),
  item("healing_bomb", "治疗爆瓶", "potion", "life", { heal: 24, control: 6 }),
  item("alloy_plate", "合金胸甲", "armor", "mechanical", { defense: 30 }),
  item("scouting_kite", "侦察纸鸢", "aircraft", "mechanical", { mobility: 25, discovery: 8 }),
  item("purifier_lantern", "净化提灯", "tool", "life", { cleanse: 28 }),
  item("venom_needle", "毒刺针", "weapon", "weapon", { attack: 18, control: 14 }),
  item("living_armor", "活体藤甲", "armor", "life", { defense: 24, sustain: 10 }),
  item("seed_cannon", "种子炮", "weapon", "weapon", { attack: 36 }),
  item("mist_engine", "雾化引擎", "aircraft", "mechanical", { mobility: 28, discovery: 10 }),
  item("sky_anchor", "定风锚", "tool", "mechanical", { defense: 18, mobility: 12 }),
];

export const RECIPES = [
  recipe("small_healing_potion", "小型治疗药剂", "life", ["water", "wood"], 0.9, "public"),
  recipe("fresh_bandage", "新鲜绷带", "life", ["life", "wood"], 0.86, "public"),
  recipe("clear_antidote", "清澈解毒剂", "life", ["water", "life"], 0.84, "public"),
  recipe("stamina_draught", "耐力药酒", "life", ["fire", "life"], 0.78, "hidden"),
  recipe("growth_elixir", "生长灵药", "life", ["earth", "life", "wood"], 0.68, "hidden"),
  recipe("cooling_salve", "冷却药膏", "life", ["water", "earth"], 0.8, "hidden"),
  recipe("wind_tonic", "轻风补剂", "life", ["wind", "life"], 0.78, "hidden"),
  recipe("iron_skin_potion", "铁肤药剂", "life", ["metal", "life"], 0.74, "hidden"),
  recipe("sleep_mist", "安眠雾瓶", "life", ["water", "wind", "life"], 0.64, "hidden"),
  recipe("revive_spark", "复苏火花", "life", ["fire", "water", "life"], 0.52, "rare"),
  recipe("thorn_dagger", "刺藤短匕", "weapon", ["wood", "metal"], 0.82, "public"),
  recipe("flint_bomb", "燧石炸弹", "weapon", ["fire", "earth"], 0.86, "public"),
  recipe("bronze_blade", "青铜刃", "weapon", ["fire", "metal"], 0.78, "hidden"),
  recipe("wind_crossbow", "疾风弩", "weapon", ["wind", "metal"], 0.76, "hidden"),
  recipe("bone_spear", "骨矛", "weapon", ["earth", "wood", "metal"], 0.7, "hidden"),
  recipe("fire_arrow", "火焰箭束", "weapon", ["fire", "wood", "wind"], 0.7, "hidden"),
  recipe("shock_trap", "震荡陷阱", "weapon", ["mechanical", "metal", "fire"], 0.62, "hidden"),
  recipe("frost_orb", "霜晶法球", "weapon", ["water", "metal", "wind"], 0.66, "hidden"),
  recipe("stone_hammer", "石锤", "weapon", ["earth", "metal"], 0.82, "hidden"),
  recipe("flame_projector", "火焰喷射器", "weapon", ["fire", "mechanical", "metal"], 0.6, "rare"),
  recipe("gear_drone", "齿轮助手", "mechanical", ["mechanical", "wind"], 0.74, "hidden"),
  recipe("simple_glider", "简易滑翔翼", "mechanical", ["wind", "wood", "mechanical"], 0.68, "public"),
  recipe("auto_collector", "自动采集器", "mechanical", ["mechanical", "wood", "metal"], 0.62, "hidden"),
  recipe("survey_lens", "勘探透镜", "mechanical", ["mechanical", "water"], 0.72, "hidden"),
  recipe("spring_boots", "弹簧靴", "mechanical", ["mechanical", "earth", "wind"], 0.66, "hidden"),
  recipe("steam_core", "蒸汽核心", "mechanical", ["fire", "water", "mechanical"], 0.64, "hidden"),
  recipe("magnetic_compass", "磁力罗盘", "mechanical", ["metal", "mechanical"], 0.78, "public"),
  recipe("repair_kit", "修理套件", "mechanical", ["wood", "mechanical"], 0.8, "hidden"),
  recipe("clockwork_shield", "发条护盾", "mechanical", ["earth", "mechanical", "metal"], 0.64, "hidden"),
  recipe("air_pump", "风压泵", "mechanical", ["wind", "earth", "mechanical"], 0.68, "hidden"),
  recipe("guardian_charm", "守护符", "life", ["earth", "life"], 0.78, "hidden"),
  recipe("healing_bomb", "治疗爆瓶", "life", ["fire", "water", "wood"], 0.66, "hidden"),
  recipe("alloy_plate", "合金胸甲", "mechanical", ["earth", "metal", "fire"], 0.66, "hidden"),
  recipe("scouting_kite", "侦察纸鸢", "mechanical", ["wind", "wood"], 0.82, "hidden"),
  recipe("purifier_lantern", "净化提灯", "life", ["fire", "water", "metal"], 0.66, "hidden"),
  recipe("venom_needle", "毒刺针", "weapon", ["wood", "wind", "metal"], 0.68, "hidden"),
  recipe("living_armor", "活体藤甲", "life", ["earth", "life", "metal"], 0.62, "rare"),
  recipe("seed_cannon", "种子炮", "weapon", ["fire", "wood", "mechanical"], 0.62, "hidden"),
  recipe("mist_engine", "雾化引擎", "mechanical", ["water", "wind", "mechanical"], 0.6, "rare"),
  recipe("sky_anchor", "定风锚", "mechanical", ["wind", "earth", "metal"], 0.64, "hidden"),
];

export const TASKS = [
  { id: "daily_collect_1", title: "采集 1 次", metric: "collect", target: 1, reward: { coins: 30 } },
  { id: "daily_refine_3", title: "提炼 3 次", metric: "refine", target: 3, reward: { coins: 40, inspiration: 1 } },
  { id: "daily_alchemy_3", title: "炼金 3 次", metric: "alchemy", target: 3, reward: { coins: 60, inspiration: 2 } },
  { id: "daily_discover_1", title: "发现 1 个新配方", metric: "discoverRecipe", target: 1, reward: { coins: 80, inspiration: 2 } },
];

export const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((entry) => [entry.id, entry]));
export const ELEMENT_BY_ID = Object.fromEntries(ELEMENTS.map((entry) => [entry.id, entry]));
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((entry) => [entry.id, entry]));
export const AREA_BY_ID = Object.fromEntries(AREAS.map((entry) => [entry.id, entry]));
export const TASK_BY_ID = Object.fromEntries(TASKS.map((entry) => [entry.id, entry]));

function material(id, name, quality, sourceAreaIds, outputs) {
  return {
    id,
    name,
    quality,
    sourceAreaIds,
    refineOutputs: outputs.map(([elementId, minAmount, maxAmount]) => ({
      elementId,
      minAmount,
      maxAmount,
      weight: 1,
    })),
    directAlchemyTags: [],
    description: "",
  };
}

function item(id, name, category, school, baseStats) {
  return {
    id,
    name,
    category,
    school,
    baseStats,
    effectIds: Object.keys(baseStats),
    usableInAdventure: true,
    usableInPk: category !== "tool",
  };
}

function recipe(id, name, school, inputElementIds, baseSuccessRate, unlockType) {
  return {
    id,
    name,
    school,
    inputElementIds,
    optionalMaterialTagIds: [],
    requiredCatalystIds: [],
    outputItemId: id,
    baseSuccessRate,
    minAlchemistLevel: 1,
    expReward: 12,
    unlockType,
  };
}
