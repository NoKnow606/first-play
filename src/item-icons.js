const MATERIAL_ICON_BY_ID = {
  dew_herb: "herb",
  wood_branch: "wood",
  flint: "stone",
  copper_ore: "ore",
  iron_sand: "ore",
  wind_feather: "feather",
  beast_bone: "bone",
  rusted_gear: "gear",
  glow_moss: "herb",
  clear_spring: "water",
  red_berry: "berry",
  tough_hide: "hide",
  silver_ore: "ore",
  amber_resin: "resin",
  magnetic_stone: "stone",
  cloud_silk: "silk",
  oil_seed: "seed",
  clay: "clay",
  charcoal: "charcoal",
  thorn_vine: "vine",
  quartz_shard: "crystal",
  bat_wing: "wing",
  clockwork_spring: "gear",
  mist_flower: "flower",
  sun_seed: "seed",
  stone_shell: "shell",
  blue_crystal: "crystal",
  ember_core: "core",
  ancient_screw: "gear",
  life_spore: "spore",
  alchemy_residue: "junk",
};

const ELEMENT_TYPES = new Set(["fire", "water", "earth", "wind", "metal", "wood", "life", "mechanical"]);
const ITEM_TYPES = new Set(["potion", "weapon", "armor", "aircraft", "tool", "trinket", "catalyst", "junk"]);

export function getInventoryIcon(input) {
  const type = getInventoryIconType(input);
  return svg(type, drawIcon(type));
}

export function getInventoryIconType(input) {
  if (input.kind === "element") return ELEMENT_TYPES.has(input.id) ? input.id : "crystal";
  if (input.kind === "item") return ITEM_TYPES.has(input.category) ? input.category : "tool";
  return MATERIAL_ICON_BY_ID[input.id] ?? inferMaterialType(input.id);
}

function inferMaterialType(id = "") {
  if (id.includes("ore") || id.includes("sand")) return "ore";
  if (id.includes("gear") || id.includes("spring") || id.includes("screw")) return "gear";
  if (id.includes("berry")) return "berry";
  if (id.includes("crystal") || id.includes("quartz")) return "crystal";
  if (id.includes("wing") || id.includes("feather")) return "feather";
  if (id.includes("seed")) return "seed";
  if (id.includes("water") || id.includes("spring")) return "water";
  if (id.includes("bone")) return "bone";
  return "herb";
}

function svg(type, body) {
  return `<svg class="inventory-icon-svg icon-${type}" viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false" data-icon-type="${type}">${body}</svg>`;
}

function drawIcon(type) {
  const drawings = {
    herb: `<rect x="28" y="28" width="8" height="24" fill="#2f6f47"/><rect x="18" y="22" width="14" height="18" fill="#55a765"/><rect x="34" y="18" width="14" height="20" fill="#78c878"/><rect x="22" y="46" width="22" height="6" fill="#244c36"/>`,
    wood: `<rect x="16" y="20" width="34" height="12" fill="#8b5a35"/><rect x="12" y="34" width="34" height="12" fill="#6f4528"/><rect x="20" y="24" width="8" height="4" fill="#d19a5b"/><rect x="28" y="38" width="10" height="4" fill="#b77a43"/>`,
    stone: `<rect x="18" y="28" width="28" height="20" fill="#697277"/><rect x="24" y="20" width="22" height="16" fill="#879297"/><rect x="30" y="26" width="8" height="6" fill="#c4d0d2"/>`,
    ore: `<rect x="16" y="34" width="30" height="18" fill="#4f5960"/><rect x="24" y="22" width="22" height="22" fill="#79858a"/><rect x="32" y="28" width="8" height="8" fill="#d6edf0"/><rect x="20" y="40" width="8" height="6" fill="#b8c8c8"/>`,
    feather: `<rect x="30" y="14" width="6" height="38" fill="#5c7b86"/><rect x="18" y="18" width="16" height="10" fill="#a8dce8"/><rect x="16" y="30" width="18" height="10" fill="#76bed0"/><rect x="34" y="24" width="14" height="10" fill="#d9f4f6"/><rect x="34" y="38" width="10" height="8" fill="#8bc8d4"/>`,
    bone: `<rect x="18" y="28" width="28" height="8" fill="#ead9b9"/><rect x="12" y="20" width="12" height="12" fill="#f6e7c9"/><rect x="40" y="36" width="12" height="12" fill="#d8c39e"/><rect x="10" y="34" width="14" height="12" fill="#ead9b9"/><rect x="42" y="18" width="12" height="12" fill="#f6e7c9"/>`,
    gear: `<rect x="28" y="10" width="8" height="12" fill="#7b8589"/><rect x="28" y="42" width="8" height="12" fill="#5d696e"/><rect x="10" y="28" width="12" height="8" fill="#7b8589"/><rect x="42" y="28" width="12" height="8" fill="#5d696e"/><rect x="20" y="20" width="24" height="24" fill="#8e9aa0"/><rect x="28" y="28" width="8" height="8" fill="#2d3437"/>`,
    water: `<rect x="28" y="12" width="8" height="8" fill="#91d8e8"/><rect x="22" y="20" width="20" height="16" fill="#5fb7d0"/><rect x="18" y="34" width="28" height="16" fill="#348aa2"/><rect x="26" y="26" width="8" height="8" fill="#d9fbff"/>`,
    berry: `<rect x="24" y="24" width="18" height="18" fill="#c94d55"/><rect x="16" y="32" width="18" height="18" fill="#a93444"/><rect x="34" y="34" width="14" height="14" fill="#e0646a"/><rect x="28" y="14" width="12" height="8" fill="#4f8b4a"/><rect x="22" y="20" width="8" height="6" fill="#75b86f"/>`,
    hide: `<rect x="16" y="18" width="32" height="30" fill="#9a704e"/><rect x="10" y="26" width="12" height="14" fill="#76533c"/><rect x="42" y="24" width="12" height="18" fill="#b5855d"/><rect x="24" y="28" width="16" height="8" fill="#d6aa78"/>`,
    resin: `<rect x="24" y="14" width="18" height="12" fill="#e0b34f"/><rect x="18" y="26" width="28" height="24" fill="#b9742f"/><rect x="28" y="24" width="8" height="18" fill="#ffd36b"/>`,
    silk: `<rect x="16" y="20" width="34" height="8" fill="#e8f7f4"/><rect x="12" y="32" width="36" height="8" fill="#c9e7df"/><rect x="20" y="44" width="30" height="6" fill="#f6fffb"/><rect x="22" y="26" width="8" height="18" fill="#9fcfca"/>`,
    seed: `<rect x="24" y="18" width="18" height="28" fill="#d19a3d"/><rect x="30" y="12" width="10" height="10" fill="#f4cc5e"/><rect x="18" y="32" width="12" height="16" fill="#8b5a21"/><rect x="34" y="30" width="10" height="8" fill="#ffe58a"/>`,
    clay: `<rect x="16" y="36" width="34" height="14" fill="#a56d55"/><rect x="22" y="24" width="26" height="16" fill="#c48a68"/><rect x="28" y="18" width="14" height="10" fill="#d8a585"/>`,
    charcoal: `<rect x="16" y="28" width="34" height="18" fill="#282522"/><rect x="24" y="20" width="18" height="14" fill="#3a342d"/><rect x="28" y="32" width="10" height="6" fill="#e05d32"/><rect x="40" y="38" width="6" height="4" fill="#ffba5a"/>`,
    vine: `<rect x="30" y="14" width="6" height="40" fill="#3f7d4d"/><rect x="18" y="20" width="18" height="8" fill="#65a95f"/><rect x="30" y="34" width="18" height="8" fill="#4f8b4a"/><rect x="16" y="38" width="8" height="6" fill="#7e3640"/><rect x="44" y="24" width="8" height="6" fill="#7e3640"/>`,
    crystal: `<rect x="28" y="10" width="10" height="12" fill="#d9fbff"/><rect x="20" y="22" width="26" height="24" fill="#79c7df"/><rect x="26" y="46" width="14" height="8" fill="#3f93b0"/><rect x="32" y="24" width="8" height="18" fill="#b7eff5"/>`,
    wing: `<rect x="28" y="18" width="8" height="28" fill="#5c6a74"/><rect x="10" y="20" width="20" height="18" fill="#6aa4ba"/><rect x="34" y="22" width="20" height="16" fill="#8fc8d8"/><rect x="18" y="38" width="12" height="8" fill="#467a91"/><rect x="36" y="38" width="10" height="8" fill="#6aa4ba"/>`,
    flower: `<rect x="30" y="34" width="6" height="18" fill="#4f8b4a"/><rect x="20" y="20" width="12" height="12" fill="#d98cb4"/><rect x="34" y="18" width="12" height="12" fill="#f0a8c8"/><rect x="26" y="28" width="16" height="12" fill="#f5d66b"/>`,
    shell: `<rect x="16" y="30" width="34" height="18" fill="#8d8f84"/><rect x="22" y="20" width="22" height="16" fill="#b2b59e"/><rect x="28" y="26" width="6" height="18" fill="#d4d7be"/><rect x="38" y="28" width="6" height="14" fill="#717564"/>`,
    core: `<rect x="20" y="20" width="24" height="24" fill="#593a31"/><rect x="26" y="14" width="12" height="36" fill="#d85a32"/><rect x="18" y="28" width="28" height="10" fill="#ffb84f"/><rect x="30" y="26" width="6" height="10" fill="#fff083"/>`,
    spore: `<rect x="18" y="24" width="28" height="20" fill="#8ccf84"/><rect x="24" y="14" width="16" height="14" fill="#d9f0a3"/><rect x="28" y="42" width="8" height="10" fill="#5d8f56"/><rect x="24" y="30" width="6" height="6" fill="#f6ffca"/><rect x="36" y="28" width="5" height="5" fill="#f6ffca"/>`,
    junk: `<rect x="16" y="34" width="34" height="14" fill="#716b63"/><rect x="22" y="24" width="22" height="12" fill="#9b8a72"/><rect x="26" y="18" width="8" height="8" fill="#d1b46a"/><rect x="38" y="30" width="8" height="6" fill="#4f5960"/>`,
    fire: `<rect x="28" y="12" width="10" height="16" fill="#ffe16b"/><rect x="20" y="24" width="24" height="24" fill="#f28b38"/><rect x="26" y="34" width="14" height="16" fill="#cc4730"/>`,
    earth: `<rect x="14" y="36" width="36" height="14" fill="#8a6a45"/><rect x="22" y="24" width="24" height="16" fill="#b38b59"/><rect x="28" y="28" width="8" height="8" fill="#e0c07a"/>`,
    wind: `<rect x="12" y="20" width="34" height="6" fill="#b9f1e8"/><rect x="24" y="32" width="30" height="6" fill="#7ed8d0"/><rect x="16" y="44" width="24" height="6" fill="#57aaa8"/><rect x="46" y="26" width="6" height="6" fill="#e8fffb"/>`,
    metal: `<rect x="16" y="34" width="34" height="14" fill="#7b858a"/><rect x="22" y="24" width="24" height="14" fill="#aeb8bb"/><rect x="28" y="28" width="12" height="6" fill="#f1fbfb"/>`,
    life: `<rect x="28" y="14" width="8" height="36" fill="#5bbf68"/><rect x="16" y="28" width="32" height="8" fill="#5bbf68"/><rect x="22" y="20" width="20" height="22" fill="#9ee58f"/><rect x="30" y="26" width="6" height="8" fill="#fff7c8"/>`,
    mechanical: `<rect x="28" y="12" width="8" height="10" fill="#9aa6aa"/><rect x="28" y="42" width="8" height="10" fill="#7e898d"/><rect x="12" y="28" width="10" height="8" fill="#9aa6aa"/><rect x="42" y="28" width="10" height="8" fill="#7e898d"/><rect x="22" y="22" width="20" height="20" fill="#b2bdc0"/><rect x="29" y="29" width="6" height="6" fill="#263238"/>`,
    potion: `<rect x="26" y="12" width="12" height="10" fill="#d9fff6"/><rect x="22" y="22" width="20" height="6" fill="#5c7b86"/><rect x="18" y="28" width="28" height="24" fill="#58bfc7"/><rect x="24" y="34" width="16" height="12" fill="#b8fff4"/>`,
    weapon: `<rect x="30" y="10" width="8" height="34" fill="#dce9ea"/><rect x="26" y="18" width="16" height="18" fill="#aebec2"/><rect x="20" y="42" width="28" height="6" fill="#7a5131"/><rect x="28" y="48" width="12" height="8" fill="#4c3424"/>`,
    armor: `<rect x="18" y="16" width="28" height="10" fill="#8aa0a8"/><rect x="14" y="26" width="36" height="18" fill="#697f88"/><rect x="22" y="44" width="20" height="8" fill="#4d5d64"/><rect x="28" y="28" width="8" height="14" fill="#d9e4e5"/>`,
    aircraft: `<rect x="28" y="16" width="8" height="32" fill="#8a6a45"/><rect x="10" y="26" width="22" height="12" fill="#e8d28a"/><rect x="34" y="26" width="22" height="12" fill="#d9b86a"/><rect x="24" y="42" width="16" height="8" fill="#5d6970"/>`,
    tool: `<rect x="18" y="38" width="28" height="8" fill="#7a5131"/><rect x="34" y="18" width="10" height="24" fill="#9aa6aa"/><rect x="22" y="18" width="16" height="10" fill="#c6d1d2"/><rect x="18" y="24" width="10" height="10" fill="#8b9699"/>`,
    trinket: `<rect x="28" y="12" width="8" height="10" fill="#d8a946"/><rect x="20" y="22" width="24" height="24" fill="#6d4aa0"/><rect x="26" y="28" width="12" height="12" fill="#ffe58a"/><rect x="28" y="46" width="8" height="8" fill="#4b356f"/>`,
    catalyst: `<rect x="26" y="10" width="12" height="12" fill="#e8ffff"/><rect x="18" y="22" width="28" height="24" fill="#7ad6df"/><rect x="24" y="46" width="16" height="8" fill="#4b9ca9"/><rect x="30" y="24" width="8" height="18" fill="#fff3a2"/>`,
  };

  return drawings[type] ?? drawings.herb;
}
