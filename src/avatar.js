export function clampPosition(position, bounds) {
  return {
    x: Math.max(0, Math.min(position.x, bounds.width)),
    y: Math.max(0, Math.min(position.y, bounds.height)),
  };
}

export function moveAvatar(avatar, vector, speed, bounds) {
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

  return {
    ...position,
    facing: getFacing(vector, avatar.facing),
    moving: true,
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

function getFacing(vector, fallback) {
  if (Math.abs(vector.x) >= Math.abs(vector.y)) {
    return vector.x >= 0 ? "right" : "left";
  }
  return vector.y >= 0 ? "down" : "up";
}
