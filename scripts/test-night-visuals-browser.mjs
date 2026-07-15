#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4174/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9600 + (process.pid % 250);
const outputDir = "/tmp/hanoi-night-visuals";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-night-visuals-${process.pid}`, baseUrl
], { stdio: ["ignore", "ignore", "pipe"], start_new_session: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const errors = [];
chrome.stderr.on("data", (chunk) => {
  const message = chunk.toString("utf8");
  if (/uncaught|syntaxerror|referenceerror|typeerror/i.test(message)) errors.push(message.trim());
});

let socket;
let requestId = 0;
const pending = new Map();

async function connect() {
  let target;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      target = targets.find((entry) => entry.type === "page");
      if (target) break;
    } catch {}
    await delay(100);
  }
  assert(target, "Chrome DevTools target was not available");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(message.error.message));
      else callback.resolve(message.result || {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "Runtime exception");
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") errors.push(message.params.entry.text);
  });
}

function send(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Runtime evaluation failed");
  return response.result.value;
}

async function setScene(mapId, x, y) {
  await evaluate(`(async () => {
    const { state, player } = await import("./src/state.js");
    const { snapCameraToPlayer } = await import("./src/camera.js");
    const { closeAllOverlays } = await import("./src/systems/modal.js");
    const { setWeatherForDebug } = await import("./src/systems/weather.js");
    state.profile.gender = "female";
    state.currentMapId = ${JSON.stringify(mapId)};
    state.gameTime.day = 1;
    state.gameTime.hour = 20;
    state.gameTime.minute = 30;
    state.gameTime.totalGameMinutes = 1230;
    player.x = ${x}; player.y = ${y};
    state.player.x = ${x}; state.player.y = ${y};
    setWeatherForDebug("clear");
    closeAllOverlays();
    document.getElementById("characterModal").classList.add("hidden");
    snapCameraToPlayer();
  })()`);
  await delay(500);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(500);

  await setScene("hoanKiem", 1650, 1120);
  const lake = await screenshot("01-hoan-kiem-lake-night");
  await setScene("hoanKiem", 690, 700);
  const oldQuarter = await screenshot("02-hoan-kiem-street-night");
  await setScene("hoanKiem", 600, 250);
  const skyline = await screenshot("02b-hoan-kiem-skyline-night");
  await setScene("hoanKiem", 2480, 800);
  const cathedral = await screenshot("02c-cathedral-night");
  await setScene("baDinh", 980, 720);
  const baDinh = await screenshot("03-ba-dinh-night");
  await setScene("longBien", 1520, 640);
  const longBien = await screenshot("04-long-bien-night");

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({ lake, oldQuarter, skyline, cathedral, baDinh, longBien }, null, 2)}\n`);
  process.stdout.write("Night visual browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
