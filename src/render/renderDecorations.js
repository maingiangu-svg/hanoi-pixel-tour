import { ctx } from "../state.js";
import { drawPixelRect } from "./renderUI.js";

export function drawDecorations(map, layer) {
  map.decorations.forEach((decoration) => {
    const frontTypes = ["lamp", "flag", "stall", "bench", "planter", "sign", "crate", "banner", "rail", "lotus"];
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
  });
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
