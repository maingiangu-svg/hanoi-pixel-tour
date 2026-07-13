import { ctx } from "../state.js";
import { drawPixelRect } from "./renderUI.js";
import { drawPixelShadow } from "./renderPixelEffects.js";

const DEFAULT_SIGNS = ["PHỞ", "TRÀ", "SÁCH", "BÁNH", "TẠP HÓA"];

export function drawTubeHouse(building) {
  const variant = getVariant(building, 5);
  const x = building.x;
  const y = building.y;
  const w = building.width;
  const h = building.height;

  drawPixelShadow(x, y, w, h);
  drawPixelRect(x, y, w, h, building.color || "#d8b95e", "#1f2024", 3);
  drawAgedWall(x, y, w, h, variant);
  drawTubeRoof(building, variant);

  const groundTop = y + h - 30;
  drawShopFront(building, groundTop, variant);

  const upperBottom = groundTop - 8;
  const floorHeight = variant % 2 === 0 ? 29 : 26;
  let floor = 0;
  for (let floorY = upperBottom - floorHeight; floorY >= y + 10; floorY -= floorHeight) {
    drawUpperFloor(building, floorY, floorHeight, variant + floor);
    floor += 1;
  }

  if (building.hasAirConditioner !== false) {
    drawAirConditioner(x + w - 23, y + 18 + (variant % 2) * 18);
  }
  if (building.hasWaterTank || variant === 4) {
    drawWaterTank(x + w - 29, y - 20, variant);
  }
}

export function drawAdminBuilding(building) {
  const variant = getVariant(building, 3);
  drawPixelShadow(building.x, building.y, building.width, building.height);
  drawPixelRect(
    building.x,
    building.y + 14,
    building.width,
    building.height - 14,
    building.color || "#d8d0a8",
    "#151515",
    4
  );
  ctx.fillStyle = building.roof || "#9f4b3f";
  ctx.fillRect(building.x - 10, building.y, building.width + 20, 24);
  ctx.fillStyle = "#6e5540";
  ctx.fillRect(building.x - 4, building.y + 23, building.width + 8, 5);

  for (let x = building.x + 24; x < building.x + building.width - 18; x += 54) {
    ctx.fillStyle = variant === 1 ? "#dce6df" : "#f4e6b0";
    ctx.fillRect(x, building.y + 42, 25, 23);
    ctx.fillStyle = "#587284";
    ctx.fillRect(x + 4, building.y + 46, 17, 15);
    ctx.fillStyle = "#1f2024";
    ctx.fillRect(x + 11, building.y + 46, 2, 15);
  }

  ctx.fillStyle = "#b8aa86";
  ctx.fillRect(building.x + 20, building.y + building.height - 18, building.width - 40, 8);
  ctx.fillStyle = "#5b4435";
  ctx.fillRect(building.x + building.width / 2 - 18, building.y + building.height - 32, 36, 32);
}

export function drawApartmentBlock(building) {
  const variant = getVariant(building, 3);
  drawPixelShadow(building.x, building.y, building.width, building.height);
  drawPixelRect(building.x, building.y, building.width, building.height, building.color || "#b7b9ad", "#151515", 3);
  ctx.fillStyle = building.roof || "#5e646a";
  ctx.fillRect(building.x - 5, building.y - 8, building.width + 10, 12);

  for (let floorY = building.y + 17; floorY < building.y + building.height - 40; floorY += 30) {
    ctx.fillStyle = variant === 0 ? "#817362" : "#686c6a";
    ctx.fillRect(building.x + 8, floorY + 16, building.width - 16, 4);
    for (let x = building.x + 14; x < building.x + building.width - 16; x += 30) {
      ctx.fillStyle = "#dce3dc";
      ctx.fillRect(x, floorY, 16, 14);
      ctx.fillStyle = (x + floorY) % 3 === 0 ? "#315f8f" : "#6f8994";
      ctx.fillRect(x + 3, floorY + 3, 10, 8);
      if ((x + floorY) % 4 === 0) {
        drawAirConditioner(x + 12, floorY + 10);
      }
    }
  }

  ctx.fillStyle = "#6a4b35";
  ctx.fillRect(building.x + building.width / 2 - 15, building.y + building.height - 30, 30, 30);
  drawWaterTank(building.x + building.width - 36, building.y - 23, variant);
  ctx.fillStyle = "#282a2e";
  ctx.fillRect(building.x + 18, building.y - 18, 3, 12);
}

export function drawCafeFront(building) {
  const x = building.x;
  const y = building.y;
  const w = building.width;
  const h = building.height;
  const variant = getVariant(building, 3);

  drawPixelShadow(x, y, w, h);
  drawPixelRect(x, y, w, h, building.color || "#d9b26a", "#151515", 3);
  ctx.fillStyle = building.roof || "#8d3f39";
  ctx.fillRect(x - 4, y - 6, w + 8, 12);
  drawStripedAwning(x + 8, y + 18, w - 16, variant);

  ctx.fillStyle = "#293943";
  ctx.fillRect(x + 12, y + 43, w - 24, h - 53);
  ctx.fillStyle = "#77a7b4";
  ctx.fillRect(x + 17, y + 48, w - 34, Math.max(12, h - 66));
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(x + 22, y + 51, Math.max(12, w / 3), 4);
  ctx.fillStyle = "#fff3c4";
  ctx.font = "700 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(building.sign || "CÀ PHÊ", x + w / 2, y + 15);
}

function drawTubeRoof(building, variant) {
  const x = building.x;
  const y = building.y;
  const w = building.width;
  ctx.fillStyle = building.roof || "#9f3e35";
  if (variant === 1 || variant === 4) {
    ctx.fillRect(x - 3, y - 9, w + 6, 15);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + 4, y - 5, w - 8, 3);
  } else {
    ctx.fillRect(x - 5, y - 7, w + 10, 13);
    for (let roofX = x + 2; roofX < x + w - 4; roofX += 12) {
      ctx.fillStyle = variant === 2 ? "#71372f" : building.roof || "#9f3e35";
      ctx.fillRect(roofX, y - 10, 8, 5);
    }
  }
}

function drawShopFront(building, groundTop, variant) {
  const x = building.x;
  const w = building.width;
  const h = building.height;
  const y = building.y;
  const shutterX = x + 9;
  const shutterWidth = w - 18;

  ctx.fillStyle = variant % 2 === 0 ? "#61757a" : building.door || "#49362e";
  ctx.fillRect(shutterX, groundTop + 8, shutterWidth, 22);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let lineY = groundTop + 11; lineY < y + h - 2; lineY += 5) {
    ctx.fillRect(shutterX + 3, lineY, shutterWidth - 6, 2);
  }

  const signText = building.sign || DEFAULT_SIGNS[variant];
  ctx.fillStyle = variant === 3 ? "#315f8f" : variant === 4 ? "#8a3f32" : "#c9413a";
  ctx.fillRect(x + 8, groundTop - 9, w - 16, 15);
  ctx.fillStyle = "#fff3c4";
  ctx.font = "700 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(signText, x + w / 2, groundTop + 2);

  if (building.hasAwning !== false) {
    drawStripedAwning(x + 5, groundTop + 4, w - 10, variant);
  }
}

function drawUpperFloor(building, floorY, floorHeight, variant) {
  const x = building.x;
  const w = building.width;
  const balconyLeft = building.balconySide === "right" ? x + w / 2 - 2 : x + 7;
  const balconyWidth = Math.max(24, w / 2 - 6);
  const windowColor = variant % 3 === 0 ? "#365d70" : variant % 3 === 1 ? "#486f73" : "#705848";

  ctx.fillStyle = "#ece4cc";
  if (variant % 2 === 0) {
    ctx.fillRect(x + 9, floorY + 4, 18, 14);
    ctx.fillRect(x + w - 27, floorY + 4, 18, 14);
    ctx.fillStyle = windowColor;
    ctx.fillRect(x + 12, floorY + 7, 12, 8);
    ctx.fillRect(x + w - 24, floorY + 7, 12, 8);
  } else {
    ctx.fillRect(x + w / 2 - 15, floorY + 3, 30, 16);
    ctx.fillStyle = windowColor;
    ctx.fillRect(x + w / 2 - 11, floorY + 6, 9, 10);
    ctx.fillRect(x + w / 2 + 2, floorY + 6, 9, 10);
  }

  if (variant % 3 !== 2 && floorHeight > 24) {
    ctx.fillStyle = "#2f3438";
    ctx.fillRect(balconyLeft, floorY + 20, balconyWidth, 4);
    for (let railX = balconyLeft + 4; railX < balconyLeft + balconyWidth - 2; railX += 8) {
      ctx.fillRect(railX, floorY + 18, 3, 10);
    }
    ctx.fillStyle = "#54764a";
    ctx.fillRect(balconyLeft + 5, floorY + 15, 7, 5);
  }
}

function drawStripedAwning(x, y, width, variant) {
  const stripe = Math.max(8, Math.floor(width / 6));
  for (let offset = 0; offset < width; offset += stripe) {
    ctx.fillStyle = (Math.floor(offset / stripe) + variant) % 2 === 0 ? "#c9413a" : "#fff3c4";
    ctx.fillRect(x + offset, y, Math.min(stripe, width - offset), 9);
  }
  ctx.fillStyle = "#1f2024";
  ctx.fillRect(x, y + 9, width, 3);
}

function drawAirConditioner(x, y) {
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x - 2, y - 2, 18, 12);
  ctx.fillStyle = "#d9d4bf";
  ctx.fillRect(x, y, 14, 8);
  ctx.fillStyle = "#747b7e";
  ctx.fillRect(x + 3, y + 5, 8, 2);
}

function drawWaterTank(x, y, variant) {
  ctx.fillStyle = "#25282d";
  ctx.fillRect(x + 8, y + 12, 3, 9);
  ctx.fillRect(x + 22, y + 12, 3, 9);
  ctx.fillStyle = variant % 2 === 0 ? "#5c6267" : "#6d7778";
  ctx.fillRect(x + 5, y + 3, 24, 12);
  ctx.fillStyle = "#9ba2a0";
  ctx.fillRect(x + 9, y, 16, 4);
}

function drawAgedWall(x, y, width, height, variant) {
  ctx.fillStyle = "rgba(92,66,45,0.11)";
  ctx.fillRect(x + 4 + variant * 3, y + height - 38, Math.max(7, width / 4), 3);
  ctx.fillRect(x + width - 18, y + 12 + variant * 7, 10, 4);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x + 5, y + 5, width - 10, 3);
}

function getVariant(building, count) {
  if (Number.isInteger(building.facadeVariant)) {
    return Math.abs(building.facadeVariant) % count;
  }
  return Math.abs(Math.floor(building.x / 10) + Math.floor(building.y / 10)) % count;
}
