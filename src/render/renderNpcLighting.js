import { ctx } from "../state.js";
import { getNightStrength } from "./renderLighting.js";

const LIGHT_RADIUS = 118;

export function drawNpcLocalLight(map, x, y, width = 24) {
  const nightStrength = getNightStrength();
  if (nightStrength <= 0.08 || map.kind === "churchInterior") return;

  const lamps = map.decorations || [];
  let nearestDistance = LIGHT_RADIUS;
  for (let index = 0; index < lamps.length; index += 1) {
    const lamp = lamps[index];
    if (lamp.type !== "lamp") continue;
    const distance = Math.hypot(lamp.x + 8 - (x + width / 2), lamp.y + 34 - (y + 24));
    if (distance < nearestDistance) nearestDistance = distance;
  }

  if (nearestDistance >= LIGHT_RADIUS) return;
  const strength = (1 - nearestDistance / LIGHT_RADIUS) * nightStrength;
  ctx.fillStyle = `rgba(255, 224, 151, ${0.08 + strength * 0.16})`;
  ctx.fillRect(x + 1, y + 2, Math.max(12, width - 2), 4);
  ctx.fillStyle = `rgba(255, 200, 105, ${0.035 + strength * 0.07})`;
  ctx.fillRect(x - 2, y + 18, width + 4, 5);
}
