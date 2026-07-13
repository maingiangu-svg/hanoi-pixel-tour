import { ctx } from "../state.js";
import { getCharacterSprite, isSpriteReady } from "./spriteAssets.js";

const RIDER_SOURCE_HEIGHT = 0.68;

export function drawCharacterSprite({ gender, centerX, topY, height, facing = "down", pose = "walking" }) {
  const asset = getCharacterSprite(gender);
  if (!isSpriteReady(asset)) {
    return false;
  }

  const sourceHeight = pose === "rider"
    ? Math.max(1, Math.round(asset.height * RIDER_SOURCE_HEIGHT))
    : asset.height;
  const drawHeight = Math.max(1, Math.round(height));
  const drawWidth = Math.max(1, Math.round(drawHeight * (asset.width / sourceHeight)));
  const x = Math.round(centerX - drawWidth / 2);
  const y = Math.round(topY);

  drawPreparedSprite(asset, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
    sourceHeight,
    flipHorizontal: facing === "left"
  });
  return true;
}

export function drawPreparedSprite(asset, options) {
  if (!isSpriteReady(asset)) {
    return false;
  }

  const sourceHeight = Math.min(asset.height, options.sourceHeight || asset.height);
  const x = Math.round(options.x);
  const y = Math.round(options.y);
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (options.flipHorizontal) {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(asset.drawable, 0, 0, asset.width, sourceHeight, 0, 0, width, height);
  } else {
    ctx.drawImage(asset.drawable, 0, 0, asset.width, sourceHeight, x, y, width, height);
  }
  ctx.restore();
  return true;
}
