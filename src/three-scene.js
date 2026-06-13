import * as THREE from "../node_modules/three/build/three.module.js";
import { percentToWorld } from "./world.js";

const TILE_SIZE = 1;
const DIAGNOSTIC_INTERVAL_SECONDS = 0.3;
export const AVATAR_MOTION = {
  followStrength: 12,
  snapDistance: 0.02,
  turnStrength: 18,
  walkBobSpeed: 14,
  walkBobHeight: 0.085,
  bodySway: 0.045,
  headSway: 0.032,
  accessorySway: 0.06,
};

const AVATAR_SILHOUETTE_PLAN = {
  style: "pixel-chibi-alchemist",
  head: { width: 0.72, height: 0.58, depth: 0.56 },
  body: { width: 0.56, height: 0.68, depth: 0.42 },
  parts: [
    "shadow",
    "boots",
    "robe",
    "front-panel",
    "cape",
    "belt",
    "potion-belt",
    "satchel",
    "arms",
    "hands",
    "head",
    "hair",
    "eyes",
    "cheeks",
    "mouth",
    "wide-brim-hat",
    "hat-rune",
    "wand",
    "companion-orb",
  ],
};

export function getAvatarSilhouettePlan() {
  return {
    ...AVATAR_SILHOUETTE_PLAN,
    head: { ...AVATAR_SILHOUETTE_PLAN.head },
    body: { ...AVATAR_SILHOUETTE_PLAN.body },
    parts: [...AVATAR_SILHOUETTE_PLAN.parts],
  };
}

export function shouldWriteDiagnostics(time, lastDiagnosticAt, interval = DIAGNOSTIC_INTERVAL_SECONDS) {
  return time - lastDiagnosticAt >= interval;
}

export function dampValue(current, target, strength, delta) {
  return current + (target - current) * (1 - Math.exp(-strength * delta));
}

export function shortestAngleDelta(current, target) {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

export class ThreeWorkshopScene {
  constructor(container, options) {
    this.container = container;
    this.avatar = options.avatar;
    this.sceneConfig = options.scene ?? { id: "workshop", background: 0xb8d3ca };
    this.hotspots = options.hotspots;
    this.nearestId = options.nearestId;
    this.animationId = 0;
    this.clock = new THREE.Clock();
    this.animatedObjects = [];
    this.lastDiagnosticAt = -Infinity;
    this.targetWorld = percentToWorld(this.avatar);
    this.targetRotationY = getFacingRotation(this.avatar.facing);
    this.displayWorld = { ...this.targetWorld };
    this.displayY = 0.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.sceneConfig.background ?? 0xb8d3ca);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = "three-canvas";
    this.container.append(this.renderer.domElement);
    this.container.dataset.threeMounted = "true";

    this.camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 100);
    this.camera.position.set(6.5, 7, 7.5);
    this.camera.lookAt(0, 0, 0);

    this.avatarGroup = new THREE.Group();
    this.hotspotGroups = new Map();

    this.buildLights();
    this.buildWorld();
    this.buildHotspots();
    this.buildAvatar();
    this.resize();
    this.animate();
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  setViewState(options) {
    this.avatar = options.avatar ?? this.avatar;
    this.nearestId = options.nearestId ?? null;
    this.hotspots = options.hotspots ?? this.hotspots;
    this.targetWorld = percentToWorld(this.avatar);
    this.targetRotationY = getFacingRotation(this.avatar.facing);
  }

  buildLights() {
    const ambient = new THREE.HemisphereLight(0xf8f0cf, 0x51695f, 1.9);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff1b7, 2.6);
    key.position.set(4, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    this.scene.add(key);
  }

  buildWorld() {
    if (this.sceneConfig.id === "meadow") {
      this.buildMeadowWorld();
      return;
    }
    if (this.sceneConfig.id === "mine") {
      this.buildMineWorld();
      return;
    }
    if (this.sceneConfig.id === "sky_dock") {
      this.buildSkyDockWorld();
      return;
    }
    this.buildWorkshopWorld();
  }

  buildWorkshopWorld() {
    this.addTileBase(0x8d623c, [0xd8a760, 0xc79252]);

    const backWall = block(13.2, 4.2, 0.35, 0xa8cbc0);
    backWall.position.set(0, 1.82, -4.58);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const wallTrim = block(13.4, 0.28, 0.52, 0x5d3c28);
    wallTrim.position.set(0, 0.2, -4.35);
    this.scene.add(wallTrim);

    this.addWindow(0, -4.78);
    this.addShelf(-4.6, -4.32);
    this.addShelf(4.4, -4.32);
    this.addRug();
    this.addDoor(-0.6, 3.7);
  }

  buildMeadowWorld() {
    this.addTileBase(0x4e7d50, [0x75b86f, 0x68a764]);
    this.addRiver();
    this.addTree(-4.4, -2.6);
    this.addTree(-3.4, 2.7);
    this.addTree(4.7, -1.6);
    this.addFlowerCluster(-1.6, 1.8);
    this.addFlowerCluster(2.8, -2.2);
    this.addAnimatedBlock(0.16, 0.16, 0.16, 0xffe76a, -2.7, 1.2, -1.4, "firefly", 0);
    this.addAnimatedBlock(0.14, 0.14, 0.14, 0xd9fff2, 2.1, 1.1, 1.4, "firefly", 1.2);
  }

  buildMineWorld() {
    this.addTileBase(0x313533, [0x57594f, 0x484c45]);
    const backWall = block(13.2, 3.7, 0.52, 0x44443f);
    backWall.position.set(0, 1.55, -4.52);
    this.scene.add(backWall);

    for (let index = 0; index < 7; index += 1) {
      const x = -5.1 + index * 1.7;
      this.scene.add(positionedBlock(0.58, 1.1 + (index % 3) * 0.28, 0.45, 0x2f302d, x, 0.58, -4.15));
    }

    this.addMineRail();
    this.addAnimatedBlock(1.7, 0.08, 0.34, 0xf26832, -2.2, 0.12, 1.5, "glow", 0);
    this.addAnimatedBlock(0.22, 0.22, 0.22, 0x8be4ff, 3.4, 0.55, -1.8, "sparkle", 0.7);
    this.addAnimatedBlock(0.18, 0.18, 0.18, 0xf1d06a, 4.7, 0.52, 0.6, "sparkle", 1.7);
  }

  buildSkyDockWorld() {
    this.addTileBase(0x6f7f86, [0xb8c5ba, 0x98aba5]);
    this.addCloud(-4.5, -3.1, 0);
    this.addCloud(4.4, -2.2, 1.4);
    this.addCloud(3.7, 2.9, 2.4);
    this.addAirshipSilhouette(1.3, -2.1);

    const rail = block(11.7, 0.32, 0.28, 0x5a6970);
    rail.position.set(0, 0.35, -3.85);
    this.scene.add(rail);

    const mast = block(0.28, 2.3, 0.28, 0x6c5541);
    mast.position.set(-3.8, 1.15, -2.2);
    this.scene.add(mast);
    const flag = this.addAnimatedBlock(0.95, 0.46, 0.08, 0xd65d4f, -3.35, 2.08, -2.2, "sway", 0.2);
    flag.rotation.y = 0.1;
  }

  addTileBase(baseColor, tileColors) {
    const floorBase = block(12.8, 0.36, 8.8, baseColor);
    floorBase.position.set(0, -0.22, 0);
    floorBase.receiveShadow = true;
    this.scene.add(floorBase);

    for (let x = -5.5; x <= 5.5; x += TILE_SIZE) {
      for (let z = -3.5; z <= 3.5; z += TILE_SIZE) {
        const shade = (Math.round(x + z) & 1) === 0 ? tileColors[0] : tileColors[1];
        const tile = block(0.96, 0.08, 0.96, shade);
        tile.position.set(x, 0, z);
        tile.receiveShadow = true;
        this.scene.add(tile);
      }
    }
  }

  buildHotspots() {
    for (const hotspot of this.hotspots) {
      const world = percentToWorld({ x: hotspot.x, y: hotspot.y });
      const group = new THREE.Group();
      group.position.set(world.x, 0.08, world.z);
      group.userData.hotspotId = hotspot.id;
      this.addHotspotModel(group, hotspot);

      if (hotspot.id === this.nearestId) {
        const marker = block(1.25, 0.06, 1.25, 0xf6d35b);
        marker.position.y = -0.03;
        group.add(marker);
      }

      this.hotspotGroups.set(hotspot.id, group);
      this.scene.add(group);
    }
  }

  buildAvatar() {
    this.avatarGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.accessoryGroup = new THREE.Group();
    this.companionOrb = new THREE.Group();

    const plan = getAvatarSilhouettePlan();
    const skin = 0xe4a875;
    const skinShade = 0xc9825c;
    const cheekPink = 0xf0a596;
    const outline = 0x2a211b;
    const robe = 0x327b68;
    const robeLight = 0x3f9a7c;
    const robeDark = 0x1f5148;
    const gold = 0xe2b543;
    const purple = 0x6c4aa2;
    const purpleDark = 0x433266;
    const boot = 0x403630;

    this.avatarPose = {
      bodyY: 0,
      headY: 0,
      accessoryY: 0,
      companionY: 1.42,
      leftLegY: 0.22,
      rightLegY: 0.22,
      leftArmY: 0.76,
      rightArmY: 0.76,
    };

    this.avatarGroup.scale.setScalar(1.05);
    this.avatarGroup.add(positionedBlock(0.9, 0.06, 0.64, outline, 0, 0.03, 0.02));

    const cape = positionedBlock(0.66, 0.68, 0.1, purpleDark, 0, 0.72, 0.24);
    cape.rotation.x = -0.06;
    this.bodyGroup.add(cape);

    const body = positionedBlock(plan.body.width, plan.body.height, plan.body.depth, robe, 0, 0.7, 0);
    this.bodyGroup.add(body);
    this.bodyGroup.add(positionedBlock(0.2, 0.62, 0.44, robeDark, 0.22, 0.69, 0.01));
    this.bodyGroup.add(positionedBlock(0.28, 0.58, 0.45, robeLight, -0.13, 0.72, -0.02));
    this.bodyGroup.add(positionedBlock(0.62, 0.11, 0.48, gold, 0, 0.39, -0.01));
    this.bodyGroup.add(positionedBlock(0.66, 0.1, 0.48, outline, 0, 0.79, -0.01));
    this.bodyGroup.add(positionedBlock(0.18, 0.18, 0.08, gold, 0, 0.86, -0.25));
    this.bodyGroup.add(positionedBlock(0.12, 0.12, 0.09, 0x8be4ff, 0.01, 0.87, -0.31));

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.18, this.avatarPose.leftLegY, 0.01);
    this.leftLeg.add(positionedBlock(0.2, 0.34, 0.24, boot, 0, 0, 0));
    this.leftLeg.add(positionedBlock(0.28, 0.1, 0.3, outline, -0.02, -0.2, -0.04));
    this.bodyGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.18, this.avatarPose.rightLegY, 0.01);
    this.rightLeg.add(positionedBlock(0.2, 0.34, 0.24, boot, 0, 0, 0));
    this.rightLeg.add(positionedBlock(0.28, 0.1, 0.3, outline, 0.02, -0.2, -0.04));
    this.bodyGroup.add(this.rightLeg);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.43, this.avatarPose.leftArmY, -0.02);
    this.leftArm.add(positionedBlock(0.18, 0.42, 0.2, robeDark, 0, 0.05, 0));
    this.leftArm.add(positionedBlock(0.16, 0.18, 0.18, skin, -0.01, -0.22, -0.02));
    this.bodyGroup.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.43, this.avatarPose.rightArmY, -0.02);
    this.rightArm.add(positionedBlock(0.18, 0.42, 0.2, robeLight, 0, 0.05, 0));
    this.rightArm.add(positionedBlock(0.16, 0.18, 0.18, skin, 0.01, -0.22, -0.02));
    this.bodyGroup.add(this.rightArm);

    const head = positionedBlock(plan.head.width, plan.head.height, plan.head.depth, skin, 0, 1.35, -0.02);
    this.headGroup.add(head);
    this.headGroup.add(positionedBlock(0.1, 0.22, 0.12, skinShade, -0.39, 1.34, -0.02));
    this.headGroup.add(positionedBlock(0.1, 0.22, 0.12, skinShade, 0.39, 1.34, -0.02));
    this.headGroup.add(positionedBlock(0.12, 0.12, 0.05, outline, -0.15, 1.39, -0.33));
    this.headGroup.add(positionedBlock(0.12, 0.12, 0.05, outline, 0.15, 1.39, -0.33));
    this.headGroup.add(positionedBlock(0.04, 0.04, 0.06, 0xffffff, -0.13, 1.42, -0.36));
    this.headGroup.add(positionedBlock(0.04, 0.04, 0.06, 0xffffff, 0.17, 1.42, -0.36));
    this.headGroup.add(positionedBlock(0.14, 0.06, 0.05, cheekPink, -0.29, 1.28, -0.33));
    this.headGroup.add(positionedBlock(0.14, 0.06, 0.05, cheekPink, 0.29, 1.28, -0.33));
    this.headGroup.add(positionedBlock(0.16, 0.04, 0.05, 0x7a3f31, 0, 1.22, -0.33));
    this.headGroup.add(positionedBlock(0.74, 0.16, 0.58, outline, 0, 1.65, -0.02));
    this.headGroup.add(positionedBlock(0.18, 0.28, 0.12, outline, -0.32, 1.48, -0.28));
    this.headGroup.add(positionedBlock(0.16, 0.24, 0.12, outline, 0.31, 1.5, -0.28));

    this.headGroup.add(positionedBlock(0.92, 0.12, 0.7, purpleDark, 0, 1.66, -0.03));
    this.headGroup.add(positionedBlock(0.94, 0.11, 0.28, gold, 0, 1.62, -0.38));
    this.headGroup.add(positionedBlock(0.66, 0.32, 0.56, purple, 0, 1.82, -0.02));
    this.headGroup.add(positionedBlock(0.44, 0.16, 0.42, 0x7e5bb8, 0, 2.06, -0.02));
    const hatRune = positionedBlock(0.14, 0.12, 0.08, 0x8be4ff, -0.22, 1.84, -0.34);
    this.headGroup.add(hatRune);
    this.trackAnimation(hatRune, "pulse", 0.35);
    this.headGroup.add(positionedBlock(0.11, 0.08, 0.08, 0xf8f0cf, 0.2, 1.95, -0.34));

    const satchel = positionedBlock(0.28, 0.34, 0.16, 0x7a5131, -0.48, 0.73, -0.18);
    this.accessoryGroup.add(satchel);
    this.accessoryGroup.add(positionedBlock(0.08, 0.5, 0.08, gold, -0.3, 0.86, -0.25));
    [-0.14, 0.02, 0.18].forEach((x, index) => {
      const potion = positionedBlock(0.12, 0.18, 0.1, [0x7ad6df, 0xf58a9f, 0xd9fff2][index], x, 0.66, -0.3);
      this.accessoryGroup.add(potion);
      this.trackAnimation(potion, "bob", 0.45 + index * 0.35);
    });

    const wand = positionedBlock(0.08, 0.76, 0.08, 0x6b4b2e, 0.58, 0.9, -0.08);
    wand.rotation.z = -0.24;
    this.accessoryGroup.add(wand);
    const wandCrystal = positionedBlock(0.2, 0.2, 0.18, 0x8be4ff, 0.65, 1.25, -0.12);
    this.accessoryGroup.add(wandCrystal);
    this.trackAnimation(wandCrystal, "sparkle", 0.2);

    this.companionOrb.position.set(0.62, this.avatarPose.companionY, -0.42);
    this.companionOrb.add(positionedBlock(0.18, 0.18, 0.18, 0x9ff3ff, 0, 0, 0));
    this.companionOrb.add(positionedBlock(0.08, 0.08, 0.08, 0xffffff, -0.07, 0.05, -0.08));
    this.companionOrb.add(positionedBlock(0.08, 0.08, 0.08, 0xf5d66b, 0.2, -0.12, 0.02));
    this.accessoryGroup.add(this.companionOrb);

    this.avatarGroup.add(this.bodyGroup);
    this.avatarGroup.add(this.headGroup);
    this.avatarGroup.add(this.accessoryGroup);

    this.updateAvatar(this.avatar);
    this.scene.add(this.avatarGroup);
  }

  updateAvatar(avatar) {
    this.avatar = avatar;
    const world = percentToWorld(avatar);
    this.targetWorld = world;
    this.displayWorld = { ...world };
    this.displayY = 0.1;
    this.targetRotationY = getFacingRotation(avatar.facing);
    this.avatarGroup.position.set(world.x, this.displayY, world.z);
    this.avatarGroup.rotation.y = this.targetRotationY;
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / Math.max(height, 1);
    const frustum = 9.2;
    this.camera.left = (-frustum * aspect) / 2;
    this.camera.right = (frustum * aspect) / 2;
    this.camera.top = frustum / 2;
    this.camera.bottom = -frustum / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    const dx = this.targetWorld.x - this.displayWorld.x;
    const dz = this.targetWorld.z - this.displayWorld.z;
    const travelDistance = Math.hypot(dx, dz);
    const isGliding = travelDistance > AVATAR_MOTION.snapDistance;
    const motionActive = this.avatar.moving || isGliding;
    const pose = this.avatarPose ?? {
      bodyY: 0,
      headY: 0,
      accessoryY: 0,
      companionY: 1.42,
      leftLegY: 0.24,
      rightLegY: 0.24,
      leftArmY: 0.73,
      rightArmY: 0.73,
    };

    if (isGliding) {
      this.displayWorld.x = dampValue(this.displayWorld.x, this.targetWorld.x, AVATAR_MOTION.followStrength, delta);
      this.displayWorld.z = dampValue(this.displayWorld.z, this.targetWorld.z, AVATAR_MOTION.followStrength, delta);
    } else {
      this.displayWorld = { ...this.targetWorld };
    }

    const turnDelta = shortestAngleDelta(this.avatarGroup.rotation.y, this.targetRotationY);
    this.avatarGroup.rotation.y += turnDelta * (1 - Math.exp(-AVATAR_MOTION.turnStrength * delta));

    if (motionActive) {
      const stride = Math.sin(time * AVATAR_MOTION.walkBobSpeed);
      const sway = Math.sin(time * AVATAR_MOTION.walkBobSpeed * 0.5);
      const lift = Math.abs(stride) * AVATAR_MOTION.walkBobHeight;
      this.displayY = dampValue(this.displayY, 0.12 + lift, 18, delta);
      this.bodyGroup.position.y = pose.bodyY + lift * 0.18;
      this.bodyGroup.rotation.z = sway * AVATAR_MOTION.bodySway;
      this.headGroup.position.y = pose.headY + lift * 0.42;
      this.headGroup.rotation.z = -sway * AVATAR_MOTION.headSway;
      this.accessoryGroup.position.y = pose.accessoryY + lift * 0.25;
      this.accessoryGroup.rotation.z = sway * AVATAR_MOTION.accessorySway;
      this.companionOrb.position.y = pose.companionY + Math.sin(time * 4.2) * 0.09 + lift * 0.35;
      this.leftLeg.position.y = pose.leftLegY + stride * 0.07;
      this.rightLeg.position.y = pose.rightLegY - stride * 0.07;
      this.leftArm.position.y = pose.leftArmY - stride * 0.06;
      this.rightArm.position.y = pose.rightArmY + stride * 0.06;
      this.leftArm.rotation.z = 0.08 + stride * 0.08;
      this.rightArm.rotation.z = -0.08 - stride * 0.08;
    } else {
      const idleY = 0.1 + Math.sin(time * 2.4) * 0.012;
      this.displayY = dampValue(this.displayY, idleY, 10, delta);
      this.bodyGroup.position.y = dampValue(this.bodyGroup.position.y, pose.bodyY, 12, delta);
      this.bodyGroup.rotation.z = dampValue(this.bodyGroup.rotation.z, 0, 10, delta);
      this.headGroup.position.y = dampValue(this.headGroup.position.y, pose.headY + Math.sin(time * 2.1) * 0.01, 10, delta);
      this.headGroup.rotation.z = dampValue(this.headGroup.rotation.z, 0, 10, delta);
      this.accessoryGroup.position.y = dampValue(this.accessoryGroup.position.y, pose.accessoryY, 12, delta);
      this.accessoryGroup.rotation.z = dampValue(this.accessoryGroup.rotation.z, 0, 10, delta);
      this.companionOrb.position.y = pose.companionY + Math.sin(time * 2.8) * 0.07;
      this.leftLeg.position.y = dampValue(this.leftLeg.position.y, pose.leftLegY, 12, delta);
      this.rightLeg.position.y = dampValue(this.rightLeg.position.y, pose.rightLegY, 12, delta);
      this.leftArm.position.y = dampValue(this.leftArm.position.y, pose.leftArmY, 12, delta);
      this.rightArm.position.y = dampValue(this.rightArm.position.y, pose.rightArmY, 12, delta);
      this.leftArm.rotation.z = dampValue(this.leftArm.rotation.z, 0, 10, delta);
      this.rightArm.rotation.z = dampValue(this.rightArm.rotation.z, 0, 10, delta);
    }
    this.avatarGroup.position.set(this.displayWorld.x, this.displayY, this.displayWorld.z);

    for (const entry of this.animatedObjects) {
      const { object, type, phase } = entry;
      const wave = Math.sin(time * 3 + phase);

      if (type === "flame") {
        object.scale.y = entry.baseScale.y * (0.92 + Math.sin(time * 9 + phase) * 0.16);
        object.position.y = entry.baseY + Math.abs(Math.sin(time * 10 + phase)) * 0.05;
      } else if (type === "bubble") {
        const lift = ((time * 0.7 + phase) % 1) * 0.38;
        object.position.y = entry.baseY + lift;
        const scale = 0.75 + lift;
        object.scale.setScalar(scale);
      } else if (type === "sway") {
        object.rotation.z = entry.baseRotationZ + wave * 0.08;
      } else if (type === "wave") {
        object.rotation.z = entry.baseRotationZ + Math.sin(time * 5 + phase) * 0.18;
      } else if (type === "sparkle") {
        const scale = 0.82 + Math.abs(wave) * 0.28;
        object.scale.set(entry.baseScale.x * scale, entry.baseScale.y * scale, entry.baseScale.z * scale);
      } else if (type === "water") {
        object.scale.x = entry.baseScale.x * (1 + Math.sin(time * 2.2 + phase) * 0.03);
        object.scale.z = entry.baseScale.z * (1 + Math.cos(time * 2.4 + phase) * 0.03);
      } else if (type === "firefly") {
        object.position.y = entry.baseY + Math.sin(time * 2.8 + phase) * 0.18;
        object.position.x = entry.baseX + Math.cos(time * 1.5 + phase) * 0.12;
      } else if (type === "glow") {
        const scale = 1 + Math.sin(time * 4 + phase) * 0.08;
        object.scale.set(entry.baseScale.x * scale, entry.baseScale.y, entry.baseScale.z * scale);
      } else if (type === "pulse") {
        const scale = 1 + Math.sin(time * 3.4 + phase) * 0.1;
        object.scale.set(entry.baseScale.x * scale, entry.baseScale.y * scale, entry.baseScale.z * scale);
      } else if (type === "spin") {
        object.rotation.x = entry.baseRotationX + time * 8;
      } else if (type === "bob") {
        object.position.y = entry.baseY + Math.sin(time * 2.2 + phase) * 0.07;
      } else if (type === "drift") {
        object.position.x = entry.baseX + Math.sin(time * 0.8 + phase) * 0.18;
        object.position.z = entry.baseZ + Math.cos(time * 0.7 + phase) * 0.08;
      }
    }

    for (const [id, group] of this.hotspotGroups) {
      if (id === this.nearestId) {
        group.position.y = 0.08 + Math.sin(time * 5) * 0.03;
      }
    }

    this.renderer.render(this.scene, this.camera);
    if (shouldWriteDiagnostics(time, this.lastDiagnosticAt, 2)) this.lastDiagnosticAt = time;
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  writeDiagnostics() {
    window.__alchemy3dDiagnostics = {
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
      sampledColorCount: 0,
      sampledColors: [],
      pixelError: "",
      avatar: { ...this.avatar },
      sceneId: this.sceneConfig.id,
      animatedObjectCount: this.animatedObjects.length,
    };
    this.container.dataset.threeWidth = String(this.renderer.domElement.width);
    this.container.dataset.threeHeight = String(this.renderer.domElement.height);
    this.container.dataset.threeAvatarX = String(this.avatar.x);
    this.container.dataset.threeAvatarY = String(this.avatar.y);
    this.container.dataset.threeAvatarFacing = this.avatar.facing;
    this.container.dataset.threeAvatarMoving = String(this.avatar.moving);
    this.container.dataset.threeSceneId = this.sceneConfig.id;
    this.container.dataset.threeAnimatedObjectCount = String(this.animatedObjects.length);

    try {
      const gl = this.renderer.getContext();
      const width = this.renderer.domElement.width;
      const height = this.renderer.domElement.height;
      if (!gl || width < 4 || height < 4) return;

      const pixels = new Uint8Array(4 * 16);
      gl.readPixels(Math.floor(width / 2) - 2, Math.floor(height / 2) - 2, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const colors = new Set();
      for (let index = 0; index < pixels.length; index += 4) {
        colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${pixels[index + 3]}`);
      }
      window.__alchemy3dDiagnostics.sampledColorCount = colors.size;
      window.__alchemy3dDiagnostics.sampledColors = [...colors].slice(0, 8);
      this.container.dataset.threeSampledColorCount = String(colors.size);
      this.container.dataset.threeSampledColors = [...colors].slice(0, 8).join("|");
    } catch (error) {
      window.__alchemy3dDiagnostics.pixelError = error.message;
      this.container.dataset.threePixelError = error.message;
    }
  }

  addHotspotModel(group, hotspot) {
    if (hotspot.adventureEvent) {
      this.addAdventureEventMarker(group);
      return;
    }

    if (hotspot.npc) {
      this.addNpc(group, hotspot.npc);
      return;
    }

    if (hotspot.exitTo) {
      if (hotspot.id.includes("lift") || hotspot.id.includes("dock")) this.addLift(group);
      else if (hotspot.id.includes("rail")) this.addRailCart(group);
      else this.addPortalGate(group);
      return;
    }

    if (hotspot.id === "furnace") this.addFurnace(group);
    else if (hotspot.id === "distiller") this.addDistiller(group);
    else if (hotspot.id === "adventure_map") this.addAdventureMap(group);
    else if (hotspot.id === "codex_shelf") this.addBookcase(group);
    else if (hotspot.id === "task_board") this.addTaskBoard(group);
    else if (hotspot.id === "item_chest" || hotspot.id === "supply_chest") this.addChest(group);
    else if (hotspot.id === "herb_patch" || hotspot.id === "wind_garden") this.addHerbPatch(group);
    else if (hotspot.id === "mine_crate") this.addMineCrate(group);
    else if (hotspot.id === "spring_pool") this.addSpringPool(group);
    else if (hotspot.id === "berry_bush") this.addBerryBush(group);
    else if (hotspot.id === "forest_gate") this.addForestGate(group);
    else if (hotspot.id === "crystal_vein" || hotspot.id === "cloud_silk_pod") this.addCrystalVein(group);
    else if (hotspot.id === "charcoal_pit") this.addCharcoalPit(group);
    else if (hotspot.id === "ruin_gate") this.addRuinGate(group);
    else if (hotspot.id === "airship_frame") this.addAirshipFrame(group);
    else this.addChest(group);
  }

  addNpc(group, npc) {
    const palette = npcPalette(npc.palette);
    const root = new THREE.Group();

    root.add(positionedBlock(0.82, 0.04, 0.62, 0x26382f, 0, 0.04, 0));
    root.add(positionedBlock(0.42, 0.68, 0.32, palette.coat, 0, 0.62, 0));
    root.add(positionedBlock(0.16, 0.66, 0.34, palette.coatDark, 0.2, 0.62, 0.01));
    root.add(positionedBlock(0.52, 0.1, 0.36, palette.accent, 0, 0.42, -0.01));
    root.add(positionedBlock(0.5, 0.08, 0.36, 0x2a211b, 0, 0.78, -0.01));
    root.add(positionedBlock(0.46, 0.42, 0.42, palette.skin, 0, 1.2, -0.02));
    root.add(positionedBlock(0.5, 0.14, 0.46, palette.hair, 0, 1.45, -0.02));
    root.add(positionedBlock(0.14, 0.42, 0.16, palette.skin, -0.34, 0.62, 0));
    const wavingArm = positionedBlock(0.14, 0.42, 0.16, palette.skin, 0.34, 0.72, 0);
    root.add(wavingArm);
    root.add(positionedBlock(0.16, 0.42, 0.18, 0x3a332f, -0.13, 0.2, 0));
    root.add(positionedBlock(0.16, 0.42, 0.18, 0x3a332f, 0.13, 0.2, 0));
    root.add(positionedBlock(0.08, 0.08, 0.08, 0x1c1a17, -0.11, 1.24, -0.25));
    root.add(positionedBlock(0.08, 0.08, 0.08, 0x1c1a17, 0.11, 1.24, -0.25));
    root.add(positionedBlock(0.14, 0.04, 0.05, 0x7a3f31, 0, 1.1, -0.25));

    if (npc.palette === "miner") {
      root.add(positionedBlock(0.58, 0.18, 0.5, 0xd9b95a, 0, 1.56, -0.02));
      root.add(positionedBlock(0.16, 0.1, 0.08, 0xfff2a0, 0, 1.56, -0.28));
      const pickHandle = positionedBlock(0.08, 0.78, 0.08, 0x6b4b2e, -0.48, 0.84, -0.04);
      pickHandle.rotation.z = 0.55;
      root.add(pickHandle);
      const pickHead = positionedBlock(0.54, 0.1, 0.12, 0x9aa6aa, -0.54, 1.16, -0.08);
      pickHead.rotation.z = 0.55;
      root.add(pickHead);
      root.add(positionedBlock(0.18, 0.18, 0.12, 0x8be4ff, 0.32, 0.92, -0.22));
    } else if (npc.palette === "pilot") {
      root.add(positionedBlock(0.56, 0.18, 0.5, 0x5b6970, 0, 1.56, -0.02));
      root.add(positionedBlock(0.5, 0.08, 0.12, 0xd9fff2, 0, 1.38, -0.28));
      root.add(positionedBlock(0.62, 0.08, 0.1, 0x26382f, 0, 1.31, -0.28));
      root.add(positionedBlock(0.14, 0.12, 0.08, 0xd9fff2, -0.12, 1.31, -0.33));
      root.add(positionedBlock(0.14, 0.12, 0.08, 0xd9fff2, 0.12, 1.31, -0.33));
      const propeller = positionedBlock(0.1, 0.58, 0.08, 0xf5d66b, 0.48, 0.96, -0.12);
      propeller.rotation.z = Math.PI / 2;
      root.add(propeller);
      this.trackAnimation(propeller, "spin", 0.1);
    } else if (npc.palette === "forager") {
      root.add(positionedBlock(0.58, 0.16, 0.5, 0x7aa454, 0, 1.54, -0.02));
      root.add(positionedBlock(0.28, 0.24, 0.2, 0x8a5a21, -0.44, 0.72, -0.08));
      root.add(positionedBlock(0.12, 0.16, 0.12, 0xc84b4b, -0.5, 0.92, -0.18));
      root.add(positionedBlock(0.1, 0.18, 0.1, 0xffd36b, -0.36, 0.94, -0.16));
      const leaf = positionedBlock(0.16, 0.34, 0.12, 0x75b86f, 0.42, 1.0, -0.18);
      leaf.rotation.z = -0.35;
      root.add(leaf);
    } else {
      root.add(positionedBlock(0.56, 0.18, 0.5, 0x8b5db2, 0, 1.55, -0.02));
      root.add(positionedBlock(0.28, 0.32, 0.08, 0xfff7dd, -0.42, 0.92, -0.16));
      root.add(positionedBlock(0.22, 0.04, 0.1, 0xd8a946, -0.42, 1.02, -0.22));
      const crystal = positionedBlock(0.16, 0.16, 0.16, 0x8be4ff, 0.42, 1.08, -0.16);
      root.add(crystal);
      this.trackAnimation(crystal, "sparkle", 0.4);
    }

    root.add(positionedBlock(0.16, 0.16, 0.08, palette.accent, 0, 0.78, -0.2));
    group.add(root);
    this.trackAnimation(root, "bob", 0.3);
    this.trackAnimation(wavingArm, "wave", 0);

    const marker = positionedBlock(0.26, 0.26, 0.12, 0xfff3a2, 0.38, 1.9, -0.12);
    group.add(marker);
    this.trackAnimation(marker, "pulse", 0.4);
  }

  addWindow(x, z) {
    const frame = block(1.6, 1.05, 0.16, 0x4e3324);
    frame.position.set(x, 2.45, z);
    this.scene.add(frame);
    const glass = block(1.28, 0.76, 0.18, 0x8fc8df);
    glass.position.set(x, 2.45, z - 0.03);
    this.scene.add(glass);
    const crossX = block(1.28, 0.08, 0.2, 0x4e3324);
    crossX.position.set(x, 2.45, z - 0.08);
    this.scene.add(crossX);
    const crossY = block(0.08, 0.76, 0.2, 0x4e3324);
    crossY.position.set(x, 2.45, z - 0.08);
    this.scene.add(crossY);
  }

  addShelf(x, z) {
    const shelf = block(1.7, 0.68, 0.34, 0x8a5b36);
    shelf.position.set(x, 2.2, z);
    this.scene.add(shelf);
    [-0.55, -0.25, 0.08].forEach((offset, index) => {
      const colors = [0xa9433b, 0xe0a742, 0x3c7a65];
      const book = block(0.22, 0.62 - index * 0.08, 0.4, colors[index]);
      book.position.set(x + offset, 2.18, z - 0.22);
      this.scene.add(book);
    });
  }

  addRug() {
    const rug = block(3.5, 0.04, 1.25, 0xa93f45);
    rug.position.set(0, 0.08, 2.2);
    rug.rotation.y = -0.08;
    this.scene.add(rug);
    const stripe = block(3.1, 0.05, 0.16, 0xe0b65f);
    stripe.position.set(0, 0.12, 2.2);
    stripe.rotation.y = -0.08;
    this.scene.add(stripe);
  }

  addDoor(x, z) {
    const door = block(1.25, 1.55, 0.26, 0x6f4528);
    door.position.set(x, 0.86, z);
    this.scene.add(door);
    this.scene.add(positionedBlock(0.18, 0.18, 0.32, 0xe0b65f, x + 0.42, 0.85, z - 0.12));
  }

  addRiver() {
    const water = this.addAnimatedBlock(2.0, 0.06, 7.5, 0x5bb8c7, 4.2, 0.1, 0.1, "water", 0);
    water.rotation.y = -0.18;
    const bridge = block(1.35, 0.18, 1.15, 0x8a5b36);
    bridge.position.set(3.7, 0.24, 1.7);
    bridge.rotation.y = -0.18;
    this.scene.add(bridge);
  }

  addTree(x, z) {
    this.scene.add(positionedBlock(0.42, 1.15, 0.42, 0x7c5434, x, 0.58, z));
    const crown = this.addAnimatedBlock(1.25, 0.78, 1.05, 0x3e7d4b, x, 1.36, z, "sway", x + z);
    crown.rotation.z = 0.02;
    this.scene.add(positionedBlock(0.82, 0.58, 0.82, 0x4d9a5e, x - 0.38, 1.08, z + 0.25));
  }

  addFlowerCluster(x, z) {
    const colors = [0xf5d66b, 0xf58a9f, 0x7ed9a2];
    colors.forEach((color, index) => {
      this.addAnimatedBlock(0.16, 0.26, 0.16, color, x + index * 0.22, 0.2, z + (index % 2) * 0.18, "sway", index);
    });
  }

  addMineRail() {
    [-0.42, 0.42].forEach((offset) => {
      const rail = block(9.2, 0.08, 0.08, 0x242522);
      rail.position.set(0.8, 0.12, 2.95 + offset);
      rail.rotation.y = -0.08;
      this.scene.add(rail);
    });
    for (let x = -3.6; x <= 5.2; x += 1.0) {
      const sleeper = block(0.16, 0.08, 1.24, 0x745037);
      sleeper.position.set(x, 0.14, 2.95);
      sleeper.rotation.y = -0.08;
      this.scene.add(sleeper);
    }
  }

  addCloud(x, z, phase) {
    const group = new THREE.Group();
    group.position.set(x, 0.08, z);
    group.add(positionedBlock(1.35, 0.2, 0.62, 0xe8f1ef, 0, 0.1, 0));
    group.add(positionedBlock(0.72, 0.32, 0.62, 0xf6fbfa, -0.38, 0.26, 0));
    group.add(positionedBlock(0.82, 0.38, 0.68, 0xd9e9e7, 0.38, 0.3, 0.02));
    this.scene.add(group);
    this.trackAnimation(group, "drift", phase);
  }

  addAirshipSilhouette(x, z) {
    const hull = this.addAnimatedBlock(2.25, 0.45, 0.72, 0x9b7050, x, 1.2, z, "bob", 0.4);
    hull.rotation.y = -0.2;
    const balloon = this.addAnimatedBlock(2.8, 0.7, 0.95, 0xe6d28d, x, 2.0, z, "bob", 1.0);
    balloon.rotation.y = -0.2;
    const propeller = this.addAnimatedBlock(0.16, 0.9, 0.12, 0x5b6870, x + 1.55, 1.22, z - 0.18, "spin", 0);
    propeller.rotation.z = Math.PI / 2;
  }

  addSpringPool(group) {
    group.add(positionedBlock(1.35, 0.18, 1.0, 0x477a65, 0, 0.09, 0));
    const water = positionedBlock(1.02, 0.08, 0.72, 0x65c9d0, 0, 0.24, 0);
    group.add(water);
    this.trackAnimation(water, "water", 0.5);
  }

  addBerryBush(group) {
    group.add(positionedBlock(1.1, 0.58, 0.88, 0x3f7d4d, 0, 0.38, 0));
    [-0.28, 0.06, 0.28].forEach((x, index) => {
      const berry = positionedBlock(0.16, 0.16, 0.16, 0xc84b4b, x, 0.7, -0.15 + index * 0.12);
      group.add(berry);
      this.trackAnimation(berry, "bob", index * 0.6);
    });
  }

  addForestGate(group) {
    group.add(positionedBlock(0.28, 1.2, 0.28, 0x5b3d2b, -0.45, 0.6, 0));
    group.add(positionedBlock(0.28, 1.2, 0.28, 0x5b3d2b, 0.45, 0.6, 0));
    group.add(positionedBlock(1.18, 0.24, 0.28, 0x5b3d2b, 0, 1.2, 0));
    const mist = positionedBlock(0.9, 0.58, 0.16, 0xc8ddd7, 0, 0.64, -0.1);
    group.add(mist);
    this.trackAnimation(mist, "pulse", 0.2);
  }

  addCrystalVein(group) {
    group.add(positionedBlock(1.05, 0.26, 0.8, 0x3c3f3e, 0, 0.13, 0));
    [-0.25, 0.08, 0.34].forEach((x, index) => {
      const crystal = positionedBlock(0.22, 0.62 + index * 0.16, 0.24, index === 1 ? 0x84d8ff : 0x62a7c8, x, 0.48, -0.04);
      crystal.rotation.z = (index - 1) * 0.2;
      group.add(crystal);
      this.trackAnimation(crystal, "sparkle", index * 0.5);
    });
  }

  addCharcoalPit(group) {
    group.add(positionedBlock(1.05, 0.22, 0.78, 0x2b2523, 0, 0.11, 0));
    const ember = positionedBlock(0.6, 0.1, 0.42, 0xe45d32, 0, 0.25, 0);
    group.add(ember);
    this.trackAnimation(ember, "glow", 0);
  }

  addRuinGate(group) {
    group.add(positionedBlock(0.32, 1.15, 0.34, 0x59666c, -0.48, 0.58, 0));
    group.add(positionedBlock(0.32, 1.15, 0.34, 0x59666c, 0.48, 0.58, 0));
    group.add(positionedBlock(1.25, 0.28, 0.36, 0x465158, 0, 1.14, 0));
    const eye = positionedBlock(0.26, 0.2, 0.12, 0x8be4ff, 0, 0.75, -0.18);
    group.add(eye);
    this.trackAnimation(eye, "pulse", 0.3);
  }

  addAirshipFrame(group) {
    group.add(positionedBlock(1.35, 0.28, 0.7, 0x8b694a, 0, 0.34, 0));
    group.add(positionedBlock(1.0, 0.08, 0.88, 0x4e5960, 0, 0.58, 0));
    const propeller = positionedBlock(0.14, 0.8, 0.12, 0x4e5960, 0.78, 0.62, -0.08);
    group.add(propeller);
    this.trackAnimation(propeller, "spin", 0);
  }

  addPortalGate(group) {
    group.add(positionedBlock(0.24, 1.0, 0.24, 0x6f5236, -0.5, 0.5, 0));
    group.add(positionedBlock(0.24, 1.0, 0.24, 0x6f5236, 0.5, 0.5, 0));
    group.add(positionedBlock(1.2, 0.24, 0.26, 0x8a6039, 0, 1.0, 0));
    const glow = positionedBlock(0.72, 0.72, 0.08, 0x8fe6d1, 0, 0.55, -0.12);
    group.add(glow);
    this.trackAnimation(glow, "pulse", 0);
  }

  addLift(group) {
    group.add(positionedBlock(1.2, 0.18, 1.0, 0x667782, 0, 0.09, 0));
    group.add(positionedBlock(0.18, 1.0, 0.18, 0x4b5960, -0.48, 0.58, -0.34));
    group.add(positionedBlock(0.18, 1.0, 0.18, 0x4b5960, 0.48, 0.58, -0.34));
    const light = positionedBlock(0.72, 0.08, 0.72, 0x8fe6d1, 0, 0.24, 0);
    group.add(light);
    this.trackAnimation(light, "pulse", 0.4);
  }

  addRailCart(group) {
    group.add(positionedBlock(1.05, 0.45, 0.75, 0x7a5131, 0, 0.35, 0));
    group.add(positionedBlock(1.15, 0.12, 0.85, 0x4d3d35, 0, 0.14, 0));
    [-0.36, 0.36].forEach((x) => {
      group.add(positionedBlock(0.2, 0.2, 0.2, 0x252525, x, 0.08, -0.36));
      group.add(positionedBlock(0.2, 0.2, 0.2, 0x252525, x, 0.08, 0.36));
    });
  }

  addFurnace(group) {
    const base = block(1.05, 0.72, 0.86, 0x4a342b);
    base.position.y = 0.36;
    group.add(base);
    const bowl = block(0.78, 0.42, 0.66, 0x242e2b);
    bowl.position.set(0, 0.74, -0.03);
    group.add(bowl);
    const flame = block(0.35, 0.42, 0.2, 0xff8f2c);
    flame.name = "flame";
    flame.position.set(0, 0.92, -0.36);
    group.add(flame);
    this.trackAnimation(flame, "flame", 0);
  }

  addDistiller(group) {
    group.add(positionedBlock(1.1, 0.36, 0.58, 0x6f5236, 0, 0.18, 0));
    group.add(positionedBlock(0.24, 0.7, 0.24, 0x65bdc5, -0.28, 0.58, -0.08));
    group.add(positionedBlock(0.24, 0.52, 0.24, 0x58a4b0, 0.28, 0.48, 0.08));
    group.add(positionedBlock(0.9, 0.1, 0.12, 0x355a5d, 0, 0.92, 0));
    [-0.28, 0.28].forEach((x, index) => {
      const bubble = positionedBlock(0.12, 0.12, 0.12, 0xd9fff2, x, 0.74 + index * 0.08, -0.18);
      group.add(bubble);
      this.trackAnimation(bubble, "bubble", index * 0.7);
    });
  }

  addBookcase(group) {
    group.add(positionedBlock(1.1, 0.95, 0.42, 0x7a5131, 0, 0.48, 0));
    [-0.32, -0.05, 0.22].forEach((x, index) => {
      const colors = [0x8f4d69, 0x3f7d66, 0xd0a13b];
      group.add(positionedBlock(0.2, 0.7 - index * 0.08, 0.48, colors[index], x, 0.58, -0.05));
    });
  }

  addTaskBoard(group) {
    group.add(positionedBlock(0.95, 0.78, 0.18, 0x835735, 0, 0.78, 0));
    group.add(positionedBlock(0.72, 0.52, 0.2, 0xf1d49d, 0, 0.8, -0.03));
    group.add(positionedBlock(0.42, 0.06, 0.22, 0x71563d, 0, 0.9, -0.16));
    group.add(positionedBlock(0.28, 0.06, 0.22, 0x71563d, -0.06, 0.74, -0.16));
  }

  addAdventureMap(group) {
    group.add(positionedBlock(1.16, 0.42, 0.78, 0x7a5131, 0, 0.21, 0));
    group.add(positionedBlock(0.94, 0.08, 0.6, 0xf1d49d, 0, 0.46, 0));
    group.add(positionedBlock(0.42, 0.06, 0.08, 0x4f8b4a, -0.16, 0.52, -0.1));
    group.add(positionedBlock(0.26, 0.06, 0.08, 0x5bb8c7, 0.22, 0.52, 0.08));
    const pin = positionedBlock(0.12, 0.44, 0.12, 0xd65d4f, 0.36, 0.72, -0.12);
    group.add(pin);
    this.trackAnimation(pin, "pulse", 0.2);
  }

  addAdventureEventMarker(group) {
    group.add(positionedBlock(1.0, 0.08, 0.82, 0x5a3d2d, 0, 0.04, 0));

    const marker = new THREE.Group();
    marker.add(positionedBlock(0.58, 0.62, 0.18, 0xffd95f, 0, 1.02, -0.05));
    marker.add(positionedBlock(0.74, 0.14, 0.24, 0x2f382f, 0, 1.4, -0.05));
    marker.add(positionedBlock(0.16, 0.34, 0.2, 0x2f382f, 0, 1.08, -0.18));
    marker.add(positionedBlock(0.16, 0.12, 0.2, 0x2f382f, 0, 0.78, -0.18));
    marker.add(positionedBlock(0.16, 0.8, 0.16, 0x725032, 0, 0.46, 0));
    marker.add(positionedBlock(0.58, 0.12, 0.34, 0x725032, 0, 0.16, 0));
    group.add(marker);
    this.trackAnimation(marker, "bob", 0.15);

    const glow = positionedBlock(0.92, 0.05, 0.72, 0xffef9f, 0, 0.13, 0);
    group.add(glow);
    this.trackAnimation(glow, "pulse", 0.4);
  }

  addHerbPatch(group) {
    group.add(positionedBlock(1.0, 0.16, 0.8, 0x45632f, 0, 0.08, 0));
    [-0.28, 0, 0.28].forEach((x, index) => {
      const leaf = positionedBlock(0.18, 0.6 + index * 0.1, 0.16, index === 1 ? 0x67bd73 : 0x49a35e, x, 0.44, 0);
      leaf.rotation.z = (index - 1) * 0.28;
      group.add(leaf);
      this.trackAnimation(leaf, "sway", index * 0.5);
    });
  }

  addMineCrate(group) {
    group.add(positionedBlock(1.0, 0.52, 0.82, 0x8a6039, 0, 0.26, 0));
    [
      positionedBlock(0.28, 0.22, 0.25, 0x6d7a80, -0.28, 0.64, -0.1),
      positionedBlock(0.34, 0.3, 0.28, 0x819096, 0.05, 0.7, 0.02),
      positionedBlock(0.24, 0.2, 0.22, 0x59666c, 0.33, 0.62, -0.05),
    ].forEach((ore, index) => {
      group.add(ore);
      this.trackAnimation(ore, "sparkle", index * 0.45);
    });
  }

  addChest(group) {
    group.add(positionedBlock(0.9, 0.44, 0.62, 0x9b6237, 0, 0.22, 0));
    const lid = positionedBlock(0.98, 0.2, 0.68, 0x7a5131, 0, 0.58, 0);
    group.add(lid);
    group.add(positionedBlock(0.18, 0.28, 0.72, 0xe0b65f, 0, 0.36, -0.01));
    this.trackAnimation(lid, "bob", 1.1);
  }

  addAnimatedBlock(width, height, depth, color, x, y, z, type, phase = 0) {
    const mesh = positionedBlock(width, height, depth, color, x, y, z);
    this.scene.add(mesh);
    this.trackAnimation(mesh, type, phase);
    return mesh;
  }

  trackAnimation(object, type, phase = 0) {
    this.animatedObjects.push({
      object,
      type,
      phase,
      baseX: object.position.x,
      baseY: object.position.y,
      baseZ: object.position.z,
      baseRotationX: object.rotation.x,
      baseRotationY: object.rotation.y,
      baseRotationZ: object.rotation.z,
      baseScale: object.scale.clone(),
    });
  }
}

function block(width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function positionedBlock(width, height, depth, color, x, y, z) {
  const mesh = block(width, height, depth, color);
  mesh.position.set(x, y, z);
  return mesh;
}

export function getFacingRotation(facing) {
  return {
    up: 0,
    down: Math.PI,
    right: -Math.PI / 2,
    left: Math.PI / 2,
  }[facing] ?? 0;
}

function npcPalette(id) {
  const palettes = {
    mentor: {
      skin: 0xe0a16c,
      hair: 0x34251f,
      coat: 0x5f4aa0,
      coatDark: 0x41356e,
      accent: 0xf0c84b,
    },
    forager: {
      skin: 0xd99763,
      hair: 0x5d3b25,
      coat: 0x4f8b4a,
      coatDark: 0x376536,
      accent: 0xffd36b,
    },
    miner: {
      skin: 0xc98c5d,
      hair: 0x3c3027,
      coat: 0x7a5b3d,
      coatDark: 0x55402f,
      accent: 0x8be4ff,
    },
    pilot: {
      skin: 0xe4a875,
      hair: 0x2d2725,
      coat: 0x366f7f,
      coatDark: 0x254f5b,
      accent: 0xf5d66b,
    },
  };

  return palettes[id] ?? palettes.mentor;
}
