import { ctx, WORLD_HEIGHT, WORLD_WIDTH } from "../state.js";
import { foodCatalog } from "../data/foods.js";
import { drawPixelRect, drawTextBadge } from "./renderUI.js";

export function drawBackground(map) {
  ctx.fillStyle = map.background;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = "rgba(18, 55, 31, 0.13)";
  for (let y = 12; y < WORLD_HEIGHT; y += 34) {
    for (let x = (y / 34) % 2 === 0 ? 12 : 30; x < WORLD_WIDTH; x += 52) {
      ctx.fillRect(x, y, 8, 3);
      ctx.fillRect(x + 12, y + 7, 4, 3);
    }
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  for (let y = 0; y < WORLD_HEIGHT; y += 32) {
    for (let x = (y / 32) % 2 === 0 ? 0 : 16; x < WORLD_WIDTH; x += 32) {
      ctx.fillRect(x, y, 4, 4);
    }
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(0, 0, WORLD_WIDTH, 8);
  ctx.fillRect(0, WORLD_HEIGHT - 8, WORLD_WIDTH, 8);
  ctx.fillRect(0, 0, 8, WORLD_HEIGHT);
  ctx.fillRect(WORLD_WIDTH - 8, 0, 8, WORLD_HEIGHT);
}

export function drawWater(map) {
  map.water.forEach((water) => {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(water.x + 7, water.y + 7, water.width, water.height);
    drawPixelRect(water.x, water.y, water.width, water.height, "#237ab6", "#0d4d7a", 5);

    ctx.fillStyle = "#2f96ce";
    ctx.fillRect(water.x + 7, water.y + 7, water.width - 14, water.height - 14);
    ctx.fillStyle = "#3fb0de";
    ctx.fillRect(water.x + 14, water.y + 14, water.width - 28, water.height - 28);

    ctx.fillStyle = "#85d9ef";
    for (let y = water.y + 18; y < water.y + water.height - 8; y += 30) {
      for (let x = water.x + 18; x < water.x + water.width - 20; x += 54) {
        const offset = (Math.floor((x + y) / 18) % 2) * 10;
        ctx.fillRect(x + offset, y, 28, 4);
        ctx.fillRect(x + 10, y + 9, 22, 4);
      }
    }

    ctx.fillStyle = "#d6c57a";
    for (let x = water.x + 6; x < water.x + water.width - 8; x += 22) {
      ctx.fillRect(x, water.y - 4, 13, 5);
      ctx.fillRect(x, water.y + water.height - 1, 13, 5);
    }
    for (let y = water.y + 8; y < water.y + water.height - 8; y += 22) {
      ctx.fillRect(water.x - 4, y, 5, 13);
      ctx.fillRect(water.x + water.width - 1, y, 5, 13);
    }

    if (water.label) {
      drawTextBadge(water.label, water.x + water.width / 2, water.y + 28, 128, "#18547f");
    }
  });
}

export function drawWalkZones(map) {
  map.walkZones.forEach((zone) => {
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(zone.x + 5, zone.y + 5, zone.width, zone.height);

    if (zone.kind === "road") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#343943", "#1f222a", 4);
      ctx.fillStyle = "#59606b";
      if (zone.width >= zone.height) {
        ctx.fillRect(zone.x, zone.y + 7, zone.width, 4);
        ctx.fillRect(zone.x, zone.y + zone.height - 11, zone.width, 4);
      } else {
        ctx.fillRect(zone.x + 7, zone.y, 4, zone.height);
        ctx.fillRect(zone.x + zone.width - 11, zone.y, 4, zone.height);
      }
      drawRoadLine(zone);
    }

    if (zone.kind === "sidewalk") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#c9cec4", "#879087", 3);
      drawTilePattern(zone, "#e3e6da");
    }

    if (zone.kind === "plaza") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#d5bd73", "#907642", 3);
      drawTilePattern(zone, "#ead792");
    }

    if (zone.kind === "bridge") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#454a52", "#22242a", 4);
      ctx.fillStyle = "#b73b34";
      ctx.fillRect(zone.x, zone.y + 6, zone.width, 7);
      ctx.fillRect(zone.x, zone.y + zone.height - 13, zone.width, 7);
      ctx.fillStyle = "#e35a4f";
      for (let x = zone.x + 12; x < zone.x + zone.width - 10; x += 28) {
        ctx.fillRect(x, zone.y + 2, 6, zone.height - 4);
      }
      drawRoadLine(zone);
    }
  });
}

export function drawRoadLine(zone) {
  ctx.fillStyle = "#f2d86b";

  if (zone.width >= zone.height) {
    const y = zone.y + Math.floor(zone.height / 2) - 2;
    for (let x = zone.x + 16; x < zone.x + zone.width - 12; x += 48) {
      ctx.fillRect(x, y, 24, 4);
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(zone.x + 8, zone.y + 16, zone.width - 16, 2);
    ctx.fillRect(zone.x + 8, zone.y + zone.height - 18, zone.width - 16, 2);
  } else {
    const x = zone.x + Math.floor(zone.width / 2) - 2;
    for (let y = zone.y + 16; y < zone.y + zone.height - 12; y += 48) {
      ctx.fillRect(x, y, 4, 24);
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(zone.x + 16, zone.y + 8, 2, zone.height - 16);
    ctx.fillRect(zone.x + zone.width - 18, zone.y + 8, 2, zone.height - 16);
  }
}

export function drawTilePattern(zone, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = zone.x + 22; x < zone.x + zone.width; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, zone.y);
    ctx.lineTo(x, zone.y + zone.height);
    ctx.stroke();
  }
  for (let y = zone.y + 22; y < zone.y + zone.height; y += 22) {
    ctx.beginPath();
    ctx.moveTo(zone.x, y);
    ctx.lineTo(zone.x + zone.width, y);
    ctx.stroke();
  }
}

export function drawBuildings(map) {
  map.buildings.forEach((building) => {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(building.x + 6, building.y + 6, building.width, building.height);
    drawPixelRect(building.x, building.y, building.width, building.height, building.color, "#1f2024", 3);
    ctx.fillStyle = building.roof;
    ctx.fillRect(building.x - 4, building.y - 7, building.width + 8, 13);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(building.x + 5, building.y + 5, building.width - 10, 4);

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    for (let x = building.x + 10; x < building.x + building.width - 10; x += 26) {
      ctx.fillRect(x, building.y + 18, 12, 12);
      ctx.fillStyle = "rgba(42,58,70,0.35)";
      ctx.fillRect(x + 6, building.y + 18, 2, 12);
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    }

    ctx.fillStyle = "#49362e";
    ctx.fillRect(building.x + building.width / 2 - 7, building.y + building.height - 18, 14, 18);
  });
}

export function drawLandmarks(map) {
  map.landmarks.forEach((landmark) => {
    if (!["lake", "riverLabel", "plazaLabel", "longBridge"].includes(landmark.kind)) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(landmark.x + 6, landmark.y + 6, landmark.width, landmark.height);
    }

    if (landmark.kind === "lake") {
      drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y + landmark.height - 24, 120, "#18547f");
    } else if (landmark.kind === "temple") {
      drawTemple(landmark);
    } else if (landmark.kind === "redBridge") {
      drawRedBridge(landmark);
    } else if (landmark.kind === "oldQuarter") {
      drawOldQuarter(landmark);
    } else if (landmark.kind === "plazaLabel") {
      drawPlazaLabel(landmark);
    } else if (landmark.kind === "mausoleum") {
      drawMausoleum(landmark);
    } else if (landmark.kind === "onePillar") {
      drawOnePillarPagoda(landmark);
    } else if (landmark.kind === "citadel") {
      drawCitadel(landmark);
    } else if (landmark.kind === "gate") {
      drawTempleGate(landmark);
    } else if (landmark.kind === "longBridge") {
      drawLongBridge(landmark);
    } else if (landmark.kind === "market") {
      drawMarket(landmark);
    } else if (landmark.kind === "riverLabel") {
      drawTextBadge(landmark.name, landmark.x + landmark.width / 2, 72, 120, "#18547f");
    } else {
      drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#5fa8d3", "#151515", 4);
      drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 10, 160, "#202025");
    }
  });
}

export function drawShops(map) {
  map.shops.forEach((shop) => {
    const food = foodCatalog[shop.foodId];
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(shop.x + 6, shop.y + 6, shop.width, shop.height);
    drawPixelRect(shop.x, shop.y, shop.width, shop.height, "#dc7234", "#151515", 4);
    ctx.fillStyle = "#fbf1c0";
    ctx.fillRect(shop.x + 8, shop.y + 8, shop.width - 16, 16);

    for (let x = shop.x + 8; x < shop.x + shop.width - 8; x += 18) {
      ctx.fillStyle = (x / 18) % 2 === 0 ? "#e63b38" : "#fff3c4";
      ctx.fillRect(x, shop.y - 8, 18, 14);
    }

    ctx.fillStyle = "#332018";
    ctx.fillRect(shop.x + 18, shop.y + 34, 18, 22);
    ctx.fillStyle = "#f6d27a";
    ctx.fillRect(shop.x + 44, shop.y + 35, 22, 12);
    ctx.fillStyle = "#ffe36e";
    ctx.fillRect(shop.x + shop.width - 36, shop.y + 34, 20, 12);
    ctx.fillStyle = "#151515";
    ctx.font = "700 10px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("ĂN", shop.x + shop.width / 2, shop.y + 20);
    drawTextBadge(food.name, shop.x + shop.width / 2, shop.y - 16, 142, "#7d2a1d");
  });
}

export function drawExits(map) {
  map.exits.forEach((exit) => {
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.fillRect(exit.x + 5, exit.y + 5, exit.width, exit.height);
    drawPixelRect(exit.x, exit.y, exit.width, exit.height, "#7650b8", "#151515", 4);
    ctx.fillStyle = "#fff8d6";

    if (exit.kind === "bus") {
      ctx.fillRect(exit.x + 15, exit.y + 14, exit.width - 30, 20);
      ctx.fillStyle = "#2a2550";
      ctx.fillRect(exit.x + 24, exit.y + 18, 14, 8);
      ctx.fillRect(exit.x + exit.width - 38, exit.y + 18, 14, 8);
      ctx.fillStyle = "#151515";
      ctx.fillRect(exit.x + 22, exit.y + 37, 10, 10);
      ctx.fillRect(exit.x + exit.width - 32, exit.y + 37, 10, 10);
      ctx.fillStyle = "#f2bd45";
      ctx.fillRect(exit.x + exit.width - 12, exit.y - 20, 6, 24);
      drawPixelRect(exit.x + exit.width - 27, exit.y - 35, 34, 18, "#f2bd45", "#151515", 2);
      ctx.fillStyle = "#151515";
      ctx.font = "700 10px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("XE", exit.x + exit.width - 10, exit.y - 22);
      drawTextBadge("BUÝT", exit.x + exit.width / 2, exit.y + exit.height + 16, 70, "#3b245f");
    } else {
      ctx.fillRect(exit.x + 18, exit.y + 12, exit.width - 36, 34);
      ctx.fillStyle = "#7650b8";
      ctx.fillRect(exit.x + 27, exit.y + 22, exit.width - 54, 14);
      drawTextBadge("LỐI", exit.x + exit.width / 2, exit.y + exit.height + 16, 70, "#3b245f");
    }
  });
}

export function drawNpcs(map) {
  map.npcs.forEach((npc) => {
    const x = npc.x;
    const y = npc.y;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x - 7, y + 24, 34, 7);

    ctx.fillStyle = "#ffd0a6";
    ctx.fillRect(x + 1, y, 18, 16);
    ctx.fillStyle = "#4a2c25";
    ctx.fillRect(x + 1, y, 18, 5);
    ctx.fillStyle = npc.color;
    ctx.fillRect(x - 2, y + 16, 24, 18);
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillRect(x + 2, y + 18, 20, 4);
    ctx.fillStyle = "#2b2b32";
    ctx.fillRect(x + 2, y + 34, 7, 12);
    ctx.fillRect(x + 13, y + 34, 7, 12);
    ctx.fillStyle = "#151515";
    ctx.fillRect(x + 4, y + 6, 3, 3);
    ctx.fillRect(x + 13, y + 6, 3, 3);
    drawTextBadge(npc.name, x + 10, y - 13, 120, "#233021");
  });
}

export function drawTemple(landmark) {
  drawPixelRect(landmark.x, landmark.y + 22, landmark.width, landmark.height - 22, "#d7a847", "#151515", 3);
  ctx.fillStyle = "#b73631";
  ctx.fillRect(landmark.x - 7, landmark.y + 12, landmark.width + 14, 14);
  ctx.fillStyle = "#f4c542";
  ctx.fillRect(landmark.x + 18, landmark.y + 36, landmark.width - 36, 20);
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 15, 125, "#6f2b26");
}

export function drawRedBridge(landmark) {
  drawPixelRect(landmark.x, landmark.y + 13, landmark.width, 14, "#d73c36", "#151515", 3);
  ctx.fillStyle = "#ff7b70";
  for (let x = landmark.x + 10; x < landmark.x + landmark.width - 10; x += 20) {
    ctx.fillRect(x, landmark.y + 4, 6, 34);
  }
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 13, 126, "#6f2b26");
}

export function drawOldQuarter(landmark) {
  drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#e5c76f", "#151515", 3);
  const colors = ["#d94b3d", "#3d7fa5", "#7650b8", "#e9823a"];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(landmark.x + 8 + i * 24, landmark.y + 8, 18, 20);
    ctx.fillStyle = "#fff2bd";
    ctx.fillRect(landmark.x + 10 + i * 24, landmark.y + 34, 14, 16);
  }
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 15, 112, "#5a3d1e");
}

export function drawPlazaLabel(landmark) {
  ctx.strokeStyle = "#fff8d6";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(landmark.x, landmark.y, landmark.width, landmark.height);
  ctx.setLineDash([]);
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y + 18, 190, "#705d2c");
}

export function drawMausoleum(landmark) {
  drawPixelRect(landmark.x, landmark.y + 22, landmark.width, landmark.height - 22, "#cfd4d0", "#151515", 4);
  ctx.fillStyle = "#747b83";
  ctx.fillRect(landmark.x - 12, landmark.y + 10, landmark.width + 24, 16);
  for (let x = landmark.x + 18; x < landmark.x + landmark.width - 18; x += 26) {
    ctx.fillStyle = "#f1f0e5";
    ctx.fillRect(x, landmark.y + 34, 10, 36);
  }
  ctx.fillStyle = "#b02f2f";
  ctx.fillRect(landmark.x + landmark.width / 2 - 12, landmark.y, 24, 18);
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 16, 110, "#43484e");
}

export function drawOnePillarPagoda(landmark) {
  ctx.fillStyle = "#2f89c8";
  ctx.fillRect(landmark.x + 8, landmark.y + 50, landmark.width - 16, 28);
  ctx.fillStyle = "#6b4d32";
  ctx.fillRect(landmark.x + landmark.width / 2 - 6, landmark.y + 38, 12, 42);
  ctx.fillStyle = "#d33b35";
  ctx.fillRect(landmark.x + 24, landmark.y + 24, landmark.width - 48, 28);
  ctx.fillStyle = "#f4c542";
  ctx.fillRect(landmark.x + 14, landmark.y + 18, landmark.width - 28, 10);
  ctx.fillStyle = "#f6adc6";
  ctx.fillRect(landmark.x + 34, landmark.y + 4, 26, 14);
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 14, 136, "#663338");
}

export function drawCitadel(landmark) {
  drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#c78c45", "#151515", 4);
  ctx.fillStyle = "#8b3f2f";
  ctx.fillRect(landmark.x - 5, landmark.y - 9, landmark.width + 10, 13);
  ctx.fillStyle = "#422c24";
  ctx.fillRect(landmark.x + landmark.width / 2 - 22, landmark.y + 34, 44, 48);
  ctx.fillStyle = "#f1cf68";
  for (let x = landmark.x + 16; x < landmark.x + landmark.width - 20; x += 34) {
    ctx.fillRect(x, landmark.y + 18, 16, 12);
  }
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 16, 190, "#6a351f");
}

export function drawTempleGate(landmark) {
  drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#d7b465", "#151515", 4);
  ctx.fillStyle = "#9f3e35";
  ctx.fillRect(landmark.x - 8, landmark.y - 10, landmark.width + 16, 16);
  ctx.fillStyle = "#61402a";
  ctx.fillRect(landmark.x + 18, landmark.y + 25, 28, 49);
  ctx.fillRect(landmark.x + landmark.width - 46, landmark.y + 25, 28, 49);
  ctx.fillRect(landmark.x + landmark.width / 2 - 20, landmark.y + 18, 40, 56);
  ctx.fillStyle = "#2f7d4c";
  ctx.fillRect(landmark.x + 62, landmark.y + 28, 20, 20);
  ctx.fillRect(landmark.x + landmark.width - 82, landmark.y + 28, 20, 20);
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 17, 205, "#6a351f");
}

export function drawLongBridge(landmark) {
  ctx.fillStyle = "#9c463e";
  ctx.fillRect(landmark.x, landmark.y + 25, landmark.width, 8);
  ctx.fillRect(landmark.x, landmark.y + 62, landmark.width, 8);
  ctx.strokeStyle = "#d76a5f";
  ctx.lineWidth = 4;
  for (let x = landmark.x + 8; x < landmark.x + landmark.width - 24; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, landmark.y + 64);
    ctx.lineTo(x + 20, landmark.y + 28);
    ctx.lineTo(x + 40, landmark.y + 64);
    ctx.stroke();
  }
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 12, 155, "#6f2b26");
}

export function drawMarket(landmark) {
  drawPixelRect(landmark.x, landmark.y + 14, landmark.width, landmark.height - 14, "#f0c46b", "#151515", 4);
  ctx.fillStyle = "#c73c35";
  ctx.fillRect(landmark.x - 8, landmark.y, landmark.width + 16, 22);
  ctx.fillStyle = "#fff1b0";
  for (let x = landmark.x + 20; x < landmark.x + landmark.width - 18; x += 42) {
    ctx.fillRect(x, landmark.y + 42, 24, 18);
  }
  ctx.fillStyle = "#402c25";
  ctx.fillRect(landmark.x + landmark.width / 2 - 20, landmark.y + 62, 40, 44);
  drawTextBadge(landmark.name, landmark.x + landmark.width / 2, landmark.y - 16, 150, "#6f2b26");
}
