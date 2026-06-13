import test from "node:test";
import assert from "node:assert/strict";

import { getUiIcon } from "../src/ui-icons.js";

test("core module UI icons render pixel SVG types", () => {
  for (const name of ["refine", "alchemy", "adventure", "battle", "codex", "tasks"]) {
    const icon = getUiIcon(name);

    assert.match(icon, /^<svg /);
    assert.match(icon, /class="ui-icon-svg/);
    assert.match(icon, new RegExp(`data-ui-icon-type="${name}"`));
  }
});

test("UI icon aliases normalize scene and action names", () => {
  assert.match(getUiIcon("scene_meadow"), /data-ui-icon-type="scene-meadow"/);
  assert.match(getUiIcon("scene_sky_dock"), /data-ui-icon-type="scene-sky"/);
  assert.match(getUiIcon("actionPoint"), /data-ui-icon-type="action-point"/);
});

test("battle and reward UI icons cover non-inventory modules", () => {
  for (const name of ["attack", "guard", "heal", "reward", "progress"]) {
    const icon = getUiIcon(name);

    assert.match(icon, /^<svg /);
    assert.match(icon, new RegExp(`data-ui-icon-type="${name}"`));
    assert.doesNotMatch(icon, /x="18" y="18" width="28" height="28" fill="#d8a946"/);
  }
});

test("pixel control icons replace text-only interface controls", () => {
  for (const name of ["reset", "close", "move-up", "move-down", "move-left", "move-right", "interact"]) {
    const icon = getUiIcon(name);

    assert.match(icon, /^<svg /);
    assert.match(icon, new RegExp(`data-ui-icon-type="${name}"`));
    assert.doesNotMatch(icon, /x="18" y="18" width="28" height="28" fill="#d8a946"/);
  }
});
