export const SCENE_ORDER = ["workshop", "meadow", "mine", "sky_dock"];

export const SCENES = [
  {
    id: "workshop",
    name: "炼金工坊",
    kind: "核心据点",
    description: "提炼、炼金、图鉴和任务都在这里完成。",
    background: 0xb8d3ca,
    spawn: { x: 50, y: 68, facing: "down" },
    hotspots: [
      hotspot("task_board", "任务板", "查看", "每日", 12, 25, 16, { panel: "tasks" }),
      hotspot("distiller", "元素提炼器", "提炼", "设备", 24, 38, 17, { panel: "refine" }),
      hotspot("furnace", "炼金炉", "炼金", "核心", 52, 43, 20, { panel: "alchemy" }),
      npcHotspot("npc_mira", "米拉导师", "炼金导师", 36, 62, {
        palette: "mentor",
        line: "水和木的共鸣最稳定，先用它练手。",
        repeatLine: "靠近炉子时别只看火，听元素的节奏。",
        reward: { inspiration: 2, materials: { dew_herb: 1 } },
      }),
      hotspot("adventure_map", "冒险地图", "出发", "路线", 72, 58, 18, { panel: "adventure" }),
      hotspot("codex_shelf", "图鉴柜", "翻阅", "收藏", 81, 31, 17, { panel: "codex" }),
      hotspot("item_chest", "物品箱", "整理", "背包", 64, 79, 16, { panel: "bag" }),
      hotspot("exit_meadow", "南门", "前往", "星露草场", 45, 91, 16, {
        exitTo: "meadow",
        exitSpawn: { x: 52, y: 82, facing: "up" },
        transitionNotice: "来到星露草场，草药和露水材料更丰富。",
      }),
      hotspot("sky_lift", "升降台", "搭乘", "云端停机坪", 89, 72, 16, {
        exitTo: "sky_dock",
        exitSpawn: { x: 18, y: 58, facing: "right" },
        transitionNotice: "抵达云端停机坪，可以预览飞行器方向的场景。",
      }),
    ],
  },
  {
    id: "meadow",
    name: "星露草场",
    kind: "采集场景",
    description: "基础草药、露水、浆果和迷雾森林入口。",
    background: 0x9fcbb1,
    spawn: { x: 52, y: 82, facing: "up" },
    hotspots: [
      hotspot("return_workshop", "工坊门", "返回", "炼金工坊", 52, 91, 16, {
        exitTo: "workshop",
        exitSpawn: { x: 45, y: 78, facing: "up" },
        transitionNotice: "回到炼金工坊，设备都在手边。",
      }),
      hotspot("herb_patch", "露水草圃", "采集", "材料", 24, 63, 18, { areaId: "starter_meadow" }),
      hotspot("spring_pool", "清泉池", "采集", "水系材料", 67, 43, 17, { areaId: "starter_meadow" }),
      hotspot("berry_bush", "红浆果丛", "采集", "生命材料", 39, 36, 16, { areaId: "starter_meadow" }),
      npcHotspot("npc_lio", "采草人里奥", "采集向导", 61, 69, {
        palette: "forager",
        line: "露水草要在晨光里摘，炼出来的水元素会更温和。",
        repeatLine: "红浆果别全炼掉，后面做治疗物也很顺手。",
        reward: { materials: { red_berry: 2, clear_spring: 1 } },
      }),
      hotspot("forest_gate", "迷雾林缘", "探索", "Lv.3", 16, 25, 17, { areaId: "mist_forest" }),
      hotspot("mine_path", "矿道口", "前往", "回声矿洞", 89, 56, 17, {
        exitTo: "mine",
        exitSpawn: { x: 18, y: 74, facing: "right" },
        transitionNotice: "进入回声矿洞，金属和土系材料更多。",
      }),
    ],
  },
  {
    id: "mine",
    name: "回声矿洞",
    kind: "采集场景",
    description: "矿石、铁砂、石英与旧机械废墟入口。",
    background: 0x5d665f,
    spawn: { x: 18, y: 74, facing: "right" },
    hotspots: [
      hotspot("return_meadow", "洞口光", "返回", "星露草场", 11, 82, 16, {
        exitTo: "meadow",
        exitSpawn: { x: 83, y: 58, facing: "left" },
        transitionNotice: "回到星露草场，空气又亮起来了。",
      }),
      hotspot("mine_crate", "矿石箱", "采集", "材料", 52, 66, 18, { areaId: "shallow_mine" }),
      hotspot("crystal_vein", "蓝晶矿脉", "采集", "矿物", 70, 38, 17, { areaId: "shallow_mine" }),
      hotspot("charcoal_pit", "余烬坑", "采集", "火系材料", 32, 39, 17, { areaId: "shallow_mine" }),
      npcHotspot("npc_borin", "矿工伯恩", "矿洞向导", 43, 52, {
        palette: "miner",
        line: "铁砂适合打武器，青铜矿更稳，先别一股脑全投进炉。",
        repeatLine: "看到蓝晶就记一下位置，那东西以后机械学派很馋。",
        reward: { materials: { copper_ore: 2, charcoal: 1 } },
      }),
      hotspot("ruin_gate", "旧机械门", "探索", "Lv.4", 86, 27, 17, { areaId: "old_ruins" }),
      hotspot("rail_cart", "矿车轨道", "前往", "云端停机坪", 82, 77, 15, {
        exitTo: "sky_dock",
        exitSpawn: { x: 28, y: 68, facing: "right" },
        transitionNotice: "矿车把你送到停机坪下层。",
      }),
    ],
  },
  {
    id: "sky_dock",
    name: "云端停机坪",
    kind: "飞行器预告",
    description: "后续飞行器、风系材料和高阶探索的展示场。",
    background: 0xb5d8e5,
    spawn: { x: 18, y: 58, facing: "right" },
    hotspots: [
      hotspot("dock_return", "升降台", "返回", "炼金工坊", 16, 72, 16, {
        exitTo: "workshop",
        exitSpawn: { x: 82, y: 74, facing: "left" },
        transitionNotice: "降回炼金工坊，飞行器部件暂时收好。",
      }),
      hotspot("wind_garden", "风铃花圃", "探索", "Lv.5", 47, 35, 17, { areaId: "sky_ridge" }),
      hotspot("cloud_silk_pod", "云丝吊舱", "探索", "Lv.5", 72, 48, 17, { areaId: "sky_ridge" }),
      npcHotspot("npc_nova", "飞行师诺瓦", "飞行器学徒", 35, 55, {
        palette: "pilot",
        line: "飞行器不是先飞起来，而是先学会不乱晃。",
        repeatLine: "风元素负责轻，机械元素负责稳，缺一边都容易翻。",
        reward: { inspiration: 1, materials: { wind_feather: 1 } },
      }),
      hotspot("airship_frame", "飞行器骨架", "查看", "机械方向", 58, 73, 18, { panel: "codex" }),
      hotspot("supply_chest", "补给箱", "整理", "背包", 84, 72, 15, { panel: "bag" }),
    ],
  },
];

export const SCENE_BY_ID = Object.fromEntries(SCENES.map((scene) => [scene.id, scene]));

export function getScene(sceneId) {
  return SCENE_BY_ID[sceneId] ?? SCENE_BY_ID.workshop;
}

export function getSceneHotspots(sceneId) {
  return getScene(sceneId).hotspots;
}

export function getNpcHotspots(sceneId) {
  return getSceneHotspots(sceneId).filter((hotspot) => hotspot.npc);
}

export function resolveSceneTransition(sceneId, hotspotId) {
  const hotspot = getSceneHotspots(sceneId).find((entry) => entry.id === hotspotId);
  if (!hotspot?.exitTo) return null;

  const target = getScene(hotspot.exitTo);
  const spawn = hotspot.exitSpawn ?? target.spawn;
  return {
    sceneId: target.id,
    avatar: { ...spawn, moving: true },
    notice: hotspot.transitionNotice ?? `来到${target.name}`,
  };
}

function npcHotspot(id, name, role, x, y, npc) {
  return hotspot(id, name, "交谈", role, x, y, 16, {
    npc: {
      id,
      name,
      role,
      ...npc,
    },
  });
}

function hotspot(id, label, verb, kind, x, y, radius, options = {}) {
  return {
    id,
    label,
    verb,
    kind,
    x,
    y,
    radius,
    ...options,
  };
}
