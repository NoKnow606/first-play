import test from "node:test";
import assert from "node:assert/strict";

import { getInventoryIcon } from "../src/item-icons.js";

test("material icons render recognizable SVG types", () => {
  const herb = getInventoryIcon({ kind: "material", id: "dew_herb" });
  const ore = getInventoryIcon({ kind: "material", id: "copper_ore" });

  assert.match(herb, /^<svg /);
  assert.match(herb, /data-icon-type="herb"/);
  assert.match(ore, /data-icon-type="ore"/);
});

test("element icons render elemental SVG glyphs", () => {
  const fire = getInventoryIcon({ kind: "element", id: "fire" });
  const mechanical = getInventoryIcon({ kind: "element", id: "mechanical" });

  assert.match(fire, /data-icon-type="fire"/);
  assert.match(mechanical, /data-icon-type="mechanical"/);
});

test("item category icons cover core RPG inventory slots", () => {
  const categories = ["potion", "weapon", "armor", "aircraft", "tool", "trinket", "catalyst", "junk"];

  for (const category of categories) {
    const icon = getInventoryIcon({ kind: "item", category });
    assert.match(icon, /^<svg /);
    assert.match(icon, new RegExp(`data-icon-type="${category}"`));
  }
});
