export const ADVENTURE_ROUTES = [
  {
    id: "meadow_patrol",
    name: "星露草场巡游",
    sceneId: "meadow",
    school: "life",
    kind: "采集路线",
    minAlchemistLevel: 1,
    actionPointCost: 2,
    difficulty: 14,
    eventCount: 3,
    expReward: 8,
    schoolExpReward: 6,
    description: "轻松采集草药、露水和浆果，适合刚开始的炼金师。",
    events: [
      event("berry_hollow", "浆果灌木", 42, 37, "击退露莓史莱姆，找到一簇成熟红浆果。", "史莱姆护住了浆果，只能带走一些残渣。", {
        successReward: { materials: { red_berry: 2 }, coins: 3 },
        encounter: enemy("berry_slime", "露莓史莱姆", 22, 7, 1, "会把浆果汁凝成软盾的小型魔物。"),
      }),
      event("dew_trail", "露水小径", 28, 58, "沿草叶收集到清亮露珠。", "露水蒸散太快，只捡到一些残渣。", {
        successReward: { materials: { dew_herb: 2, clear_spring: 1 }, coins: 4 },
      }),
      event("calm_breeze", "轻风岔口", 72, 51, "风把藏着的木枝吹到脚边。", "路线有点绕，但获得了一点灵感。", {
        successReward: { materials: { wood_branch: 2, flint: 1 } },
      }),
    ],
  },
  {
    id: "mine_scout",
    name: "回声矿洞侦察",
    sceneId: "mine",
    school: "weapon",
    kind: "矿洞路线",
    minAlchemistLevel: 1,
    actionPointCost: 2,
    difficulty: 25,
    eventCount: 3,
    expReward: 10,
    schoolExpReward: 8,
    description: "矿洞浅层的试探路线，适合带着武器或勘探装置出发。",
    events: [
      event("loose_ore", "松动矿壁", 50, 63, "敲下一批青铜矿和铁砂。", "矿壁塌得太碎，只能带回残渣。", {
        successReward: { materials: { copper_ore: 2, iron_sand: 1 }, coins: 6 },
      }),
      event("ember_gap", "余烬裂隙", 33, 41, "压制余烬蝠后，翻出可用木炭。", "余烬蝠把你逼退，只记下一点经验。", {
        successReward: { materials: { charcoal: 2, flint: 1 } },
        encounter: enemy("ember_bat", "余烬蝠", 26, 9, 2, "贴着矿壁滑行，喜欢扑向发光的炼金瓶。"),
      }),
      event("quartz_turn", "石英弯道", 71, 37, "找到几片完整石英碎片。", "石英碎裂，剩下一些炼金残渣。", {
        successReward: { materials: { quartz_shard: 1 }, inspiration: 1 },
      }),
    ],
  },
  {
    id: "sky_dock_trial",
    name: "云端停机坪试飞",
    sceneId: "sky_dock",
    school: "mechanical",
    kind: "飞行路线",
    minAlchemistLevel: 3,
    actionPointCost: 3,
    difficulty: 38,
    eventCount: 3,
    expReward: 14,
    schoolExpReward: 10,
    description: "高处风流不稳定，适合带飞行器、风系或机械系炼成物再尝试。",
    events: [
      event("crosswind", "侧风平台", 47, 36, "顺着风切线拾到风羽。", "风势太乱，只得到一些试飞心得。", {
        successReward: { materials: { wind_feather: 2 }, inspiration: 1 },
      }),
      event("cloud_tether", "云丝吊索", 72, 48, "稳住巡游构装体，成功回收一束云丝。", "构装体切断吊索，只能带回残渣。", {
        successReward: { materials: { cloud_silk: 1 }, coins: 10 },
        encounter: enemy("tether_construct", "吊索构装体", 34, 11, 3, "旧航线留下的护航机械，会判断靠近者是否安全。"),
      }),
      event("sun_gap", "日光裂隙", 60, 72, "在日光里找到温热种子。", "日光太强，设备需要重新校准。", {
        successReward: { materials: { sun_seed: 1 }, inspiration: 1 },
      }),
    ],
  },
];

export const ADVENTURE_ROUTE_BY_ID = Object.fromEntries(ADVENTURE_ROUTES.map((route) => [route.id, route]));

function event(id, title, x, y, successLine, failureLine, options) {
  return {
    id,
    title,
    x,
    y,
    successLine,
    failureLine,
    successReward: options.successReward,
    failureReward: options.failureReward ?? { materials: { alchemy_residue: 1 }, inspiration: 1 },
    encounter: options.encounter ?? null,
  };
}

function enemy(id, name, hp, attack, defense, description) {
  return {
    id,
    name,
    hp,
    attack,
    defense,
    description,
  };
}
