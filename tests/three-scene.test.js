import test from "node:test";
import assert from "node:assert/strict";

import { shouldWriteDiagnostics } from "../src/three-scene.js";

test("diagnostics are throttled instead of running every frame", () => {
  assert.equal(shouldWriteDiagnostics(1.1, 1.0), false);
  assert.equal(shouldWriteDiagnostics(1.4, 1.0), true);
});
