const ICON_ALIASES = {
  actionPoint: "action-point",
  scene_workshop: "scene-workshop",
  scene_meadow: "scene-meadow",
  scene_mine: "scene-mine",
  scene_sky_dock: "scene-sky",
  sky_dock: "scene-sky",
  defense: "guard",
  alchemyAction: "alchemy",
  action_attack: "attack",
  action_guard: "guard",
  action_alchemy: "alchemy",
};

export function getUiIcon(name = "unknown") {
  const type = normalizeIconName(name);
  return `<svg class="ui-icon-svg ui-icon-${type}" viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false" data-ui-icon-type="${type}">${drawUiIcon(type)}</svg>`;
}

function normalizeIconName(name) {
  const normalized = String(name).replaceAll("_", "-");
  return ICON_ALIASES[name] ?? ICON_ALIASES[normalized] ?? normalized;
}

function drawUiIcon(type) {
  const icons = {
    alchemist: `<rect x="20" y="30" width="24" height="22" fill="#245f56"/><rect x="24" y="18" width="16" height="14" fill="#d89262"/><rect x="18" y="12" width="28" height="8" fill="#d8a946"/><rect x="26" y="38" width="12" height="8" fill="#fff7dd"/>`,
    coin: `<rect x="16" y="18" width="34" height="30" fill="#d8a946"/><rect x="20" y="14" width="28" height="8" fill="#ffe58a"/><rect x="22" y="26" width="20" height="6" fill="#8a5a21"/><rect x="26" y="36" width="14" height="5" fill="#fff0a8"/>`,
    inspiration: `<rect x="28" y="10" width="8" height="12" fill="#fff0a8"/><rect x="20" y="22" width="24" height="22" fill="#d8a946"/><rect x="24" y="44" width="16" height="8" fill="#6a508d"/><rect x="30" y="28" width="6" height="10" fill="#fff7dd"/>`,
    recipe: `<rect x="16" y="12" width="34" height="42" fill="#fff7dd"/><rect x="20" y="16" width="6" height="34" fill="#d8a946"/><rect x="30" y="22" width="14" height="5" fill="#245f56"/><rect x="30" y="32" width="12" height="5" fill="#6a508d"/><rect x="30" y="42" width="16" height="5" fill="#8a5a21"/>`,
    "action-point": `<rect x="28" y="8" width="8" height="18" fill="#ffe58a"/><rect x="18" y="26" width="28" height="16" fill="#245f56"/><rect x="24" y="42" width="18" height="12" fill="#7ad6df"/><rect x="30" y="29" width="7" height="10" fill="#fff7dd"/>`,
    refine: `<rect x="24" y="10" width="16" height="10" fill="#d9fff6"/><rect x="18" y="20" width="28" height="8" fill="#26382f"/><rect x="16" y="28" width="32" height="24" fill="#7ad6df"/><rect x="24" y="34" width="16" height="12" fill="#fff7dd"/>`,
    alchemy: `<rect x="14" y="38" width="36" height="10" fill="#26382f"/><rect x="20" y="20" width="24" height="22" fill="#8a5a21"/><rect x="25" y="14" width="14" height="16" fill="#d8a946"/><rect x="24" y="28" width="16" height="8" fill="#ff7a4f"/>`,
    adventure: `<rect x="14" y="18" width="36" height="28" fill="#fff7dd"/><rect x="18" y="22" width="10" height="20" fill="#9fcbb1"/><rect x="32" y="22" width="14" height="20" fill="#d8a946"/><rect x="26" y="14" width="8" height="36" fill="#26382f"/>`,
    battle: `<rect x="18" y="14" width="8" height="34" fill="#dce9ea"/><rect x="14" y="40" width="18" height="8" fill="#8a5a21"/><rect x="38" y="16" width="8" height="32" fill="#d8a946"/><rect x="32" y="40" width="20" height="8" fill="#6a508d"/>`,
    bag: `<rect x="16" y="24" width="34" height="26" fill="#8a5a21"/><rect x="24" y="14" width="18" height="14" fill="#d8a946"/><rect x="22" y="32" width="20" height="8" fill="#fff7dd"/>`,
    codex: `<rect x="14" y="14" width="16" height="38" fill="#6a508d"/><rect x="32" y="14" width="18" height="38" fill="#245f56"/><rect x="18" y="22" width="8" height="5" fill="#fff7dd"/><rect x="36" y="22" width="10" height="5" fill="#fff7dd"/>`,
    tasks: `<rect x="16" y="12" width="34" height="42" fill="#fff7dd"/><rect x="22" y="20" width="8" height="8" fill="#245f56"/><rect x="34" y="22" width="10" height="4" fill="#26382f"/><rect x="22" y="34" width="8" height="8" fill="#d8a946"/><rect x="34" y="36" width="12" height="4" fill="#26382f"/>`,
    collect: `<rect x="18" y="30" width="28" height="18" fill="#8a5a21"/><rect x="24" y="18" width="16" height="16" fill="#55a765"/><rect x="34" y="14" width="14" height="18" fill="#78c878"/><rect x="14" y="40" width="36" height="8" fill="#6d4528"/>`,
    route: `<rect x="14" y="40" width="36" height="8" fill="#8a5a21"/><rect x="18" y="18" width="8" height="22" fill="#245f56"/><rect x="30" y="12" width="8" height="28" fill="#d8a946"/><rect x="42" y="22" width="8" height="18" fill="#6a508d"/>`,
    attack: `<rect x="30" y="10" width="8" height="34" fill="#dce9ea"/><rect x="38" y="18" width="8" height="8" fill="#fff7dd"/><rect x="22" y="42" width="24" height="8" fill="#8a5a21"/><rect x="26" y="50" width="16" height="6" fill="#26382f"/>`,
    guard: `<rect x="18" y="14" width="28" height="36" fill="#7ad6df"/><rect x="22" y="18" width="20" height="26" fill="#fff7dd"/><rect x="28" y="24" width="8" height="18" fill="#245f56"/><rect x="24" y="46" width="16" height="6" fill="#26382f"/>`,
    heal: `<rect x="28" y="12" width="8" height="40" fill="#55a765"/><rect x="16" y="28" width="32" height="8" fill="#55a765"/><rect x="22" y="22" width="20" height="20" fill="#fff7dd"/><rect x="28" y="28" width="8" height="8" fill="#55a765"/>`,
    reward: `<rect x="14" y="28" width="36" height="24" fill="#d8a946"/><rect x="18" y="22" width="28" height="10" fill="#ffe58a"/><rect x="28" y="18" width="8" height="34" fill="#a8503f"/><rect x="20" y="36" width="24" height="5" fill="#fff7dd"/>`,
    progress: `<rect x="12" y="24" width="40" height="16" fill="#fff7dd"/><rect x="16" y="28" width="28" height="8" fill="#245f56"/><rect x="14" y="42" width="8" height="8" fill="#d8a946"/><rect x="28" y="42" width="8" height="8" fill="#d8a946"/><rect x="42" y="42" width="8" height="8" fill="#d8a946"/>`,
    material: `<rect x="18" y="34" width="28" height="14" fill="#8a5a21"/><rect x="22" y="20" width="12" height="18" fill="#55a765"/><rect x="34" y="16" width="14" height="22" fill="#78c878"/><rect x="14" y="46" width="36" height="6" fill="#26382f"/>`,
    element: `<rect x="24" y="12" width="16" height="16" fill="#7ad6df"/><rect x="16" y="28" width="32" height="18" fill="#245f56"/><rect x="24" y="34" width="16" height="12" fill="#fff7dd"/><rect x="28" y="48" width="8" height="6" fill="#d8a946"/>`,
    item: `<rect x="16" y="18" width="32" height="34" fill="#fff7dd"/><rect x="20" y="22" width="24" height="8" fill="#d8a946"/><rect x="22" y="34" width="20" height="6" fill="#245f56"/><rect x="26" y="44" width="12" height="5" fill="#6a508d"/>`,
    mastery: `<rect x="14" y="40" width="36" height="8" fill="#26382f"/><rect x="18" y="28" width="8" height="12" fill="#d8a946"/><rect x="28" y="20" width="8" height="20" fill="#d8a946"/><rect x="38" y="12" width="8" height="28" fill="#d8a946"/><rect x="24" y="14" width="16" height="8" fill="#fff7dd"/>`,
    success: `<rect x="14" y="30" width="12" height="10" fill="#245f56"/><rect x="24" y="38" width="10" height="10" fill="#245f56"/><rect x="32" y="22" width="18" height="10" fill="#245f56"/>`,
    fail: `<rect x="16" y="16" width="10" height="10" fill="#a8503f"/><rect x="26" y="26" width="12" height="12" fill="#a8503f"/><rect x="38" y="38" width="10" height="10" fill="#a8503f"/><rect x="38" y="16" width="10" height="10" fill="#a8503f"/><rect x="16" y="38" width="10" height="10" fill="#a8503f"/>`,
    locked: `<rect x="18" y="28" width="30" height="22" fill="#6d6d65"/><rect x="24" y="16" width="18" height="18" fill="#a6aaa5"/><rect x="30" y="36" width="6" height="8" fill="#fff7dd"/>`,
    unknown: `<rect x="18" y="18" width="28" height="28" fill="#d8a946"/><rect x="26" y="24" width="12" height="8" fill="#26382f"/><rect x="30" y="34" width="6" height="6" fill="#26382f"/><rect x="30" y="44" width="6" height="6" fill="#26382f"/>`,
    life: `<rect x="28" y="12" width="8" height="38" fill="#55a765"/><rect x="16" y="28" width="32" height="8" fill="#55a765"/><rect x="24" y="20" width="16" height="18" fill="#9ee58f"/>`,
    weapon: `<rect x="30" y="10" width="8" height="34" fill="#dce9ea"/><rect x="22" y="40" width="24" height="8" fill="#8a5a21"/><rect x="28" y="48" width="12" height="8" fill="#26382f"/>`,
    mechanical: `<rect x="28" y="10" width="8" height="12" fill="#9aa6aa"/><rect x="28" y="42" width="8" height="12" fill="#7e898d"/><rect x="12" y="28" width="10" height="8" fill="#9aa6aa"/><rect x="42" y="28" width="10" height="8" fill="#7e898d"/><rect x="22" y="22" width="20" height="20" fill="#b2bdc0"/>`,
    "scene-workshop": `<rect x="14" y="28" width="36" height="22" fill="#8a5a21"/><rect x="22" y="14" width="20" height="16" fill="#d8a946"/><rect x="28" y="34" width="8" height="16" fill="#26382f"/>`,
    "scene-meadow": `<rect x="14" y="38" width="36" height="12" fill="#55a765"/><rect x="22" y="22" width="8" height="18" fill="#245f56"/><rect x="30" y="16" width="18" height="18" fill="#78c878"/>`,
    "scene-mine": `<rect x="14" y="36" width="36" height="14" fill="#5e6a70"/><rect x="22" y="22" width="22" height="18" fill="#87959b"/><rect x="30" y="28" width="8" height="8" fill="#d9fbff"/>`,
    "scene-sky": `<rect x="12" y="24" width="18" height="8" fill="#fff7dd"/><rect x="34" y="18" width="18" height="8" fill="#fff7dd"/><rect x="22" y="38" width="28" height="10" fill="#d8a946"/><rect x="30" y="28" width="8" height="20" fill="#8a5a21"/>`,
  };

  return icons[type] ?? icons.unknown;
}
