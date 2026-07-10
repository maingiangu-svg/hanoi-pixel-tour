import { ctx } from "../state.js";
import { isRectVisible } from "../camera.js";
import { drawPixelRect } from "./renderUI.js";

export function drawDecorations(map, layer) {
  map.decorations.forEach((decoration) => {
    if (!isRectVisible(getDecorationRect(decoration), 100)) {
      return;
    }

    const frontTypes = ["lamp", "flag", "stall", "bench", "planter", "sign", "streetSign", "trashBin", "electricBox", "bicycle", "crate", "banner", "rail", "lotus", "motorbike", "powerPole", "khueVanCac", "stele", "bridgeTruss"];
    const isFront = frontTypes.includes(decoration.type);
    if ((layer === "front" && !isFront) || (layer === "behind" && isFront)) {
      return;
    }

    if (decoration.type === "tree") {
      drawTree(decoration.x, decoration.y);
    }
    if (decoration.type === "lamp") {
      drawLamp(decoration.x, decoration.y);
    }
    if (decoration.type === "zebra") {
      drawZebra(decoration);
    }
    if (decoration.type === "flag") {
      drawFlag(decoration.x, decoration.y);
    }
    if (decoration.type === "stall") {
      drawMarketStall(decoration.x, decoration.y);
    }
    if (decoration.type === "bench") {
      drawBench(decoration.x, decoration.y);
    }
    if (decoration.type === "planter") {
      drawPlanter(decoration.x, decoration.y);
    }
    if (decoration.type === "sign") {
      drawSmallSign(decoration.x, decoration.y, decoration.text || "i");
    }
    if (decoration.type === "crate") {
      drawCrate(decoration.x, decoration.y);
    }
    if (decoration.type === "banner") {
      drawBanner(decoration.x, decoration.y, decoration.color || "#c9413a");
    }
    if (decoration.type === "rail") {
      drawRail(decoration.x, decoration.y, decoration.width || 80);
    }
    if (decoration.type === "lotus") {
      drawLotus(decoration.x, decoration.y);
    }
    if (decoration.type === "turtleTower") {
      drawTurtleTower(decoration.x, decoration.y);
    }
    if (decoration.type === "lakeRail") {
      drawLakeRail(decoration.x, decoration.y, decoration.width || 200, decoration.height || 160);
    }
    if (decoration.type === "motorbike") {
      drawMotorbike(decoration.x, decoration.y);
    }
    if (decoration.type === "powerPole") {
      drawPowerPole(decoration.x, decoration.y);
    }
    if (decoration.type === "khueVanCac") {
      drawKhueVanCac(decoration.x, decoration.y);
    }
    if (decoration.type === "stele") {
      drawStele(decoration.x, decoration.y);
    }
    if (decoration.type === "bridgeTruss") {
      drawBridgeTruss(decoration.x, decoration.y, decoration.width || 240);
    }
    if (decoration.type === "skyline") {
      drawSkyline(decoration);
    }
    if (decoration.type === "streetSign") {
      drawStreetSign(decoration.x, decoration.y, decoration.text || "PHỐ");
    }
    if (decoration.type === "trashBin") {
      drawTrashBin(decoration.x, decoration.y);
    }
    if (decoration.type === "electricBox") {
      drawElectricBox(decoration.x, decoration.y);
    }
    if (decoration.type === "bicycle") {
      drawBicycle(decoration.x, decoration.y);
    }
  });
}

function getDecorationRect(decoration) {
  return {
    x: decoration.x - 24,
    y: decoration.y - 24,
    width: decoration.width || 96,
    height: decoration.height || 96
  };
}

export function drawTree(x, y) {
  ctx.fillStyle = "#5b3c25";
  ctx.fillRect(x + 10, y + 18, 8, 18);
  ctx.fillStyle = "#2f8f46";
  ctx.fillRect(x + 4, y + 8, 20, 16);
  ctx.fillRect(x, y + 16, 28, 14);
  ctx.fillStyle = "#4fba5f";
  ctx.fillRect(x + 8, y, 14, 14);
}

export function drawLamp(x, y) {
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 6, y + 8, 5, 30);
  ctx.fillStyle = "#f5e773";
  ctx.fillRect(x + 2, y, 13, 10);
  ctx.strokeStyle = "#151515";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y, 13, 10);
}

export function drawZebra(zebra) {
  ctx.fillStyle = "#f8f5df";
  if (zebra.direction === "vertical") {
    for (let y = zebra.y + 8; y < zebra.y + zebra.height - 4; y += 16) {
      ctx.fillRect(zebra.x + 8, y, zebra.width - 16, 7);
    }
  } else {
    for (let x = zebra.x + 8; x < zebra.x + zebra.width - 4; x += 16) {
      ctx.fillRect(x, zebra.y + 8, 7, zebra.height - 16);
    }
  }
}

export function drawFlag(x, y) {
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x, y, 5, 48);
  ctx.fillStyle = "#d63131";
  ctx.fillRect(x + 5, y + 4, 34, 20);
  ctx.fillStyle = "#f5e773";
  ctx.fillRect(x + 18, y + 10, 8, 5);
}

export function drawMarketStall(x, y) {
  drawPixelRect(x, y, 24, 22, "#f2a13a", "#151515", 2);
  ctx.fillStyle = "#d93935";
  ctx.fillRect(x - 3, y - 7, 30, 8);
}

export function drawBench(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(x + 3, y + 15, 42, 6);
  ctx.fillStyle = "#71452b";
  ctx.fillRect(x, y + 4, 46, 7);
  ctx.fillRect(x, y + 14, 46, 6);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 7, y + 20, 5, 8);
  ctx.fillRect(x + 34, y + 20, 5, 8);
}

export function drawPlanter(x, y) {
  drawPixelRect(x, y + 12, 30, 16, "#8b5634", "#151515", 2);
  ctx.fillStyle = "#2f8f46";
  ctx.fillRect(x + 4, y + 6, 8, 8);
  ctx.fillRect(x + 12, y, 8, 14);
  ctx.fillRect(x + 20, y + 7, 7, 8);
  ctx.fillStyle = "#e6d06b";
  ctx.fillRect(x + 9, y + 5, 3, 3);
  ctx.fillRect(x + 21, y + 8, 3, 3);
}

export function drawSmallSign(x, y, text) {
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 12, y + 20, 5, 22);
  drawPixelRect(x, y, 30, 22, "#f2bd45", "#151515", 2);
  ctx.fillStyle = "#151515";
  ctx.font = "700 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x + 15, y + 15);
}

export function drawCrate(x, y) {
  drawPixelRect(x, y, 22, 18, "#b8793c", "#151515", 2);
  ctx.strokeStyle = "#6d4324";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + 19, y + 15);
  ctx.moveTo(x + 19, y + 3);
  ctx.lineTo(x + 3, y + 15);
  ctx.stroke();
}

export function drawBanner(x, y, color) {
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x, y, 4, 34);
  ctx.fillRect(x + 38, y, 4, 34);
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, y + 5, 34, 16);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 16, y + 9, 10, 5);
}

export function drawRail(x, y, width) {
  ctx.fillStyle = "#71372f";
  ctx.fillRect(x, y, width, 5);
  ctx.fillRect(x, y + 18, width, 5);
  for (let px = x + 6; px < x + width - 4; px += 18) {
    ctx.fillRect(px, y - 2, 5, 28);
  }
}

export function drawLotus(x, y) {
  ctx.fillStyle = "#f5a6bc";
  ctx.fillRect(x + 6, y + 2, 9, 7);
  ctx.fillRect(x + 1, y + 8, 9, 6);
  ctx.fillRect(x + 12, y + 8, 9, 6);
  ctx.fillStyle = "#f2d86b";
  ctx.fillRect(x + 9, y + 8, 4, 4);
}

export function drawTurtleTower(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + 4, y + 46, 78, 12);
  drawPixelRect(x + 10, y + 34, 60, 18, "#d9c77a", "#151515", 3);
  drawPixelRect(x + 22, y + 14, 36, 22, "#e8dca0", "#151515", 3);
  ctx.fillStyle = "#8b3f2f";
  ctx.fillRect(x + 16, y + 6, 48, 12);
  ctx.fillStyle = "#f7e9ad";
  ctx.fillRect(x + 31, y + 22, 8, 12);
  ctx.fillRect(x + 45, y + 22, 8, 12);
}

export function drawLakeRail(x, y, width, height) {
  ctx.fillStyle = "#d6c57a";
  for (let px = x; px < x + width; px += 28) {
    ctx.fillRect(px, y, 16, 5);
    ctx.fillRect(px, y + height, 16, 5);
  }
  for (let py = y + 20; py < y + height - 12; py += 28) {
    ctx.fillRect(x, py, 5, 16);
    ctx.fillRect(x + width, py, 5, 16);
  }
}

export function drawMotorbike(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(x + 2, y + 18, 42, 6);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 4, y + 20, 10, 10);
  ctx.fillRect(x + 32, y + 20, 10, 10);
  ctx.fillStyle = "#c9413a";
  ctx.fillRect(x + 12, y + 10, 24, 10);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 28, y + 7, 12, 6);
  ctx.fillStyle = "#315f8f";
  ctx.fillRect(x + 18, y + 4, 14, 8);
}

export function drawPowerPole(x, y) {
  ctx.fillStyle = "#4a3728";
  ctx.fillRect(x + 8, y, 8, 64);
  ctx.fillRect(x - 8, y + 14, 40, 5);
  ctx.strokeStyle = "#1f2024";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 16);
  ctx.lineTo(x + 50, y + 28);
  ctx.moveTo(x + 32, y + 16);
  ctx.lineTo(x + 78, y + 8);
  ctx.stroke();
}

export function drawKhueVanCac(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(x + 5, y + 70, 124, 10);
  drawPixelRect(x + 20, y + 50, 90, 34, "#d7b465", "#151515", 3);
  ctx.fillStyle = "#9f3e35";
  ctx.fillRect(x + 6, y + 28, 118, 28);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 16, y + 18, 98, 14);
  ctx.fillStyle = "#2f7d4c";
  ctx.fillRect(x + 42, y + 38, 42, 24);
  ctx.fillStyle = "#61402a";
  ctx.fillRect(x + 30, y + 72, 12, 34);
  ctx.fillRect(x + 88, y + 72, 12, 34);
}

export function drawStele(x, y) {
  ctx.fillStyle = "#33523a";
  ctx.fillRect(x + 8, y + 28, 36, 10);
  drawPixelRect(x + 13, y + 4, 26, 28, "#8f8a78", "#151515", 2);
  ctx.fillStyle = "#2d332d";
  ctx.fillRect(x + 18, y + 12, 16, 4);
  ctx.fillRect(x + 18, y + 20, 16, 4);
}

export function drawBridgeTruss(x, y, width) {
  ctx.strokeStyle = "#8d3f39";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 80);
  ctx.lineTo(x + width, y + 80);
  ctx.moveTo(x, y + 160);
  ctx.lineTo(x + width, y + 160);
  for (let px = x; px < x + width - 60; px += 72) {
    ctx.moveTo(px, y + 160);
    ctx.lineTo(px + 52, y + 80);
    ctx.lineTo(px + 104, y + 160);
  }
  ctx.stroke();
}

export function drawSkyline({ x, y, width = 520, height = 160 }) {
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(x, y + height - 12, width, 12);
  const colors = ["#777b7c", "#8a867c", "#9b927f", "#6f777d", "#b0a58f"];
  let px = x;
  let index = 0;
  while (px < x + width) {
    const w = 44 + (index % 4) * 12;
    const h = 60 + (index % 5) * 18;
    const top = y + height - h;
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(px, top, w, h);
    ctx.fillStyle = "#f5df91";
    for (let wy = top + 16; wy < y + height - 18; wy += 22) {
      for (let wx = px + 8; wx < px + w - 8; wx += 18) {
        if ((wx + wy + index) % 3 !== 0) ctx.fillRect(wx, wy, 7, 8);
      }
    }
    ctx.fillStyle = "#33363a";
    ctx.fillRect(px + w - 14, top - 10, 8, 10);
    if (index % 3 === 0) {
      ctx.fillRect(px + w / 2, top - 18, 3, 18);
    }
    px += w + 10;
    index += 1;
  }
}

export function drawStreetSign(x, y, text) {
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 11, y + 18, 5, 28);
  drawPixelRect(x, y, 64, 20, "#2f6d8c", "#151515", 2);
  ctx.fillStyle = "#fff8d6";
  ctx.font = "700 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x + 32, y + 14);
}

export function drawTrashBin(x, y) {
  drawPixelRect(x, y + 6, 20, 28, "#2f7d4c", "#151515", 2);
  ctx.fillStyle = "#d7d2bd";
  ctx.fillRect(x + 4, y + 12, 12, 3);
  ctx.fillRect(x + 4, y + 20, 12, 3);
}

export function drawElectricBox(x, y) {
  drawPixelRect(x, y, 28, 34, "#7a8f8b", "#151515", 2);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 9, y + 8, 10, 10);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 6, y + 24, 16, 3);
}

export function drawBicycle(x, y) {
  ctx.fillStyle = "#151515";
  ctx.fillRect(x, y + 18, 10, 10);
  ctx.fillRect(x + 28, y + 18, 10, 10);
  ctx.strokeStyle = "#315f8f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 22);
  ctx.lineTo(x + 18, y + 10);
  ctx.lineTo(x + 33, y + 22);
  ctx.lineTo(x + 13, y + 22);
  ctx.lineTo(x + 18, y + 10);
  ctx.stroke();
}
