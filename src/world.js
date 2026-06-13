const WORLD_WIDTH = 12;
const WORLD_DEPTH = 8;

export function percentToWorld(position) {
  return {
    x: round((position.x / 100 - 0.5) * WORLD_WIDTH),
    z: round((position.y / 100 - 0.5) * WORLD_DEPTH),
  };
}

export function worldToPercent(position) {
  return {
    x: round((position.x / WORLD_WIDTH + 0.5) * 100),
    y: round((position.z / WORLD_DEPTH + 0.5) * 100),
  };
}

export function getWorldSize() {
  return {
    width: WORLD_WIDTH,
    depth: WORLD_DEPTH,
  };
}

function round(value) {
  return Number(value.toFixed(4));
}
