import { canvas, ctx } from "../state.js";

const ASPECT_RATIO = canvas.width / canvas.height;
const FRAME_BORDER = 12;
let initialized = false;
let resizeFrame = null;

export function initCanvasLayout() {
  if (initialized) {
    return;
  }

  initialized = true;
  resizeGameLayout();
  window.addEventListener("resize", scheduleLayout);
}

export function resizeGameLayout() {
  const card = document.querySelector(".game-card");
  const frame = document.querySelector(".game-frame");
  const titleRow = document.querySelector(".title-row");
  if (!card || !frame || !titleRow) {
    return;
  }

  const compact = window.innerWidth <= 780;
  const pagePadding = compact ? 10 : 14;
  const availableWidth = Math.max(320, window.innerWidth - pagePadding * 2);

  card.style.width = `${availableWidth}px`;
  const titleHeight = titleRow.offsetHeight;
  const availableHeight = Math.max(240, window.innerHeight - titleHeight - pagePadding * 2 - 12);
  const contentWidth = Math.max(320, Math.floor(Math.min(availableWidth - FRAME_BORDER, availableHeight * ASPECT_RATIO)));
  const contentHeight = Math.max(200, Math.floor(contentWidth / ASPECT_RATIO));
  const outerWidth = contentWidth + FRAME_BORDER;
  const outerHeight = contentHeight + FRAME_BORDER;

  card.style.width = `${outerWidth}px`;
  frame.style.width = `${outerWidth}px`;
  frame.style.height = `${outerHeight}px`;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.imageSmoothingEnabled = false;
}

export function scheduleLayout() {
  if (resizeFrame !== null) {
    return;
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    resizeGameLayout();
  });
}

export function screenToFramePosition(point) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return point;
  }

  return {
    x: point.x * (rect.width / canvas.width),
    y: point.y * (rect.height / canvas.height)
  };
}
