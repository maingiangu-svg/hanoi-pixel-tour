import { ctx } from "../state.js";

const FAR_COLORS = Object.freeze(["#5d6670", "#687078", "#555f69", "#73777a"]);
const MID_COLORS = Object.freeze(["#777b7c", "#8a867c", "#9b927f", "#6f777d", "#b0a58f"]);
const SIGN_COLORS = Object.freeze(["#a43d38", "#315f8f", "#9a5a32"]);

export function drawSkyline({ x, y, width = 520, height = 160 }) {
  drawFarLayer(x, y, width, height);
  drawMidLayer(x, y, width, height);
  ctx.fillStyle = "rgba(17, 21, 28, 0.24)";
  ctx.fillRect(x, y + height - 12, width, 12);
  ctx.fillStyle = "rgba(218, 199, 154, 0.2)";
  ctx.fillRect(x, y + height - 14, width, 2);
}

export function drawSkylineNightLights({ x, y, width = 520, height = 160 }, strength) {
  const tick = Math.floor(performance.now() / 1100);
  let px = x + 7;
  let index = 0;
  while (px < x + width) {
    const buildingWidth = 44 + (index % 4) * 12;
    const buildingHeight = 60 + (index % 5) * 18;
    const top = y + height - buildingHeight;
    let row = 0;
    for (let windowY = top + 16; windowY < y + height - 18; windowY += 22) {
      let column = 0;
      for (let windowX = px + 8; windowX < px + buildingWidth - 8; windowX += 18) {
        const value = pixelHash(index, row * 7 + column, 29);
        if (value % 5 <= 1 && (value + tick) % 13 !== 0) {
          ctx.fillStyle = value % 3 === 0
            ? `rgba(255, 196, 105, ${0.24 + strength * 0.34})`
            : `rgba(255, 226, 145, ${0.18 + strength * 0.28})`;
          ctx.fillRect(windowX, windowY, 7, 8);
          if (value % 4 === 0) {
            ctx.fillStyle = `rgba(255, 213, 124, ${0.06 + strength * 0.08})`;
            ctx.fillRect(windowX - 2, windowY + 9, 11, 3);
          }
        }
        column += 1;
      }
      row += 1;
    }

    if (index % 6 === 2) {
      const signWidth = Math.min(34, buildingWidth - 12);
      const signY = top + Math.min(44, buildingHeight - 35);
      ctx.fillStyle = `rgba(227, 86, 58, ${0.25 + strength * 0.35})`;
      ctx.fillRect(px + 6, signY, signWidth, 6);
      ctx.fillStyle = `rgba(255, 164, 83, ${0.06 + strength * 0.09})`;
      ctx.fillRect(px + 3, signY + 7, signWidth + 6, 3);
    }

    if (index % 4 === 0) {
      ctx.fillStyle = `rgba(224, 71, 54, ${0.35 + strength * 0.35})`;
      ctx.fillRect(px + buildingWidth - 10, top - 11, 3, 3);
    }
    px += buildingWidth + 10;
    index += 1;
  }
}

function drawFarLayer(x, y, width, height) {
  let px = x + 18;
  let index = 0;
  while (px < x + width) {
    const buildingWidth = 50 + (index % 3) * 16;
    const buildingHeight = 42 + (index % 4) * 13;
    const top = y + height - buildingHeight - 38;
    ctx.fillStyle = FAR_COLORS[index % FAR_COLORS.length];
    ctx.fillRect(px, top, buildingWidth, buildingHeight + 38);
    ctx.fillStyle = "rgba(218, 226, 220, 0.2)";
    for (let windowX = px + 9; windowX < px + buildingWidth - 7; windowX += 20) {
      ctx.fillRect(windowX, top + 14, 8, 6);
    }
    if (index % 2 === 0) {
      ctx.fillStyle = "#343b42";
      ctx.fillRect(px + buildingWidth / 2, top - 13, 3, 13);
    }
    px += buildingWidth + 13;
    index += 1;
  }
}

function drawMidLayer(x, y, width, height) {
  let px = x;
  let index = 0;
  while (px < x + width) {
    const buildingWidth = 44 + (index % 4) * 12;
    const buildingHeight = 60 + (index % 5) * 18;
    const top = y + height - buildingHeight;
    ctx.fillStyle = "rgba(20, 23, 27, 0.18)";
    ctx.fillRect(px + 5, top + 5, buildingWidth, buildingHeight);
    ctx.fillStyle = MID_COLORS[index % MID_COLORS.length];
    ctx.fillRect(px, top, buildingWidth, buildingHeight);
    ctx.fillStyle = "#687b84";
    for (let windowY = top + 16; windowY < y + height - 18; windowY += 22) {
      for (let windowX = px + 8; windowX < px + buildingWidth - 8; windowX += 18) {
        if (pixelHash(index, windowX, windowY) % 4 !== 0) ctx.fillRect(windowX, windowY, 7, 8);
      }
    }
    ctx.fillStyle = "#33363a";
    ctx.fillRect(px + buildingWidth - 14, top - 10, 8, 10);
    if (index % 3 === 0) ctx.fillRect(px + buildingWidth / 2, top - 18, 3, 18);
    if (index % 6 === 2) {
      ctx.fillStyle = SIGN_COLORS[index % SIGN_COLORS.length];
      ctx.fillRect(px + 6, top + Math.min(44, buildingHeight - 35), Math.min(34, buildingWidth - 12), 6);
    }
    px += buildingWidth + 10;
    index += 1;
  }
}

function pixelHash(x, y, seed) {
  let value = Math.imul(x + seed, 374761393) ^ Math.imul(y - seed, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}
