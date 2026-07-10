import { camera, isRectVisible } from "../camera.js";
import { ctx } from "../state.js";
import { drawPixelRect } from "./renderUI.js";

export function drawChurchInterior(map) {
  const church = map.church;
  drawChurchFloor(map);
  drawSideWalls(map);
  drawSanctuary(church);
  drawStainedGlass(church);
  drawChurchColumns(church);
  drawPews(church);
  drawEntrance(church);
}

function drawChurchFloor(map) {
  ctx.fillStyle = "#443b36";
  ctx.fillRect(0, 0, map.width, map.height);
  drawPixelRect(54, 50, map.width - 108, 870, "#bda98b", "#231d1a", 4);

  const minX = Math.max(60, Math.floor(camera.x / 28) * 28);
  const maxX = Math.min(map.width - 60, camera.x + camera.width + 28);
  const minY = Math.max(56, Math.floor(camera.y / 24) * 24);
  const maxY = Math.min(914, camera.y + camera.height + 24);
  ctx.fillStyle = "rgba(85, 63, 47, 0.22)";
  for (let y = minY; y < maxY; y += 24) {
    for (let x = minX; x < maxX; x += 28) {
      ctx.fillRect(x + ((Math.floor(y / 24) % 2) * 12), y, 12, 3);
    }
  }

  ctx.fillStyle = "#a84f42";
  ctx.fillRect(map.church.aisle.x, map.church.aisle.y, map.church.aisle.width, map.church.aisle.height);
  ctx.fillStyle = "#d88572";
  for (let y = map.church.aisle.y + 14; y < map.church.aisle.y + map.church.aisle.height - 8; y += 38) {
    ctx.fillRect(map.church.aisle.x + 18, y, map.church.aisle.width - 36, 4);
  }
}

function drawSideWalls(map) {
  ctx.fillStyle = "#6c5b4d";
  ctx.fillRect(54, 50, 52, 870);
  ctx.fillRect(map.width - 106, 50, 52, 870);
  ctx.fillStyle = "#3a302a";
  ctx.fillRect(54, 50, map.width - 108, 18);
  ctx.fillRect(54, 900, 566, 20);
  ctx.fillRect(780, 900, 566, 20);
}

function drawSanctuary(church) {
  const sanctuary = church.sanctuary;
  drawPixelRect(sanctuary.x, sanctuary.y, sanctuary.width, sanctuary.height, "#6b4a36", "#231d1a", 4);
  ctx.fillStyle = "#936a46";
  ctx.fillRect(sanctuary.x + 20, sanctuary.y + sanctuary.height - 22, sanctuary.width - 40, 12);
  ctx.fillStyle = "#d8c776";
  ctx.fillRect(sanctuary.x + 72, sanctuary.y + 40, sanctuary.width - 144, 7);

  const altar = church.altar;
  drawPixelRect(altar.x, altar.y, altar.width, altar.height, "#e2d4b3", "#2a241f", 4);
  ctx.fillStyle = "#fff3c4";
  ctx.fillRect(altar.x + 22, altar.y + 18, altar.width - 44, 20);
  ctx.fillStyle = "#b4493f";
  ctx.fillRect(altar.x + altar.width / 2 - 18, altar.y + 38, 36, 38);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(altar.x + altar.width / 2 - 4, altar.y + 44, 8, 26);
  ctx.fillRect(altar.x + altar.width / 2 - 12, altar.y + 53, 24, 8);

  drawCandle(altar.x + 42, altar.y + 42);
  drawCandle(altar.x + altar.width - 52, altar.y + 42);
}

function drawCandle(x, y) {
  const flicker = Math.floor((performance.now() / 240 + x) % 2);
  ctx.fillStyle = "#f7e08a";
  ctx.fillRect(x, y, 7, 20);
  ctx.fillStyle = flicker ? "#fff8d6" : "#f2bd45";
  ctx.fillRect(x + 1, y - 8, 5, 8);
}

function drawStainedGlass(church) {
  church.windows.forEach((window) => {
    const rect = { x: window.x - 6, y: window.y - 10, width: 34, height: 68 };
    if (!isRectVisible(rect, 40)) {
      return;
    }
    ctx.fillStyle = "#251f1b";
    ctx.fillRect(window.x - 3, window.y, 28, 52);
    ctx.fillStyle = "#315f8f";
    ctx.fillRect(window.x, window.y + 8, 22, 40);
    ctx.fillStyle = "#d8484f";
    ctx.fillRect(window.x + 4, window.y + 14, 14, 10);
    ctx.fillStyle = "#f2bd45";
    ctx.fillRect(window.x + 4, window.y + 30, 14, 10);
    ctx.fillStyle = "#f4f0d8";
    ctx.fillRect(window.x + 8, window.y + 4, 6, 8);
  });
}

function drawChurchColumns(church) {
  church.columns.forEach((column) => {
    if (!isRectVisible({ x: column.x - 10, y: column.y, width: 30, height: 42 }, 40)) {
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(column.x + 4, column.y + 4, 20, 36);
    drawPixelRect(column.x - 8, column.y, 24, 34, "#d5c5a5", "#302823", 3);
    ctx.fillStyle = "#f0e5c9";
    ctx.fillRect(column.x - 4, column.y + 4, 8, 24);
  });
}

function drawPews(church) {
  church.pews.forEach((pew) => {
    if (!isRectVisible(pew, 50)) {
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(pew.x + 5, pew.y + 8, pew.width, pew.height);
    drawPixelRect(pew.x, pew.y, pew.width, pew.height, "#74452d", "#2a1d18", 3);
    ctx.fillStyle = "#b98251";
    ctx.fillRect(pew.x + 10, pew.y + 6, pew.width - 20, 6);
    for (let x = pew.x + 18; x < pew.x + pew.width - 12; x += 40) {
      ctx.fillStyle = "#3d2b20";
      ctx.fillRect(x, pew.y + 18, 6, 12);
    }
  });
}

function drawEntrance(church) {
  const door = church.interiorDoor;
  ctx.fillStyle = "#2a211d";
  ctx.fillRect(door.x - 16, door.y - 12, door.width + 32, 42);
  ctx.fillStyle = "#594335";
  ctx.fillRect(door.x, door.y - 6, door.width, 34);
  ctx.fillStyle = "#bda98b";
  ctx.fillRect(door.x + door.width / 2 - 3, door.y - 6, 6, 34);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(door.x + 12, door.y + 10, 5, 5);
  ctx.fillRect(door.x + door.width - 17, door.y + 10, 5, 5);
}
