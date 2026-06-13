import {
  findNearestHotspot,
  getFrameMoveDistance,
  getMovementVectorFromKeys,
  MOVEMENT_KEY_VECTORS,
  moveAvatar,
} from "./avatar.js?v=smooth-avatar-1";
import {
  AREAS,
  CATEGORY_LABELS,
  ELEMENTS,
  ELEMENT_BY_ID,
  ITEM_BY_ID,
  MATERIALS,
  MATERIAL_BY_ID,
  QUALITY_CLASS,
  QUALITY_LABELS,
  RECIPES,
  SCHOOL_LABELS,
  TASKS,
} from "./data.js";
import { ADVENTURE_ROUTES } from "./adventure.js";
import { getUiMotionPlan } from "./animation-frames.js";
import { getAdventureSceneSwitchGuard } from "./adventure-flow.js";
import { getBattlePresentation } from "./battle-view.js";
import { getInventoryIcon } from "./item-icons.js";
import { getUiIcon } from "./ui-icons.js";
import {
  claimTaskReward,
  collectArea,
  createInitialState,
  ensureStateShape,
  getAdventurePreview,
  getActiveAdventureEvent,
  getAlchemyPreview,
  getLevelFromExp,
  interactWithNpc,
  performAlchemy,
  refineMaterial,
  resolveAdventureEvent,
  startAdventureBattle,
  startAdventureSession,
  takeBattleTurn,
} from "./domain.js";
import {
  getScene,
  getSceneCollisionZones,
  getSceneHotspots,
  resolveSceneTransition,
  SCENE_ORDER,
} from "./scenes.js?v=collision-facing-1";
import { ThreeWorkshopScene } from "./three-scene.js?v=pixel-chibi-smooth-2";

const STORAGE_KEY = "alchemy-workshop-p0-state";
const AVATAR_KEY = "alchemy-workshop-p0-avatar";
const SCENE_KEY = "alchemy-workshop-p0-scene";
const STAGE_BOUNDS = { width: 100, height: 100 };
const AVATAR_NUDGE_DISTANCE = 6;
const AVATAR_WALK_UNITS_PER_SECOND = 42;
const POINTER_TARGET_EPSILON = 0.65;
const AVATAR_PERSIST_INTERVAL_MS = 220;

const app = document.querySelector("#app");

let state = loadState();
let avatar = loadAvatar();
let currentSceneId = loadSceneId();
let activePanel = null;
let selectedElements = [];
let notice = "";
let activeDialogue = null;
let moveTimer = null;
let threeScene = null;
let threeSceneSignature = "";
let diagnosticsTimer = null;
let movementFrameId = 0;
let lastMovementFrameAt = 0;
let lastAvatarPersistAt = 0;
let pressedMovementKeys = new Set();
let pointerTarget = null;
let lastNearestId = "";

render();

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  try {
    handleAction(target);
  } catch (error) {
    notice = error.message;
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (MOVEMENT_KEY_VECTORS[event.code]) {
    event.preventDefault();
    pressedMovementKeys.add(event.code);
    pointerTarget = null;
    activeDialogue = null;
    startMovementLoop();
  }

  if (event.code === "Enter" || event.code === "KeyE") {
    event.preventDefault();
    interactWithNearestHotspot();
  }

  if (event.code === "Escape") {
    activePanel = null;
    render();
  }
});

document.addEventListener("keyup", (event) => {
  if (!MOVEMENT_KEY_VECTORS[event.code]) return;
  event.preventDefault();
  pressedMovementKeys.delete(event.code);
});

window.addEventListener("blur", () => {
  clearMovementIntent();
  avatar = { ...avatar, moving: false };
  persistAvatar();
  render();
});

document.addEventListener("pointerdown", (event) => {
  const stage = event.target.closest(".workshop-stage");
  if (!stage || event.target.closest("[data-action]") || event.target.closest(".drawer")) return;
  const rect = stage.getBoundingClientRect();
  const targetPosition = {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
  walkAvatarToward(targetPosition);
  activeDialogue = null;
});

function handleAction(target) {
  const action = target.dataset.action;

  if (action === "move") {
    moveAvatarBy({ x: Number(target.dataset.dx), y: Number(target.dataset.dy) });
  }

  if (action === "interact") {
    interactWithNearestHotspot();
  }

  if (action === "hotspot") {
    const hotspot = getCurrentHotspots().find((entry) => entry.id === target.dataset.hotspotId);
    if (!hotspot) return;
    avatar = getHotspotApproachAvatar(hotspot);
    persistAvatar();
    stopMovingSoon();
    handleHotspot(hotspot);
  }

  if (action === "switch-scene") {
    switchScene(target.dataset.sceneId);
  }

  if (action === "open-panel") {
    activePanel = target.dataset.panel;
    render();
  }

  if (action === "close-panel") {
    activePanel = null;
    render();
  }

  if (action === "refine") {
    const result = refineMaterial(state, target.dataset.materialId, Number(target.dataset.amount ?? 1));
    notice = `提炼完成：${formatElementGain(result.gainedElements)}`;
    saveAndRender();
  }

  if (action === "refine-first") {
    const material = MATERIALS.find(
      (entry) => entry.refineOutputs.length > 0 && (state.inventory.materials[entry.id] ?? 0) > 0
    );
    if (!material) throw new Error("当前没有可提炼材料");
    const result = refineMaterial(state, material.id, 1);
    notice = `提炼完成：${formatElementGain(result.gainedElements)}`;
    saveAndRender();
  }

  if (action === "select-element") {
    const elementId = target.dataset.elementId;
    if (selectedElements.includes(elementId)) {
      selectedElements = selectedElements.filter((id) => id !== elementId);
    } else if (selectedElements.length < 4 && (state.inventory.elements[elementId] ?? 0) > 0) {
      selectedElements.push(elementId);
    }
    render();
  }

  if (action === "clear-selection") {
    selectedElements = [];
    render();
  }

  if (action === "alchemy") {
    if (selectedElements.length < 2) throw new Error("至少选择 2 个元素才能炼金");
    const result = performAlchemy(state, { elementIds: selectedElements });
    selectedElements = [];
    notice = result.success
      ? `炼成 ${ITEM_BY_ID[result.item.itemId].name}（${QUALITY_LABELS[result.item.quality]}）`
      : result.feedback;
    saveAndRender();
  }

  if (action === "claim-task") {
    const reward = claimTaskReward(state, target.dataset.taskId);
    notice = `领取奖励：金币 +${reward.coins ?? 0}，灵感 +${reward.inspiration ?? 0}`;
    saveAndRender();
  }

  if (action === "run-adventure") {
    const session = startAdventureSession(state, target.dataset.routeId);
    currentSceneId = session.sceneId;
    avatar = { ...getScene(session.sceneId).spawn, moving: true };
    activePanel = null;
    activeDialogue = null;
    notice = `${session.route.name}开始：前往${session.currentEvent.title}`;
    saveAndRender();
    stopMovingSoon();
  }

  if (action === "battle-action") {
    const result = takeBattleTurn(state, target.dataset.battleAction);
    if (result.battleComplete) {
      notice = result.adventure.complete
        ? `${result.adventure.route.name}完成：处理 ${result.adventure.successCount}/${result.adventure.events.length} 个事件`
        : result.won
          ? `${result.battle.enemyName}被击退，前往${result.adventure.nextEvent.title}`
          : `${result.battle.enemyName}占了上风，前往${result.adventure.nextEvent.title}`;
      activePanel = result.adventure.complete ? "adventure" : null;
    } else {
      notice = result.battle.logs.at(-1);
      activePanel = "battle";
    }
    activeDialogue = null;
    saveAndRender();
  }

  if (action === "reset") {
    if (!window.confirm("重置本地 P0 存档？")) return;
    state = createInitialState();
    avatar = defaultAvatar();
    currentSceneId = "workshop";
    selectedElements = [];
    activePanel = null;
    activeDialogue = null;
    notice = "本地存档已重置";
    saveAndRender();
  }
}

function interactWithNearestHotspot() {
  const hotspot = findNearestHotspot(avatar, getCurrentHotspots());
  if (!hotspot) {
    notice = "再靠近设备或材料点一点";
    render();
    return;
  }
  handleHotspot(hotspot);
}

function handleHotspot(hotspot) {
  if (hotspot.adventureEvent) {
    const active = getActiveAdventureEvent(state);
    if (active?.event.encounter) {
      const battle = startAdventureBattle(state);
      activePanel = "battle";
      activeDialogue = null;
      notice = `遭遇${battle.enemyName}：选择一个回合行动`;
      saveAndRender();
      return;
    }

    const result = resolveAdventureEvent(state);
    activeDialogue = null;
    notice = result.complete
      ? `${result.route.name}完成：处理 ${result.successCount}/${result.events.length} 个事件`
      : `${result.event.title}${result.event.success ? "处理成功" : "处理失手"}，前往${result.nextEvent.title}`;
    activePanel = result.complete ? "adventure" : null;
    saveAndRender();
    return;
  }

  if (hotspot.npc) {
    const result = interactWithNpc(state, hotspot.npc);
    activePanel = null;
    activeDialogue = {
      hotspotId: hotspot.id,
      npcName: hotspot.npc.name,
      role: hotspot.npc.role,
      line: result.line,
      rewardText: result.rewardClaimed ? formatNpcReward(result.reward) : "",
    };
    notice = result.rewardClaimed ? `${hotspot.npc.name}送给你：${formatNpcReward(result.reward)}` : `${hotspot.npc.name}：${result.line}`;
    saveAndRender();
    return;
  }

  const transition = resolveSceneTransition(currentSceneId, hotspot.id);
  if (transition) {
    const targetScene = getScene(transition.sceneId);
    const guard = getAdventureSceneSwitchGuard(state.adventure.activeRun, targetScene, getScene(state.adventure.activeRun?.sceneId));
    if (!guard.canSwitch) {
      activePanel = null;
      activeDialogue = null;
      notice = guard.notice;
      render();
      return;
    }

    currentSceneId = transition.sceneId;
    avatar = transition.avatar;
    activePanel = null;
    activeDialogue = null;
    notice = transition.notice;
    saveAndRender();
    stopMovingSoon();
    return;
  }

  if (hotspot.areaId) {
    if (isAreaLocked(hotspot.areaId)) {
      const area = AREAS.find((entry) => entry.id === hotspot.areaId);
      notice = `${area.name}需要炼金师 Lv.${area.minAlchemistLevel}`;
      render();
      return;
    }
    const result = collectArea(state, hotspot.areaId);
    notice = `${result.area.name}采集完成`;
    activeDialogue = null;
    saveAndRender();
    return;
  }

  activePanel = hotspot.panel;
  activeDialogue = null;
  notice = `${hotspot.label}已打开`;
  render();
}

function switchScene(sceneId) {
  const scene = getScene(sceneId);
  const guard = getAdventureSceneSwitchGuard(state.adventure.activeRun, scene, getScene(state.adventure.activeRun?.sceneId));
  if (!guard.canSwitch) {
    activePanel = null;
    activeDialogue = null;
    notice = guard.notice;
    render();
    return;
  }

  currentSceneId = scene.id;
  avatar = { ...scene.spawn, moving: true };
  activePanel = null;
  activeDialogue = null;
  notice = `来到${scene.name}`;
  saveAndRender();
  stopMovingSoon();
}

function moveAvatarBy(vector) {
  clearMovementIntent();
  avatar = moveAvatar(avatar, vector, AVATAR_NUDGE_DISTANCE, STAGE_BOUNDS, getCurrentCollisionZones());
  activeDialogue = null;
  persistAvatar();
  stopMovingSoon();
  render();
}

function walkAvatarToward(targetPosition) {
  pressedMovementKeys.clear();
  pointerTarget = targetPosition;
  activeDialogue = null;
  startMovementLoop();
}

function startMovementLoop() {
  window.clearTimeout(moveTimer);
  if (movementFrameId) return;
  const now = performance.now();
  lastMovementFrameAt = now - 16;
  runMovementFrame(now);
}

function runMovementFrame(now) {
  const elapsedMs = Math.max(0, now - lastMovementFrameAt);
  lastMovementFrameAt = now;

  const movement = getMovementIntent();
  if (!movement) {
    finishMovementLoop();
    return;
  }

  const previous = avatar;
  const distance = getFrameMoveDistance(AVATAR_WALK_UNITS_PER_SECOND, elapsedMs);
  avatar = moveAvatar(previous, movement.vector, Math.min(distance, movement.maxDistance), STAGE_BOUNDS, getCurrentCollisionZones());

  if (pointerTarget && !hasAvatarMoved(previous, avatar) && !avatar.moving) {
    pointerTarget = null;
  }

  if (hasAvatarChanged(previous, avatar)) {
    activeDialogue = null;
    persistAvatarDuringMovement(now);
    syncAvatarSceneDuringMovement();
  }

  if (pressedMovementKeys.size > 0 || pointerTarget) {
    movementFrameId = requestAnimationFrame(runMovementFrame);
    return;
  }

  finishMovementLoop();
}

function getMovementIntent() {
  const keyVector = getMovementVectorFromKeys(pressedMovementKeys);
  if (keyVector.x !== 0 || keyVector.y !== 0) {
    pointerTarget = null;
    return {
      vector: keyVector,
      maxDistance: Infinity,
    };
  }

  if (!pointerTarget) return null;

  const vector = {
    x: pointerTarget.x - avatar.x,
    y: pointerTarget.y - avatar.y,
  };
  const distance = Math.hypot(vector.x, vector.y);
  if (distance <= POINTER_TARGET_EPSILON) {
    pointerTarget = null;
    return null;
  }

  return {
    vector,
    maxDistance: distance,
  };
}

function finishMovementLoop() {
  clearAnimationFrame();
  if (avatar.moving) {
    avatar = { ...avatar, moving: false };
  }
  persistAvatar();
  render();
}

function clearMovementIntent() {
  pressedMovementKeys.clear();
  pointerTarget = null;
  clearAnimationFrame();
}

function clearAnimationFrame() {
  if (!movementFrameId) return;
  cancelAnimationFrame(movementFrameId);
  movementFrameId = 0;
  lastMovementFrameAt = 0;
}

function hasAvatarMoved(previous, next) {
  return previous.x !== next.x || previous.y !== next.y;
}

function hasAvatarChanged(previous, next) {
  return hasAvatarMoved(previous, next) || previous.facing !== next.facing || previous.moving !== next.moving;
}

function persistAvatarDuringMovement(now) {
  if (now - lastAvatarPersistAt < AVATAR_PERSIST_INTERVAL_MS) return;
  lastAvatarPersistAt = now;
  persistAvatar();
}

function syncAvatarSceneDuringMovement() {
  const nearest = findNearestHotspot(avatar, getCurrentHotspots());
  const nearestId = nearest?.id ?? "";
  if (nearestId !== lastNearestId) {
    render();
    return;
  }
  syncThreeScene(nearest);
}

function getHotspotApproachAvatar(hotspot) {
  const zone = getCurrentCollisionZones().find((entry) => entry.id === hotspot.id);
  const standDistance = (zone?.radius ?? 5) + 4;
  let away = {
    x: avatar.x - hotspot.x,
    y: avatar.y - hotspot.y,
  };
  let length = Math.hypot(away.x, away.y);
  if (length === 0) {
    away = { x: 0, y: 1 };
    length = 1;
  }
  return {
    ...avatar,
    x: clamp(hotspot.x + (away.x / length) * standDistance, 0, STAGE_BOUNDS.width),
    y: clamp(hotspot.y + (away.y / length) * standDistance, 0, STAGE_BOUNDS.height),
    moving: true,
  };
}

function stopMovingSoon() {
  clearMovementIntent();
  window.clearTimeout(moveTimer);
  moveTimer = window.setTimeout(() => {
    avatar = { ...avatar, moving: false };
    persistAvatar();
    render();
  }, 180);
}

function getCurrentHotspots() {
  const baseHotspots = getSceneHotspots(currentSceneId);
  const active = getActiveAdventureEvent(state);
  if (!active || active.route.sceneId !== currentSceneId) return baseHotspots;

  return [
    ...baseHotspots,
    {
      id: `adventure_event_${active.event.id}`,
      label: active.event.title,
      verb: active.event.encounter ? "挑战" : "处理",
      kind: active.event.encounter ? "遭遇战" : "冒险事件",
      x: active.event.x,
      y: active.event.y,
      radius: 18,
      adventureEvent: true,
    },
  ];
}

function getCurrentCollisionZones() {
  return getSceneCollisionZones(currentSceneId, getCurrentHotspots());
}

function render() {
  const currentScene = getScene(currentSceneId);
  const hotspots = getCurrentHotspots();
  const nearest = findNearestHotspot(avatar, hotspots);
  const shellClass = ["game-shell", activePanel ? "has-drawer" : "", activePanel === "battle" ? "battle-mode" : ""]
    .filter(Boolean)
    .join(" ");
  if (nearest?.id !== activeDialogue?.hotspotId && !nearest?.npc) {
    activeDialogue = null;
  }
  lastNearestId = nearest?.id ?? "";
  app.innerHTML = `
    <main class="${shellClass}">
      ${renderHud(currentScene)}
      <section class="workshop-stage scene-${currentScene.id}" aria-label="${currentScene.name}场景">
        ${renderRoomDetails()}
        ${renderSceneTabs(currentScene)}
        ${hotspots.map((hotspot) => renderHotspot(hotspot, nearest?.id === hotspot.id)).join("")}
        ${activeDialogue ? renderDialogueBubble(activeDialogue) : ""}
        ${renderSceneNotice(currentScene, nearest)}
        ${renderDpad()}
      </section>
      ${renderDock()}
      ${activePanel ? renderDrawer(activePanel) : ""}
    </main>
  `;
  mountThreeScene(nearest);
}

function renderHud(currentScene) {
  return `
    <header class="game-hud">
      <div>
        <p class="eyebrow">P0+ 多场景原型 · ${currentScene.kind}</p>
        <h1>炼金工坊</h1>
        <span class="scene-chip">${currentScene.name}</span>
      </div>
      <div class="hud-stats" aria-label="玩家状态">
        ${stat("炼金师", `Lv.${state.alchemist.level}`)}
        ${stat("金币", state.resources.coins)}
        ${stat("灵感", state.resources.inspiration)}
        ${stat("配方", `${state.codex.discoveredRecipeIds.length}/${RECIPES.length}`)}
      </div>
      <button class="icon-button reset-button" data-action="reset" aria-label="重置存档">
        ${renderUiIcon("reset", "control-icon")}
      </button>
    </header>
  `;
}

function renderSceneTabs(currentScene) {
  const activeRun = state.adventure.activeRun;
  return `
    <nav class="scene-tabs" aria-label="场景切换">
      ${SCENE_ORDER.map((sceneId) => {
        const scene = getScene(sceneId);
        const isAdventureScene = activeRun?.sceneId === scene.id;
        const isLocked = !!activeRun && !isAdventureScene;
        return `
          <button
            class="${scene.id === currentScene.id ? "active" : ""} ${isAdventureScene ? "route-scene" : ""}"
            data-action="switch-scene"
            data-scene-id="${scene.id}"
            aria-label="切换到${scene.name}"
            ${isLocked ? "disabled" : ""}
          >
            ${renderUiIcon(`scene-${scene.id}`, "scene-tab-icon")}
            <span class="scene-tab-copy">
              <strong>${escapeHtml(scene.name)}</strong>
              <small>${isAdventureScene ? "冒险路线" : isLocked ? "路线中" : escapeHtml(scene.kind)}</small>
            </span>
          </button>
        `;
      }).join("")}
    </nav>
  `;
}

function renderRoomDetails() {
  return `
    <div id="three-stage" class="three-stage" aria-hidden="true"></div>
  `;
}

function mountThreeScene(nearest) {
  const container = document.querySelector("#three-stage");
  if (!container) return;
  window.clearTimeout(diagnosticsTimer);
  const scene = getScene(currentSceneId);
  const hotspots = getCurrentHotspots();
  const signature = getThreeSceneSignature(scene, hotspots);

  if (threeScene && threeSceneSignature === signature) {
    if (threeScene.container !== container) {
      container.replaceChildren(threeScene.renderer.domElement);
      container.dataset.threeMounted = "true";
      threeScene.container = container;
      threeScene.resize();
    }
    threeScene.setViewState({
      avatar,
      scene,
      hotspots,
      nearestId: nearest?.id ?? null,
    });
    writeThreeDiagnosticsSoon();
    updateThreeMountDiagnostics(nearest, hotspots, true);
    return;
  }

  if (threeScene) {
    threeScene.dispose();
    threeScene = null;
  }
  threeScene = new ThreeWorkshopScene(container, {
    avatar,
    scene,
    hotspots,
    nearestId: nearest?.id ?? null,
  });
  threeSceneSignature = signature;
  writeThreeDiagnosticsSoon();
  updateThreeMountDiagnostics(nearest, hotspots, false);
}

function syncThreeScene(nearest) {
  const container = document.querySelector("#three-stage");
  if (!container) return;
  const scene = getScene(currentSceneId);
  const hotspots = getCurrentHotspots();
  const signature = getThreeSceneSignature(scene, hotspots);

  if (!threeScene || threeSceneSignature !== signature || threeScene.container !== container) {
    mountThreeScene(nearest);
    return;
  }

  threeScene.setViewState({
    avatar,
    scene,
    hotspots,
    nearestId: nearest?.id ?? null,
  });
  updateThreeMountDiagnostics(nearest, hotspots, true);
}

function getThreeSceneSignature(scene, hotspots) {
  return `${scene.id}:${hotspots.map((hotspot) => hotspot.id).join("|")}`;
}

function updateThreeMountDiagnostics(nearest, hotspots, reused) {
  const container = document.querySelector("#three-stage");
  if (container) {
    container.dataset.threeReused = String(reused);
    container.dataset.threeNearestId = nearest?.id ?? "";
    container.dataset.threeHotspotCount = String(hotspots.length);
    container.dataset.threeAvatarX = String(avatar.x);
    container.dataset.threeAvatarY = String(avatar.y);
    container.dataset.threeAvatarFacing = avatar.facing;
    container.dataset.threeAvatarMoving = String(avatar.moving);
  }
  window.__alchemy3dMounted = {
    avatar: { ...avatar },
    sceneId: currentSceneId,
    hotspotCount: hotspots.length,
    nearestId: nearest?.id ?? null,
    reused,
  };
}

function writeThreeDiagnosticsSoon() {
  const sceneForDiagnostics = threeScene;
  diagnosticsTimer = window.setTimeout(() => {
    if (threeScene !== sceneForDiagnostics) return;
    sceneForDiagnostics.writeDiagnostics();
  }, 120);
}

function renderHotspot(hotspot, isNearest) {
  const locked = hotspot.areaId && isAreaLocked(hotspot.areaId);
  return `
    <button
      class="hotspot hotspot-${hotspot.id} ${hotspot.npc ? "hotspot-npc" : ""} ${hotspot.adventureEvent ? "hotspot-adventure-event" : ""} ${isNearest ? "nearby" : ""}"
      style="left:${hotspot.x}%; top:${hotspot.y}%"
      data-action="hotspot"
      data-hotspot-id="${hotspot.id}"
      ${locked ? "disabled" : ""}
      aria-label="${hotspot.label}"
    >
      <span class="hotspot-art" aria-hidden="true">${renderHotspotArt(hotspot)}</span>
      <span class="hotspot-label">
        <strong>${hotspot.label}</strong>
        <small>${locked ? "等级不足" : `${hotspot.verb} · ${hotspot.kind}`}</small>
      </span>
    </button>
  `;
}

function renderHotspotArt(hotspot) {
  const id = typeof hotspot === "string" ? hotspot : hotspot.id;
  if (hotspot?.adventureEvent) {
    return `<span class="quest-pin"></span><span class="quest-bang">!</span><span class="quest-glow"></span>`;
  }
  if (id === "furnace") {
    return `<span class="furnace-bowl"></span><span class="furnace-glow"></span><span class="furnace-base"></span>`;
  }
  if (id === "distiller") {
    return `<span class="tube tube-a"></span><span class="tube tube-b"></span><span class="flask flask-a"></span><span class="flask flask-b"></span>`;
  }
  if (id === "codex_shelf") {
    return `<span class="book b1"></span><span class="book b2"></span><span class="book b3"></span>`;
  }
  if (id === "task_board") {
    return `<span class="board-line"></span><span class="board-line short"></span>`;
  }
  if (id === "herb_patch") {
    return `<span class="leaf leaf-a"></span><span class="leaf leaf-b"></span><span class="leaf leaf-c"></span>`;
  }
  if (id === "mine_crate") {
    return `<span class="ore ore-a"></span><span class="ore ore-b"></span><span class="ore ore-c"></span>`;
  }
  return `<span class="chest-lid"></span><span class="chest-body"></span>`;
}

function renderDialogueBubble(dialogue) {
  return `
    <aside class="dialogue-bubble" aria-label="${escapeHtml(dialogue.npcName)}的对话">
      <span>${escapeHtml(dialogue.role)}</span>
      <strong>${escapeHtml(dialogue.npcName)}</strong>
      <p>${escapeHtml(dialogue.line)}</p>
      ${dialogue.rewardText ? `<small>获得：${escapeHtml(dialogue.rewardText)}</small>` : ""}
    </aside>
  `;
}

function renderAvatar() {
  return `
    <div class="avatar facing-${avatar.facing} ${avatar.moving ? "moving" : ""}" style="left:${avatar.x}%; top:${avatar.y}%">
      <div class="avatar-shadow"></div>
      <div class="avatar-figure">
        <div class="avatar-hat"></div>
        <div class="avatar-head">
          <span class="eye eye-left"></span>
          <span class="eye eye-right"></span>
          <span class="mouth"></span>
        </div>
        <div class="avatar-arm arm-left"></div>
        <div class="avatar-arm arm-right"></div>
        <div class="avatar-torso">
          <span class="torso-badge"></span>
        </div>
        <div class="avatar-leg leg-left"></div>
        <div class="avatar-leg leg-right"></div>
      </div>
    </div>
  `;
}

function renderSceneNotice(currentScene, nearest) {
  return `
    <div class="scene-panel">
      ${renderUiIcon(sceneNoticeIcon(currentScene, nearest), "scene-notice-icon")}
      <div>
        <span class="meta">${currentScene.name}</span>
        <strong>${nearest ? nearest.label : "NPC、设备或采集点"}</strong>
        ${notice ? `<p>${escapeHtml(notice)}</p>` : `<p>${currentScene.description}</p>`}
      </div>
      <button data-action="interact">${nearest ? nearest.verb : "交互"}</button>
    </div>
  `;
}

function renderDpad() {
  const controls = [
    { action: "move", dx: 0, dy: -1, icon: "move-up", label: "向上" },
    { action: "move", dx: -1, dy: 0, icon: "move-left", label: "向左" },
    { action: "interact", icon: "interact", label: "交互" },
    { action: "move", dx: 1, dy: 0, icon: "move-right", label: "向右" },
    { action: "move", dx: 0, dy: 1, icon: "move-down", label: "向下" },
  ];
  return `
    <div class="dpad" aria-label="移动控制">
      ${controls
        .map((control) => {
          const movement = control.action === "move" ? `data-dx="${control.dx}" data-dy="${control.dy}"` : "";
          return `
            <button class="dpad-control dpad-${control.icon}" data-action="${control.action}" ${movement} aria-label="${control.label}">
              ${renderUiIcon(control.icon, "dpad-icon")}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderDock() {
  const activeBattle = state.adventure.activeRun?.activeBattle;
  const dockItems = [
    { panel: "refine", label: "提炼", icon: "refine" },
    { panel: "alchemy", label: "炼金", icon: "alchemy" },
    { panel: activeBattle ? "battle" : "adventure", label: activeBattle ? "战斗" : "冒险", icon: activeBattle ? "battle" : "adventure" },
    { panel: "bag", label: "背包", icon: "bag" },
    { panel: "codex", label: "图鉴", icon: "codex" },
    { panel: "tasks", label: "任务", icon: "tasks" },
  ];
  return `
    <nav class="quick-dock" aria-label="快捷入口">
      ${dockItems.map((item) => `
        <button data-action="open-panel" data-panel="${item.panel}" aria-label="打开${item.label}">
          ${renderUiIcon(item.icon, "dock-icon")}
          <span>${item.label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderDrawer(panel) {
  const drawerMotion = getUiMotionPlan("drawer");
  return `
    <aside class="drawer drawer-${panel} ${drawerMotion.cssClass}" aria-label="${panelTitle(panel)}" style="--motion-duration:${drawerMotion.durationMs}ms">
      <header class="drawer-head">
        <div class="drawer-title">
          ${renderUiIcon(panelIconName(panel), "drawer-icon")}
          <div>
            <span class="meta">工坊面板</span>
            <h2>${panelTitle(panel)}</h2>
          </div>
        </div>
        <button class="icon-button" data-action="close-panel" aria-label="关闭">
          ${renderUiIcon("close", "control-icon")}
        </button>
      </header>
      ${renderPanelContent(panel)}
    </aside>
  `;
}

function renderPanelContent(panel) {
  if (panel === "alchemy") return renderAlchemyPanel();
  if (panel === "adventure") return renderAdventurePanel();
  if (panel === "battle") return renderBattlePanel();
  if (panel === "codex") return renderCodexPanel();
  if (panel === "tasks") return renderTasksPanel();
  if (panel === "bag") return renderBagPanel();
  return renderRefinePanel();
}

function renderRefinePanel() {
  const availableMaterials = MATERIALS.filter(
    (material) => material.refineOutputs.length > 0 && (state.inventory.materials[material.id] ?? 0) > 0
  );

  return `
    <div class="drawer-actions">
      <button data-action="refine-first" ${availableMaterials.length ? "" : "disabled"}>
        ${renderUiIcon("refine", "button-icon")}
        <span>提炼一个材料</span>
      </button>
    </div>
    <div class="card-grid">
      ${availableMaterials.length ? availableMaterials.map(renderMaterialCard).join("") : renderEmptyState("material", "当前没有可提炼材料。")}
    </div>
  `;
}

function renderMaterialCard(material) {
  const count = state.inventory.materials[material.id] ?? 0;
  const outputs = material.refineOutputs
    .map((output) => {
      const element = ELEMENT_BY_ID[output.elementId];
      return `
        <span class="icon-chip">
          <span class="chip-glyph" aria-hidden="true">${getInventoryIcon({ kind: "element", id: output.elementId })}</span>
          <span>${escapeHtml(element?.name ?? output.elementId)}</span>
        </span>
      `;
    })
    .join("");
  return `
    <article class="mini-card visual-card inventory-tone-${material.quality}">
      <div class="card-glyph inventory-icon" aria-hidden="true">${getInventoryIcon({ kind: "material", id: material.id })}</div>
      <div class="card-copy">
        <h3>${escapeHtml(material.name)}</h3>
        <p>库存 x${count}</p>
        <div class="icon-chip-row" aria-label="可提炼元素">${outputs}</div>
      </div>
      <button class="card-action-button" data-action="refine" data-material-id="${material.id}" data-amount="1">
        ${renderUiIcon("refine", "button-icon")}
        <span>提炼</span>
      </button>
    </article>
  `;
}

function renderAlchemyPanel() {
  const preview = selectedElements.length >= 2 ? getAlchemyPreview(state, selectedElements) : null;
  return `
    <div class="alchemy-selected">
      <span class="meta">当前组合</span>
      <div class="alchemy-slots" aria-label="已选择元素">
        ${[0, 1, 2, 3].map((index) => renderAlchemySlot(selectedElements[index])).join("")}
      </div>
      ${renderPreview(preview)}
    </div>
    <div class="element-picker">
      ${ELEMENTS.map(renderElementButton).join("")}
    </div>
    <div class="drawer-actions">
      <button class="ghost-button" data-action="clear-selection">
        ${renderUiIcon("fail", "button-icon")}
        <span>清空</span>
      </button>
      <button data-action="alchemy" ${selectedElements.length < 2 ? "disabled" : ""}>
        ${renderUiIcon("alchemy", "button-icon")}
        <span>开始炼金</span>
      </button>
    </div>
  `;
}

function renderAdventurePanel() {
  const lastRun = state.adventure.lastRun;
  const activeRun = state.adventure.activeRun;
  return `
    <section class="adventure-summary">
      ${stat("行动力", `${state.resources.actionPoint}/${state.resources.maxActionPoint}`)}
      ${stat("冒险次数", state.adventure.completedRuns)}
      ${stat(activeRun ? "进行中" : "最近路线", activeRun?.routeName ?? lastRun?.routeName ?? "未出发")}
    </section>
    ${activeRun ? renderActiveAdventure(activeRun) : ""}
    <div class="adventure-routes">
      ${ADVENTURE_ROUTES.map(renderAdventureRoute).join("")}
    </div>
    ${lastRun ? renderAdventureTimeline(lastRun) : ""}
  `;
}

function renderAdventureRoute(route) {
  const preview = getAdventurePreview(state, route.id);
  const locked = preview.locked;
  const activeRun = state.adventure.activeRun;
  const disabled = locked || !preview.canAfford || !!activeRun;
  const buttonText = activeRun?.routeId === route.id ? "进行中" : activeRun ? "冒险中" : locked ? "未解锁" : preview.canAfford ? "出发" : "行动力不足";
  const successRate = Math.round(preview.successRate * 100);
  return `
    <article class="mini-card visual-card adventure-route">
      <div class="card-glyph route-glyph">
        ${renderUiIcon(`scene-${route.sceneId}`, "route-scene-icon")}
        ${renderUiIcon(route.school, "route-school-icon")}
      </div>
      <div class="card-copy">
        <h3>${escapeHtml(route.name)}</h3>
        <p>${escapeHtml(route.kind)} · ${SCHOOL_LABELS[route.school]}</p>
        <div class="icon-chip-row">
          <span class="icon-chip">${renderUiIcon("success", "chip-ui-icon")}<span>${successRate}%</span></span>
          <span class="icon-chip">${renderUiIcon("action-point", "chip-ui-icon")}<span>${route.actionPointCost}</span></span>
          <span class="icon-chip">${renderUiIcon("item", "chip-ui-icon")}<span>${preview.itemPower}</span></span>
        </div>
        <span class="meta">${escapeHtml(route.description)}</span>
        <small>${locked ? `需要炼金师 Lv.${route.minAlchemistLevel}` : `事件 ${route.eventCount} · 推荐装备评分 ${preview.itemPower}`}</small>
      </div>
      <button class="card-action-button" data-action="run-adventure" data-route-id="${route.id}" ${disabled ? "disabled" : ""}>
        ${renderUiIcon(locked ? "locked" : "route", "button-icon")}
        <span>${buttonText}</span>
      </button>
    </article>
  `;
}

function renderActiveAdventure(activeRun) {
  const active = getActiveAdventureEvent(state);
  const battle = activeRun.activeBattle;
  const routeScene = getScene(activeRun.sceneId);
  const completed = activeRun.events.length;
  const eventCount = active?.route.eventCount ?? Math.max(completed, 1);
  const progress = Math.min(100, Math.round((completed / eventCount) * 100));
  return `
    <section class="adventure-active">
      ${renderUiIcon(battle ? "battle" : `scene-${routeScene.id}`, "active-route-icon")}
      <div>
        <span class="meta">当前路线 · ${escapeHtml(routeScene.name)}</span>
        <h3>${escapeHtml(activeRun.routeName)}</h3>
        <p>${battle ? `遭遇${escapeHtml(battle.enemyName)}，完成战斗后继续路线。` : active ? `前往场景中的「${escapeHtml(active.event.title)}」并交互。` : "路线即将结算。"}</p>
      </div>
      <div class="adventure-progress" aria-label="冒险进度">
        <span style="width:${progress}%"></span>
      </div>
      <small>${completed}/${eventCount} 个事件</small>
    </section>
  `;
}

function renderAdventureTimeline(lastRun) {
  return `
    <section class="adventure-log">
      <div class="section-title">
        ${renderUiIcon("route", "section-title-icon")}
        <div>
          <h3>最近冒险</h3>
          <p>${escapeHtml(lastRun.routeName)} · ${lastRun.successCount}/${lastRun.eventCount} 个事件处理成功</p>
        </div>
      </div>
      <div class="adventure-events">
        ${lastRun.events.map((event) => `
          <article class="${event.success ? "success" : "fail"}">
            ${renderUiIcon(event.battle ? "battle" : event.success ? "success" : "fail", "timeline-icon")}
            <div>
              <strong>${escapeHtml(event.title)}</strong>
              <p>${escapeHtml(event.line)}</p>
              <small>${event.success ? "成功" : "失手"}${event.battle ? ` · 战斗 ${escapeHtml(event.battle.enemyName)}` : ""} · ${formatAdventureReward(event.reward)}</small>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderBattlePanel() {
  const battle = state.adventure.activeRun?.activeBattle;
  if (!battle) return `<p class="empty">当前没有遭遇战。</p>`;
  const view = getBattlePresentation(battle, getScene(currentSceneId));
  return `
    <section class="battle-panel battle-motion-${view.motion}" style="--motion-frames:${view.motionFrameCount}; --motion-duration:${view.motionDurationMs}ms">
      <div class="battle-transition" aria-hidden="true"><span>遭遇战</span></div>
      <div class="battle-stage ${view.sceneClass}" aria-label="战斗场景">
        <div class="battle-stage-backdrop" aria-hidden="true"></div>
        ${renderBattleHud(battle.enemyName, battle.enemyDescription, battle.enemyHp, battle.enemyMaxHp, view.enemyPercent, "enemy")}
        ${renderBattleHud("炼金师", `回合 ${battle.turn}`, battle.playerHp, battle.playerMaxHp, view.playerPercent, "player")}
        <div class="battle-platform enemy-platform" aria-hidden="true">
          ${renderEnemyBattleSprite(view.enemySprite)}
        </div>
        <div class="battle-platform player-platform" aria-hidden="true">
          ${renderPlayerBattleSprite()}
        </div>
        <div class="move-effect move-effect-${view.effect} ${view.effectClass}" aria-hidden="true"></div>
      </div>
      <div class="battle-caption">
        <strong>${escapeHtml(view.caption)}</strong>
        <span>${escapeHtml(battle.enemyName)} · HP ${battle.enemyHp}/${battle.enemyMaxHp}</span>
      </div>
      <section class="battle-actions" aria-label="战斗行动">
        <button data-action="battle-action" data-battle-action="attack">
          ${renderUiIcon("attack", "battle-action-icon")}
          <span><strong>攻击</strong><small>近身打击</small></span>
        </button>
        <button data-action="battle-action" data-battle-action="alchemy">
          ${renderUiIcon("alchemy", "battle-action-icon")}
          <span><strong>炼金术</strong><small>元素爆发</small></span>
        </button>
        <button data-action="battle-action" data-battle-action="guard">
          ${renderUiIcon("guard", "battle-action-icon")}
          <span><strong>防御</strong><small>守势反击</small></span>
        </button>
      </section>
      <div class="battle-stats">
        ${renderBattleStat("attack", "攻击", battle.stats.attack)}
        ${renderBattleStat("alchemy", "炼金", battle.stats.alchemy)}
        ${renderBattleStat("guard", "防御", battle.stats.defense)}
        ${renderBattleStat("heal", "回复", battle.stats.heal)}
      </div>
      <ol class="battle-log">
        ${battle.logs.slice(-5).map((entry) => `<li>${renderUiIcon("battle", "log-icon")}<span>${escapeHtml(entry)}</span></li>`).join("")}
      </ol>
    </section>
  `;
}

function renderBattleHud(name, detail, hp, maxHp, percent, side) {
  return `
    <article class="battle-hud battle-hud-${side}">
      <span>${escapeHtml(detail)}</span>
      <strong>${escapeHtml(name)}</strong>
      <div class="hp-bar" aria-label="${escapeHtml(name)}生命值">
        <span style="width:${clamp(percent, 0, 100)}%"></span>
      </div>
      <small>HP ${hp}/${maxHp}</small>
    </article>
  `;
}

function renderEnemyBattleSprite(sprite) {
  return `
    <div class="battle-sprite enemy-sprite sprite-${sprite}">
      <span class="sprite-shadow"></span>
      <span class="sprite-aura"></span>
      <span class="sprite-body"></span>
      <span class="sprite-face"></span>
      <span class="sprite-detail detail-a"></span>
      <span class="sprite-detail detail-b"></span>
    </div>
  `;
}

function renderPlayerBattleSprite() {
  return `
    <div class="battle-sprite player-sprite">
      <span class="sprite-shadow"></span>
      <span class="player-coat"></span>
      <span class="player-head"></span>
      <span class="player-hat"></span>
      <span class="player-pack"></span>
      <span class="player-arm"></span>
      <span class="player-orb"></span>
      <span class="player-spark spark-a"></span>
      <span class="player-spark spark-b"></span>
    </div>
  `;
}

function renderElementButton(element) {
  const count = state.inventory.elements[element.id] ?? 0;
  const selected = selectedElements.includes(element.id);
  return `
    <button class="element-button ${selected ? "selected" : ""}" data-action="select-element" data-element-id="${element.id}" ${count <= 0 ? "disabled" : ""}>
      <span class="element-button-icon" aria-hidden="true">${getInventoryIcon({ kind: "element", id: element.id })}</span>
      <span class="element-button-copy">
        <strong>${escapeHtml(element.name)}</strong>
        <small>x${count}</small>
      </span>
    </button>
  `;
}

function renderPreview(preview) {
  if (!preview) {
    return `
      <div class="alchemy-preview empty-preview">
        ${renderUiIcon("element", "preview-icon")}
        <div>
          <strong>等待元素</strong>
          <p>先提炼材料得到元素。</p>
        </div>
      </div>
    `;
  }
  if (!preview.recipe) {
    return `
      <div class="alchemy-preview empty-preview">
        ${renderUiIcon("unknown", "preview-icon")}
        <div>
          <strong>未知反应</strong>
          <p>${escapeHtml(preview.message)}</p>
        </div>
      </div>
    `;
  }
  const recipeName = preview.known ? preview.recipe.name : "未知配方";
  const item = ITEM_BY_ID[preview.recipe.outputItemId];
  const successRate = Math.round(preview.successRate * 100);
  return `
    <div class="alchemy-preview">
      <span class="preview-output inventory-icon" aria-hidden="true">
        ${getInventoryIcon({ kind: "item", id: item.id, category: item.category })}
      </span>
      <div>
        <strong>${escapeHtml(recipeName)}</strong>
        <p>${SCHOOL_LABELS[preview.recipe.school]} · 成功率 ${successRate}%</p>
        <div class="success-meter" aria-label="炼金成功率">
          <span style="width:${successRate}%"></span>
        </div>
        <span class="meta">配方熟练 Lv.${preview.recipeLevel} / 学派熟练 Lv.${preview.schoolLevel}</span>
      </div>
    </div>
  `;
}

function renderBagPanel() {
  const materialSlots = MATERIALS.filter((material) => (state.inventory.materials[material.id] ?? 0) > 0);
  return `
    <section class="bag-section">
      <h3>材料</h3>
      <div class="inventory-grid">
        ${
          materialSlots.length
            ? materialSlots
                .map((material) =>
                  renderInventorySlot({
                    name: material.name,
                    meta: `${QUALITY_LABELS[material.quality] ?? material.quality}材料`,
                    count: state.inventory.materials[material.id],
                    icon: getInventoryIcon({ kind: "material", id: material.id }),
                    tone: material.quality,
                  })
                )
                .join("")
            : `<p class="empty">还没有材料。</p>`
        }
      </div>
    </section>
    <section class="bag-section">
      <h3>元素</h3>
      <div class="inventory-grid element-inventory">
        ${ELEMENTS.map((element) =>
          renderInventorySlot({
            name: element.name,
            meta: "基础元素",
            count: state.inventory.elements[element.id] ?? 0,
            icon: getInventoryIcon({ kind: "element", id: element.id }),
            tone: element.id,
          })
        ).join("")}
      </div>
    </section>
    <section class="bag-section">
      <h3>炼成物</h3>
      <div class="inventory-grid item-list">
        ${state.inventory.items.length ? state.inventory.items.map(renderItemCard).join("") : `<p class="empty">还没有炼成物。</p>`}
      </div>
    </section>
  `;
}

function renderItemCard(item) {
  const config = ITEM_BY_ID[item.itemId];
  const stats = Object.entries(item.stats)
    .map(([key, value]) => `${statLabel(key)} +${value}`)
    .join(" / ");
  return `
    ${renderInventorySlot({
      name: config.name,
      meta: `${CATEGORY_LABELS[config.category]} · ${SCHOOL_LABELS[config.school]}`,
      detail: stats,
      count: 1,
      icon: getInventoryIcon({ kind: "item", id: item.itemId, category: config.category }),
      tone: item.quality,
      quality: item.quality,
      wide: true,
    })}
  `;
}

function renderInventorySlot({ name, meta, detail = "", count, icon, tone = "common", quality = "", wide = false }) {
  const empty = count <= 0;
  return `
    <article class="inventory-slot ${wide ? "inventory-slot-wide" : ""} ${empty ? "empty-slot" : ""} inventory-tone-${tone}">
      <div class="inventory-icon" aria-hidden="true">${icon}</div>
      <div class="inventory-copy">
        <h4>${escapeHtml(name)}</h4>
        <span>${escapeHtml(meta)}</span>
        ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
      </div>
      <b class="inventory-count">x${count}</b>
      ${quality ? `<em class="quality ${QUALITY_CLASS[quality]}">${QUALITY_LABELS[quality]}</em>` : ""}
    </article>
  `;
}

function renderCodexPanel() {
  const discoveredRecipes = new Set(state.codex.discoveredRecipeIds);
  return `
    <section class="codex-summary">
      ${stat("材料", `${state.codex.discoveredMaterialIds.length}/${MATERIALS.length}`)}
      ${stat("元素", `${state.codex.discoveredElementIds.length}/${ELEMENTS.length}`)}
      ${stat("配方", `${state.codex.discoveredRecipeIds.length}/${RECIPES.length}`)}
      ${stat("物品", `${state.codex.discoveredItemIds.length}/${Object.keys(ITEM_BY_ID).length}`)}
    </section>
    <div class="recipe-list">
      ${RECIPES.map((recipe) => renderCodexRecipe(recipe, discoveredRecipes.has(recipe.id))).join("")}
    </div>
  `;
}

function renderCodexRecipe(recipe, discovered) {
  const item = ITEM_BY_ID[recipe.outputItemId];
  const publicRecipe = recipe.unlockType === "public";
  const visible = discovered || publicRecipe;
  const elements = recipe.inputElementIds
    .map((id) => {
      const element = ELEMENT_BY_ID[id];
      return `
        <span class="icon-chip recipe-element">
          <span class="chip-glyph" aria-hidden="true">${getInventoryIcon({ kind: "element", id })}</span>
          <span>${visible ? escapeHtml(element?.name ?? id) : "?"}</span>
        </span>
      `;
    })
    .join("");
  const quality = state.codex.highestItemQuality[item.id];
  return `
    <article class="recipe-card ${discovered ? "discovered" : ""}">
      <div class="recipe-output inventory-icon" aria-hidden="true">
        ${visible ? getInventoryIcon({ kind: "item", id: item.id, category: item.category }) : getUiIcon("locked")}
      </div>
      <div class="card-copy">
        <h3>${visible ? escapeHtml(recipe.name) : "未发现配方"}</h3>
        <div class="icon-chip-row recipe-elements">${visible ? elements : `${recipe.inputElementIds.length} 个元素 · ${SCHOOL_LABELS[recipe.school]}`}</div>
      </div>
      <span class="quality ${quality ? QUALITY_CLASS[quality] : "quality-unknown"}">${quality ? QUALITY_LABELS[quality] : recipe.unlockType}</span>
    </article>
  `;
}

function renderTasksPanel() {
  return `
    <div class="task-stack">
      ${TASKS.map(renderTaskCard).join("")}
    </div>
  `;
}

function renderTaskCard(task) {
  const progress = state.tasks.progress[task.metric] ?? 0;
  const done = progress >= task.target;
  const claimed = state.tasks.claimedIds.includes(task.id);
  const progressPercent = Math.min(100, Math.round((Math.min(progress, task.target) / task.target) * 100));
  return `
    <article class="mini-card visual-card task-card ${done ? "task-done" : ""}">
      <div class="card-glyph">${renderUiIcon(taskIconName(task.metric), "task-icon")}</div>
      <div class="card-copy">
        <h3>${escapeHtml(task.title)}</h3>
        <div class="task-progress" aria-label="任务进度">
          <span style="width:${progressPercent}%"></span>
        </div>
        <p>进度 ${Math.min(progress, task.target)}/${task.target}</p>
        <div class="reward-row">
          ${task.reward.coins ? `<span class="icon-chip">${renderUiIcon("coin", "chip-ui-icon")}<span>+${task.reward.coins}</span></span>` : ""}
          ${task.reward.inspiration ? `<span class="icon-chip">${renderUiIcon("inspiration", "chip-ui-icon")}<span>+${task.reward.inspiration}</span></span>` : ""}
        </div>
      </div>
      <button class="card-action-button" data-action="claim-task" data-task-id="${task.id}" ${!done || claimed ? "disabled" : ""}>
        ${renderUiIcon(claimed ? "success" : "reward", "button-icon")}
        <span>${claimed ? "已领" : "领取"}</span>
      </button>
    </article>
  `;
}

function stat(label, value, iconName = statIconName(label)) {
  return `
    <div class="stat">
      ${renderUiIcon(iconName, "stat-icon")}
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    </div>
  `;
}

function renderUiIcon(name, className = "") {
  const classes = ["ui-icon", className].filter(Boolean).join(" ");
  return `<span class="${classes}" aria-hidden="true">${getUiIcon(name)}</span>`;
}

function renderEmptyState(iconName, text) {
  return `
    <div class="empty ui-empty">
      ${renderUiIcon(iconName, "empty-icon")}
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function renderAlchemySlot(elementId) {
  if (!elementId) {
    return `
      <span class="alchemy-slot empty-slot">
        ${renderUiIcon("element", "slot-placeholder-icon")}
        <small>空</small>
      </span>
    `;
  }
  const element = ELEMENT_BY_ID[elementId];
  return `
    <span class="alchemy-slot filled-slot">
      <span class="slot-inventory-icon" aria-hidden="true">${getInventoryIcon({ kind: "element", id: elementId })}</span>
      <small>${escapeHtml(element?.name ?? elementId)}</small>
    </span>
  `;
}

function renderBattleStat(iconName, label, value) {
  return `
    <span class="battle-stat-chip">
      ${renderUiIcon(iconName, "battle-stat-icon")}
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </span>
  `;
}

function statIconName(label) {
  return {
    炼金师: "alchemist",
    金币: "coin",
    灵感: "inspiration",
    配方: "recipe",
    行动力: "action-point",
    冒险次数: "adventure",
    进行中: "route",
    最近路线: "route",
    材料: "material",
    元素: "element",
    物品: "item",
  }[label] ?? "unknown";
}

function panelIconName(panel) {
  return {
    refine: "refine",
    alchemy: "alchemy",
    adventure: "adventure",
    battle: "battle",
    codex: "codex",
    tasks: "tasks",
    bag: "bag",
  }[panel] ?? "unknown";
}

function taskIconName(metric) {
  return {
    collect: "collect",
    refine: "refine",
    alchemy: "alchemy",
    discoverRecipe: "recipe",
  }[metric] ?? "tasks";
}

function sceneNoticeIcon(currentScene, nearest) {
  if (nearest?.adventureEvent) return "route";
  if (nearest?.npc) return "alchemist";
  if (nearest?.panel) return panelIconName(nearest.panel);
  if (nearest?.areaId) return "collect";
  return `scene-${currentScene.id}`;
}

function panelTitle(panel) {
  return {
    refine: "元素提炼",
    alchemy: "炼金台",
    adventure: "冒险路线",
    battle: "遭遇战",
    codex: "图鉴柜",
    tasks: "任务板",
    bag: "物品箱",
  }[panel];
}

function isAreaLocked(areaId) {
  const area = AREAS.find((entry) => entry.id === areaId);
  return area && state.alchemist.level < area.minAlchemistLevel;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  try {
    return ensureStateShape(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

function loadAvatar() {
  const raw = localStorage.getItem(AVATAR_KEY);
  if (!raw) return defaultAvatar();
  try {
    return { ...defaultAvatar(), ...JSON.parse(raw) };
  } catch {
    return defaultAvatar();
  }
}

function loadSceneId() {
  const sceneId = localStorage.getItem(SCENE_KEY);
  return getScene(sceneId).id;
}

function defaultAvatar() {
  return { x: 50, y: 68, facing: "down", moving: false };
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  persistAvatar();
  persistScene();
  render();
}

function persistAvatar() {
  localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
}

function persistScene() {
  localStorage.setItem(SCENE_KEY, currentSceneId);
}

function formatElementGain(gainedElements) {
  return Object.entries(gainedElements)
    .map(([elementId, count]) => `${ELEMENT_BY_ID[elementId]?.name ?? elementId} x${count}`)
    .join("、");
}

function formatNpcReward(reward) {
  if (!reward) return "";
  const entries = [];
  if (reward.coins) entries.push(`金币 x${reward.coins}`);
  if (reward.inspiration) entries.push(`灵感 x${reward.inspiration}`);
  if (reward.actionPoint) entries.push(`行动力 x${reward.actionPoint}`);
  for (const [materialId, count] of Object.entries(reward.materials ?? {})) {
    entries.push(`${MATERIAL_BY_ID[materialId]?.name ?? materialId} x${count}`);
  }
  for (const [elementId, count] of Object.entries(reward.elements ?? {})) {
    entries.push(`${ELEMENT_BY_ID[elementId]?.name ?? elementId} x${count}`);
  }
  return entries.join("、");
}

function formatAdventureReward(reward) {
  if (!reward) return "无奖励";
  const entries = [];
  if (reward.coins) entries.push(`金币 x${reward.coins}`);
  if (reward.inspiration) entries.push(`灵感 x${reward.inspiration}`);
  for (const [materialId, count] of Object.entries(reward.materials ?? {})) {
    entries.push(`${MATERIAL_BY_ID[materialId]?.name ?? materialId} x${count}`);
  }
  for (const [elementId, count] of Object.entries(reward.elements ?? {})) {
    entries.push(`${ELEMENT_BY_ID[elementId]?.name ?? elementId} x${count}`);
  }
  return entries.join("、") || "无奖励";
}

function statLabel(key) {
  return {
    attack: "攻击",
    defense: "防御",
    heal: "治疗",
    sustain: "续航",
    mobility: "机动",
    discovery: "探索",
    cleanse: "净化",
    control: "控制",
    rarity: "稀有",
  }[key] ?? key;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
