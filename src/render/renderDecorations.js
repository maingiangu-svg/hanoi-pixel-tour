import { ctx } from "../state.js";
import { isRectVisible } from "../camera.js";
import { drawPixelRect } from "./renderUI.js";
import { drawGroundShadow, drawTallPixelShadow } from "./renderPixelEffects.js";
import { drawSkyline } from "./renderSkyline.js";

export function drawDecorations(map, layer) {
  map.decorations.forEach((decoration) => {
    if (!isRectVisible(getDecorationRect(decoration), 100)) {
      return;
    }

    const frontTypes = ["lamp", "flag", "stall", "bench", "planter", "sign", "streetSign", "trafficSign", "trashBin", "electricBox", "bicycle", "crate", "banner", "rail", "lotus", "motorbike", "powerPole", "khueVanCac", "stele", "bridgeTruss", "teaCorner", "plasticStools", "streetVendor"];
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
    if (decoration.type === "trafficSign") {
      drawTrafficSign(decoration.x, decoration.y, decoration.direction || "right");
    }
    if (decoration.type === "teaCorner") {
      drawTeaCorner(decoration.x, decoration.y, decoration.color || "#2f8ec5");
    }
    if (decoration.type === "plasticStools") {
      drawPlasticStoolGroup(decoration.x, decoration.y);
    }
    if (decoration.type === "streetVendor") {
      drawStreetVendor(decoration.x, decoration.y, decoration.text || "HÀNG RONG");
    }
    if (decoration.type === "pocketParking") {
      drawPocketParking(decoration.x, decoration.y, decoration.width || 160, decoration.height || 72);
    }
    if (decoration.type === "alleyMouth") {
      drawAlleyMouth(decoration.x, decoration.y, decoration.width || 96, decoration.text || "NGÕ");
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
  drawGroundShadow(x + 14, y + 31, 34, 7);
  ctx.fillStyle = "#5b3c25";
  ctx.fillRect(x + 10, y + 18, 8, 18);
  ctx.fillStyle = "#2f8f46";
  ctx.fillRect(x + 4, y + 8, 20, 16);
  ctx.fillRect(x, y + 16, 28, 14);
  ctx.fillStyle = "#4fba5f";
  ctx.fillRect(x + 8, y, 14, 14);
}

export function drawLamp(x, y) {
  drawTallPixelShadow(x + 8, y + 38, 32, 3);
  drawGroundShadow(x + 8, y + 38, 15, 4);
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
  drawGroundShadow(x + 23, y + 20, 46, 6);
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
  ctx.fillStyle = "#6c5c45";
  for (let px = x; px < x + width; px += 28) {
    ctx.fillRect(px, y, 18, 4);
    ctx.fillRect(px, y + height, 18, 4);
    ctx.fillRect(px + 2, y - 5, 4, 13);
    ctx.fillRect(px + 2, y + height - 5, 4, 13);
  }
  for (let py = y + 20; py < y + height - 12; py += 28) {
    ctx.fillRect(x, py, 4, 18);
    ctx.fillRect(x + width, py, 4, 18);
    ctx.fillRect(x - 5, py + 2, 13, 4);
    ctx.fillRect(x + width - 5, py + 2, 13, 4);
  }
  ctx.fillStyle = "#d6c57a";
  ctx.fillRect(x - 5, y - 5, 9, 5);
  ctx.fillRect(x + width - 4, y - 5, 9, 5);
}

export function drawMotorbike(x, y) {
  drawGroundShadow(x + 23, y + 18, 42, 6);
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
  drawTallPixelShadow(x + 12, y + 64, 54, 4);
  drawGroundShadow(x + 12, y + 64, 18, 5);
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
  drawGroundShadow(x + 67, y + 74, 124, 10);
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

export function drawTrafficSign(x, y, direction) {
  drawTallPixelShadow(x + 12, y + 48, 34, 3);
  ctx.fillStyle = "#34383e";
  ctx.fillRect(x + 10, y + 18, 5, 32);
  drawPixelRect(x, y, 26, 22, "#f7f1dc", "#151515", 2);
  ctx.fillStyle = "#c9413a";
  ctx.fillRect(x + 3, y + 3, 20, 4);
  ctx.fillRect(x + 3, y + 15, 20, 4);
  ctx.fillRect(x + 3, y + 3, 4, 16);
  ctx.fillRect(x + 19, y + 3, 4, 16);
  ctx.fillStyle = "#315f8f";
  if (direction === "left") {
    ctx.fillRect(x + 7, y + 9, 11, 4);
    ctx.fillRect(x + 7, y + 7, 4, 8);
  } else {
    ctx.fillRect(x + 8, y + 9, 11, 4);
    ctx.fillRect(x + 15, y + 7, 4, 8);
  }
}

export function drawTeaCorner(x, y, color) {
  drawGroundShadow(x + 30, y + 34, 72, 7);
  drawPlasticStool(x, y + 23, "#d8484f");
  drawPlasticStool(x + 48, y + 25, color);
  drawPlasticStool(x + 7, y + 43, "#f2bd45");
  drawPixelRect(x + 16, y + 20, 34, 16, "#845638", "#151515", 2);
  ctx.fillStyle = "#dce6e8";
  ctx.fillRect(x + 25, y + 6, 9, 16);
  ctx.fillStyle = "#6f8994";
  ctx.fillRect(x + 27, y + 3, 5, 5);
  ctx.fillStyle = "#2f8ec5";
  ctx.fillRect(x + 20, y + 15, 5, 5);
  ctx.fillRect(x + 38, y + 15, 5, 5);
  ctx.fillStyle = "#8de097";
  ctx.fillRect(x + 45, y + 13, 4, 7);
}

export function drawPlasticStoolGroup(x, y) {
  drawGroundShadow(x + 32, y + 20, 64, 6);
  drawPlasticStool(x, y, "#d8484f");
  drawPlasticStool(x + 22, y + 6, "#2f8ec5");
  drawPlasticStool(x + 44, y + 1, "#f2bd45");
}

export function drawStreetVendor(x, y, text) {
  drawGroundShadow(x + 44, y + 40, 86, 7);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 8, y + 34, 12, 12);
  ctx.fillRect(x + 60, y + 34, 12, 12);
  drawPixelRect(x + 12, y + 16, 56, 24, "#c78b45", "#151515", 2);
  ctx.fillStyle = "#d8484f";
  ctx.fillRect(x + 5, y + 8, 70, 10);
  ctx.fillStyle = "#fff3c4";
  ctx.font = "700 7px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x + 40, y + 15);
  ctx.fillStyle = "#4a3728";
  ctx.fillRect(x + 72, y + 2, 4, 40);
}

export function drawPocketParking(x, y, width, height) {
  drawPixelRect(x, y, width, height, "#484d54", "#24272c", 3);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let bayX = x + 14; bayX < x + width - 18; bayX += 54) {
    ctx.fillRect(bayX, y + 8, 3, height - 16);
    ctx.fillRect(bayX, y + height - 11, 40, 3);
  }
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 8, y + 8, 16, 4);
}

export function drawAlleyMouth(x, y, width, text) {
  ctx.fillStyle = "rgba(47,45,42,0.32)";
  ctx.fillRect(x, y, width, 34);
  ctx.fillStyle = "#7a7368";
  for (let tileX = x + 5; tileX < x + width - 4; tileX += 18) {
    ctx.fillRect(tileX, y + 24, 12, 3);
  }
  ctx.fillStyle = "#315f8f";
  ctx.fillRect(x + 6, y - 10, Math.min(54, width - 12), 15);
  ctx.fillStyle = "#fff8d6";
  ctx.font = "700 8px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x + Math.min(54, width - 12) / 2 + 6, y + 1);
}

function drawPlasticStool(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 16, 8);
  ctx.fillRect(x + 2, y + 8, 3, 8);
  ctx.fillRect(x + 11, y + 8, 3, 8);
}
