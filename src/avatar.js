export function clampPosition(position, bounds) {
  return {
    x: Math.max(0, Math.min(position.x, bounds.width)),
    y: Math.max(0, Math.min(position.y, bounds.height)),
  };
}

export const MOVEMENT_KEY_VECTORS = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export function getFrameMoveDistance(unitsPerSecond, elapsedMs, maxElapsedMs = 50) {
  const safeSpeed = Math.max(0, unitsPerSecond);
  const safeElapsed = Math.max(0, Math.min(elapsedMs, maxElapsedMs));
  return (safeSpeed * safeElapsed) / 1000;
}

export function getMovementVectorFromKeys(keys) {
  const vector = { x: 0, y: 0 };
  for (const key of keys) {
    const movement = MOVEMENT_KEY_VECTORS[key];
    if (!movement) continue;
    vector.x += movement.x;
    vector.y += movement.y;
  }
  return {
    x: Math.max(-1, Math.min(vector.x, 1)),
    y: Math.max(-1, Math.min(vector.y, 1)),
  };
}

export function moveAvatar(avatar, vector, speed, bounds, collisionZones = []) {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return {
      ...avatar,
      moving: false,
    };
  }

  const normalized = {
    x: vector.x / length,
    y: vector.y / length,
  };
  const position = clampPosition(
    {
      x: avatar.x + normalized.x * speed,
      y: avatar.y + normalized.y * speed,
    },
    bounds
  );
  const facing = getFacing(vector, avatar.facing);

  if (canOccupyPosition(position, avatar, collisionZones)) {
    return {
      ...position,
      facing,
      moving: true,
    };
  }

  const horizontal = clampPosition({ x: position.x, y: avatar.y }, bounds);
  const vertical = clampPosition({ x: avatar.x, y: position.y }, bounds);
  const slideCandidates =
    Math.abs(vector.x) >= Math.abs(vector.y) ? [horizontal, vertical] : [vertical, horizontal];
  const slide = slideCandidates.find(
    (candidate) =>
      (candidate.x !== avatar.x || candidate.y !== avatar.y) && canOccupyPosition(candidate, avatar, collisionZones)
  );

  if (slide) {
    return {
      ...slide,
      facing,
      moving: true,
    };
  }

  return {
    x: avatar.x,
    y: avatar.y,
    facing,
    moving: false,
  };
}

export function findNearestHotspot(position, hotspots) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const hotspot of hotspots) {
    const distance = Math.hypot(position.x - hotspot.x, position.y - hotspot.y);
    if (distance <= hotspot.radius && distance < nearestDistance) {
      nearest = hotspot;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function isPositionBlocked(position, collisionZones = []) {
  return collisionZones.some((zone) => distanceToZone(position, zone) < zone.radius);
}

function canOccupyPosition(position, previousPosition, collisionZones) {
  return !collisionZones.some((zone) => {
    const nextDistance = distanceToZone(position, zone);
    if (nextDistance >= zone.radius) return false;

    const previousDistance = distanceToZone(previousPosition, zone);
    return nextDistance <= previousDistance + 0.01;
  });
}

function distanceToZone(position, zone) {
  return Math.hypot(position.x - zone.x, position.y - zone.y);
}

function getFacing(vector, fallback) {
  if (Math.abs(vector.x) >= Math.abs(vector.y)) {
    return vector.x >= 0 ? "right" : "left";
  }
  return vector.y >= 0 ? "down" : "up";
}
