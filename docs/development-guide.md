# 炼金工坊开发文档

版本：0.1  
日期：2026-06-13  
目标：为微信小游戏 / 微信小程序版本提供技术拆解、数据模型、核心算法和阶段开发计划。

## 1. 技术目标

首版技术目标：

- 支持材料收集、元素提炼、炼金合成、品质概率、熟练度、图鉴、简单冒险。
- 数据配置化，方便后续扩展材料、元素、配方、区域、掉落。
- 前端体验轻量，单次操作反馈快。
- 核心计算可在服务端校验，避免用户篡改炼金结果、库存和概率。

推荐技术栈：

- 客户端：微信小程序原生框架 + TypeScript。
- 状态管理：轻量 Store，按页面和领域模块拆分。
- 服务端：微信云开发 CloudBase 或自有 Node.js API。
- 数据库：云开发数据库 / MongoDB 风格文档库。
- 配置：JSON 配置表，构建期校验。
- 日志：关键行为埋点 + 错误日志。

## 2. 架构概览

```text
小程序客户端
├─ 页面层：工坊、仓库、炼金台、图鉴、冒险、任务
├─ 领域层：材料、提炼、炼金、熟练度、冒险、背包
├─ 配置层：materials、elements、recipes、items、areas、drops
└─ API 层：调用云函数或后端接口

服务端
├─ 用户档案
├─ 库存变更
├─ 炼金结算
├─ 冒险结算
├─ 任务结算
└─ 埋点和风控
```

设计原则：

- 客户端负责展示、交互、预览。
- 服务端负责最终结算和库存写入。
- 配方、品质、掉落使用配置驱动。
- 所有资源增减必须有流水记录。

## 3. 推荐目录结构

```text
miniprogram/
├─ app.ts
├─ app.json
├─ pages/
│  ├─ workshop/
│  ├─ inventory/
│  ├─ refine/
│  ├─ alchemy/
│  ├─ codex/
│  ├─ adventure/
│  └─ tasks/
├─ components/
│  ├─ item-card/
│  ├─ quality-badge/
│  ├─ element-chip/
│  ├─ recipe-result/
│  └─ reward-list/
├─ domain/
│  ├─ material/
│  ├─ element/
│  ├─ alchemy/
│  ├─ proficiency/
│  ├─ adventure/
│  └─ economy/
├─ services/
│  ├─ api.ts
│  ├─ user-service.ts
│  ├─ inventory-service.ts
│  ├─ alchemy-service.ts
│  └─ adventure-service.ts
├─ config/
│  ├─ materials.json
│  ├─ elements.json
│  ├─ recipes.json
│  ├─ items.json
│  ├─ areas.json
│  └─ tasks.json
└─ utils/
   ├─ random.ts
   ├─ format.ts
   └─ assert.ts

cloudfunctions/
├─ getUserProfile/
├─ refineMaterial/
├─ performAlchemy/
├─ startAdventure/
├─ claimTaskReward/
└─ logEvent/
```

## 4. 核心数据模型

### 4.1 用户档案

```ts
type UserProfile = {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  alchemistLevel: number;
  alchemistExp: number;
  coins: number;
  actionPoint: number;
  maxActionPoint: number;
  createdAt: number;
  updatedAt: number;
};
```

### 4.2 材料配置

```ts
type MaterialConfig = {
  id: string;
  name: string;
  quality: Quality;
  sourceAreaIds: string[];
  refineOutputs: RefineOutput[];
  directAlchemyTags: string[];
};

type RefineOutput = {
  elementId: string;
  minAmount: number;
  maxAmount: number;
  weight: number;
};
```

### 4.3 元素配置

```ts
type ElementConfig = {
  id: string;
  name: string;
  schoolTags: AlchemySchool[];
  description: string;
};
```

### 4.4 配方配置

```ts
type RecipeConfig = {
  id: string;
  name: string;
  school: AlchemySchool;
  inputElementIds: string[];
  optionalMaterialTagIds: string[];
  requiredCatalystIds: string[];
  outputItemId: string;
  baseSuccessRate: number;
  minAlchemistLevel: number;
  expReward: number;
  unlockType: "public" | "hidden" | "rare";
};
```

### 4.5 物品配置

```ts
type ItemConfig = {
  id: string;
  name: string;
  category: "potion" | "weapon" | "armor" | "aircraft" | "trinket" | "catalyst" | "junk";
  school: AlchemySchool;
  baseStats: Record<string, number>;
  effectIds: string[];
  usableInAdventure: boolean;
  usableInPk: boolean;
};
```

### 4.6 品质和学派枚举

```ts
type Quality = "common" | "fine" | "rare" | "epic" | "legendary";

type AlchemySchool =
  | "life"
  | "weapon"
  | "defense"
  | "mechanical"
  | "forbidden"
  | "radiance"
  | "shadow";
```

### 4.7 用户库存

```ts
type UserInventory = {
  userId: string;
  materials: Record<string, number>;
  elements: Record<string, number>;
  items: UserItem[];
  catalysts: Record<string, number>;
};

type UserItem = {
  instanceId: string;
  itemId: string;
  quality: Quality;
  stats: Record<string, number>;
  createdByRecipeId: string;
  locked: boolean;
  createdAt: number;
};
```

### 4.8 熟练度

```ts
type UserProficiency = {
  userId: string;
  schoolExp: Record<AlchemySchool, number>;
  recipeExp: Record<string, number>;
  itemUseExp: Record<string, number>;
};
```

### 4.9 图鉴

```ts
type UserCodex = {
  userId: string;
  discoveredMaterialIds: string[];
  discoveredElementIds: string[];
  discoveredRecipeIds: string[];
  discoveredItemIds: string[];
  highestItemQuality: Record<string, Quality>;
};
```

## 5. 数据库集合

推荐集合：

| 集合 | 说明 |
|---|---|
| users | 用户基础档案 |
| inventories | 用户库存 |
| proficiencies | 用户熟练度 |
| codexes | 用户图鉴 |
| adventure_runs | 冒险记录 |
| resource_logs | 资源流水 |
| daily_tasks | 用户每日任务状态 |
| event_logs | 行为埋点 |

配置表可以放客户端包内，也可以服务端下发。P0/P1 建议客户端内置配置，服务端保留一份同版本配置用于校验。

## 6. 核心算法

### 6.1 配方匹配

配方匹配使用元素集合匹配。为避免顺序影响，配方输入统一排序后生成 key。

```ts
function getRecipeKey(elementIds: string[]): string {
  return [...elementIds].sort().join("+");
}
```

匹配规则：

- 输入元素数量必须满足配方要求。
- 元素集合完全匹配时命中配方。
- 可选材料只影响概率和品质，不影响基础命中。
- 未命中时返回失败反馈，不直接暴露真实配方。

### 6.2 成功率计算

```ts
type SuccessRateInput = {
  baseSuccessRate: number;
  recipeLevel: number;
  schoolLevel: number;
  furnaceLevel: number;
  catalystBonus: number;
  materialQualityBonus: number;
};

function calculateSuccessRate(input: SuccessRateInput): number {
  const rate =
    input.baseSuccessRate +
    input.recipeLevel * 0.01 +
    input.schoolLevel * 0.005 +
    input.furnaceLevel * 0.01 +
    input.catalystBonus +
    input.materialQualityBonus;

  return Math.max(0.05, Math.min(rate, 0.98));
}
```

建议：

- P0 成功率区间控制在 50% 到 95%。
- 新手教学配方固定成功。
- 稀有配方可以低成功率，但失败补偿必须足够。

### 6.3 品质概率计算

```ts
type QualityWeights = Record<Quality, number>;

function normalizeQualityWeights(weights: QualityWeights): QualityWeights {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return {
    common: weights.common / total,
    fine: weights.fine / total,
    rare: weights.rare / total,
    epic: weights.epic / total,
    legendary: weights.legendary / total,
  };
}
```

基础权重：

```ts
const baseQualityWeights: QualityWeights = {
  common: 70,
  fine: 25,
  rare: 5,
  epic: 0,
  legendary: 0,
};
```

熟练度修正建议：

- 配方等级每级降低普通权重 1。
- 配方等级每级提高优秀权重 0.5、稀有权重 0.35、史诗权重 0.12。
- 传说品质在炼金师等级、学派等级、配方等级都达标后开放。

### 6.4 失败补偿

失败时产出：

- 炼金残渣：用于低级催化剂合成。
- 灵感碎片：用于提示或下次概率加成。
- 少量配方熟练度。

```ts
type FailureReward = {
  itemId: "alchemy_residue";
  residueAmount: number;
  inspirationAmount: number;
  recipeExp: number;
};
```

### 6.5 熟练度等级

熟练度经验可使用平方增长。

```ts
function getLevelFromExp(exp: number): number {
  return Math.floor(Math.sqrt(exp / 100)) + 1;
}

function getRequiredExpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}
```

### 6.6 冒险结算

冒险结算输入：

- 区域配置。
- 用户装备。
- 药剂。
- 飞行器。
- 炼金师等级。
- 相关熟练度。

简化评分模型：

```ts
type AdventurePowerInput = {
  attack: number;
  defense: number;
  sustain: number;
  mobility: number;
  areaRequirement: number;
};

function calculateAdventureScore(input: AdventurePowerInput): number {
  return (
    input.attack * 0.35 +
    input.defense * 0.25 +
    input.sustain * 0.25 +
    input.mobility * 0.15
  ) / input.areaRequirement;
}
```

结果区间：

- 分数小于 0.75：失败。
- 分数 0.75 到 1.25：成功。
- 分数大于 1.25：大成功。

## 7. 服务端接口

### 7.1 获取用户档案

```http
GET /api/user/profile
```

返回：

```json
{
  "user": {},
  "inventory": {},
  "proficiency": {},
  "codex": {}
}
```

### 7.2 提炼材料

```http
POST /api/refine
```

请求：

```json
{
  "materialId": "dew_herb",
  "amount": 3
}
```

返回：

```json
{
  "consumed": {
    "dew_herb": 3
  },
  "gainedElements": {
    "water": 2,
    "life": 1
  },
  "isGreatSuccess": false
}
```

### 7.3 执行炼金

```http
POST /api/alchemy/perform
```

请求：

```json
{
  "elementIds": ["water", "wood"],
  "materialIds": [],
  "catalystIds": [],
  "furnaceId": "basic_furnace"
}
```

返回：

```json
{
  "success": true,
  "recipeId": "small_healing_potion",
  "isNewRecipe": true,
  "item": {
    "instanceId": "item_001",
    "itemId": "small_healing_potion",
    "quality": "fine",
    "stats": {
      "heal": 35
    }
  },
  "proficiencyDelta": {
    "school": "life",
    "schoolExp": 8,
    "recipeExp": 12
  }
}
```

失败返回：

```json
{
  "success": false,
  "feedback": "元素产生了微弱共鸣，但缺少稳定媒介。",
  "rewards": {
    "alchemy_residue": 2,
    "inspiration": 1,
    "recipeExp": 3
  }
}
```

### 7.4 开始冒险

```http
POST /api/adventure/start
```

请求：

```json
{
  "areaId": "starter_grassland",
  "loadout": {
    "weaponItemInstanceId": "item_weapon_001",
    "armorItemInstanceId": "item_armor_001",
    "aircraftItemInstanceId": "",
    "potionItemInstanceIds": ["item_potion_001"]
  }
}
```

返回：

```json
{
  "result": "success",
  "rewards": {
    "materials": {
      "dew_herb": 3,
      "wood_branch": 2
    },
    "coins": 20,
    "alchemistExp": 15
  },
  "consumedItems": ["item_potion_001"],
  "proficiencyDelta": {
    "itemUseExp": {
      "small_healing_potion": 5
    }
  }
}
```

### 7.5 领取任务奖励

```http
POST /api/tasks/claim
```

请求：

```json
{
  "taskId": "daily_alchemy_3"
}
```

返回：

```json
{
  "claimed": true,
  "rewards": {
    "coins": 50,
    "inspiration": 2
  }
}
```

## 8. 客户端页面设计要点

### 8.1 工坊首页

职责：

- 展示玩家等级、金币、行动力。
- 展示当前主线任务和每日任务。
- 提供炼金台、仓库、冒险、图鉴入口。
- 展示最近一次炼成物。

### 8.2 仓库页

职责：

- 查看材料、元素、物品。
- 支持材料批量提炼。
- 支持按学派、品质、来源筛选。

### 8.3 炼金台页

职责：

- 选择 2 到 4 个元素。
- 选择可选材料和催化剂。
- 展示预计成功率和品质区间。
- 执行炼金并展示结果。
- 对未知配方给出反馈。

### 8.4 图鉴页

职责：

- 展示材料、元素、配方、物品发现进度。
- 已发现配方显示完整输入。
- 未发现配方显示线索。
- 展示最高品质记录。

### 8.5 冒险页

职责：

- 展示区域列表和解锁条件。
- 配置装备和药剂。
- 展示推荐属性。
- 展示结算结果和掉落。

## 9. 配置表示例

### 9.1 元素配置

```json
[
  {
    "id": "water",
    "name": "水",
    "schoolTags": ["life"],
    "description": "用于治疗、净化和冷却。"
  },
  {
    "id": "wood",
    "name": "木",
    "schoolTags": ["life"],
    "description": "用于生长、草药和恢复。"
  }
]
```

### 9.2 配方配置

```json
[
  {
    "id": "small_healing_potion",
    "name": "小型治疗药剂",
    "school": "life",
    "inputElementIds": ["water", "wood"],
    "optionalMaterialTagIds": [],
    "requiredCatalystIds": [],
    "outputItemId": "small_healing_potion",
    "baseSuccessRate": 0.9,
    "minAlchemistLevel": 1,
    "expReward": 12,
    "unlockType": "public"
  }
]
```

### 9.3 区域配置

```json
[
  {
    "id": "starter_grassland",
    "name": "新手草地",
    "minAlchemistLevel": 1,
    "actionPointCost": 5,
    "areaRequirement": 50,
    "dropMaterialIds": ["dew_herb", "wood_branch"],
    "recommendedTags": ["life"]
  }
]
```

## 10. 阶段开发计划

### P0 原型

目标：

- 跑通材料、提炼、炼金、图鉴和熟练度。

开发内容：

- 建立配置表。
- 实现用户档案和库存。
- 实现材料提炼。
- 实现配方匹配。
- 实现炼金成功率和品质随机。
- 实现失败补偿。
- 实现图鉴点亮。
- 实现基础页面：工坊、仓库、炼金台、图鉴。

验收标准：

- 新用户可以完成首次提炼和首次炼金。
- 配方成功后正确扣除元素、增加物品、点亮图鉴。
- 失败后正确扣除元素并发放补偿。
- 重复炼制同一配方会提升配方熟练度。

### P1 MVP

目标：

- 形成可上线的每日循环。

开发内容：

- 增加每日任务。
- 增加简单冒险自动结算。
- 增加行动力。
- 增加 5 个采集和冒险区域。
- 增加激励视频入口。
- 增加分享卡。
- 增加基础埋点。

验收标准：

- 用户每天有任务可做。
- 冒险可以消耗物品并产出材料。
- 激励视频奖励正确发放。
- 分享卡可生成并带回游戏入口。

### P2 冒险版

目标：

- 让不同炼金产物在冒险中形成策略。

开发内容：

- 装备栏。
- 区域属性和推荐配置。
- 飞行器解锁区域。
- 怪物和区域掉落差异。
- 冒险成功、大成功、失败多结果。

验收标准：

- 不同装备配置会影响冒险结果。
- 飞行器能解锁指定区域。
- 高品质物品在冒险中有可感知收益。

### P3 社交版

目标：

- 引入微信好友关系和异步竞争。

开发内容：

- 好友排行榜。
- 异步 PK 配置。
- PK 自动结算。
- 赛季积分。
- PK 分享卡和战报。

验收标准：

- 玩家可配置阵容参与 PK。
- PK 结果由服务端结算。
- 排行榜展示稳定。
- 赛季奖励能正确发放。

### P4 长线运营版

目标：

- 支持持续内容更新。

开发内容：

- 活动配置系统。
- 活动区域。
- 活动配方。
- 工坊装饰。
- 赛季通行证。
- 回流任务。

验收标准：

- 新活动可通过配置上线。
- 活动奖励不破坏核心经济。
- 回流用户有明确追赶路径。

## 11. 埋点设计

关键事件：

| 事件 | 触发时机 | 关键参数 |
|---|---|---|
| first_refine | 首次提炼 | materialId, outputElements |
| alchemy_start | 点击炼金 | elementIds, recipeMatched |
| alchemy_result | 炼金结束 | success, recipeId, quality |
| codex_unlock | 图鉴解锁 | codexType, targetId |
| adventure_start | 开始冒险 | areaId, loadoutPower |
| adventure_result | 冒险结算 | result, rewards |
| rewarded_ad_watch | 激励视频完成 | placement, rewardType |
| share_card | 分享卡生成 | shareType, targetId |

## 12. 测试策略

单元测试：

- 配方 key 生成。
- 配方匹配。
- 成功率计算。
- 品质权重归一化。
- 熟练度等级计算。
- 冒险分数计算。

集成测试：

- 提炼材料扣除和元素增加。
- 炼金成功完整流程。
- 炼金失败补偿流程。
- 冒险消耗和奖励流程。
- 任务领取流程。

数据校验：

- 所有配方引用的元素必须存在。
- 所有配方输出的物品必须存在。
- 所有材料提炼输出的元素必须存在。
- 所有区域掉落材料必须存在。
- 配方 key 不能重复，除非明确允许同配方多产物。

## 13. 安全和风控

需要服务端校验的内容：

- 用户库存是否足够。
- 配方是否存在。
- 概率结算是否由服务端生成。
- 冒险奖励是否符合区域配置。
- 激励视频奖励是否重复领取。
- 任务奖励是否重复领取。

资源流水：

每次资源变化都写入 `resource_logs`。

```ts
type ResourceLog = {
  userId: string;
  source: "refine" | "alchemy" | "adventure" | "task" | "ad" | "admin";
  resourceType: "material" | "element" | "item" | "coin" | "exp" | "actionPoint";
  resourceId: string;
  amount: number;
  beforeAmount: number;
  afterAmount: number;
  createdAt: number;
};
```

## 14. 性能要求

- 页面首屏加载控制在 2 秒内。
- 炼金结算接口目标响应 500ms 内。
- 冒险结算接口目标响应 800ms 内。
- 配置表首版控制在合理大小，避免小程序包体过大。
- 图鉴和仓库列表使用分页或虚拟列表策略。

## 15. 开发优先级

第一优先级：

- 配置表。
- 用户库存。
- 提炼。
- 炼金。
- 品质。
- 熟练度。
- 图鉴。

第二优先级：

- 任务。
- 简单冒险。
- 行动力。
- 激励视频。
- 分享卡。

第三优先级：

- 飞行器开图。
- 装备栏。
- 好友排行榜。
- 异步 PK。
- 活动系统。

## 16. 开发风险

| 风险 | 影响 | 应对 |
|---|---|---|
| 配置数据出错 | 配方无法合成或奖励异常 | 构建期配置校验 |
| 概率被客户端篡改 | 破坏公平性 | 服务端结算 |
| 库存并发写入 | 重复扣除或重复奖励 | 服务端事务或乐观锁 |
| 内容扩展困难 | 后续运营成本高 | 配方、区域、任务配置化 |
| 前期系统过重 | 首版延期 | P0/P1 不做 PK 和复杂冒险 |

## 17. 推荐首个开发里程碑

第一个里程碑只做 P0：

- 完成配置表和数据模型。
- 完成工坊、仓库、炼金台、图鉴 4 个页面。
- 完成 30 个材料、8 个元素、40 个配方。
- 完成服务端炼金结算。
- 完成最小可玩闭环。

第一个里程碑完成后，再根据测试反馈决定 P1 的冒险深度和商业化点位。

