#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const [, , inputArg, outputArg, fpsArg = "12"] = process.argv;
if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/extract-video-frames.mjs <input.mp4> <output-dir> [fps]");
  process.exit(2);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const targetFPS = Number(fpsArg);
if (!Number.isFinite(targetFPS) || targetFPS <= 0) {
  console.error("FPS must be a positive number.");
  process.exit(2);
}

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);
const chromePath = chromeCandidates[0];
mkdirSync(outputPath, { recursive: true });

const page = `<!doctype html>
<meta charset="utf-8">
<video id="video" muted playsinline></video>
<canvas id="canvas"></canvas>
<script type="module">
const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const fps = ${JSON.stringify(targetFPS)};
const wait = (type) => new Promise((resolve, reject) => {
  const onError = () => reject(video.error || new Error("Video decode failed"));
  video.addEventListener(type, resolve, { once: true });
  video.addEventListener("error", onError, { once: true });
});
const post = async (path, body = new Uint8Array()) => {
  const response = await fetch(path, { method: "POST", body });
  if (!response.ok) throw new Error(await response.text());
};

try {
  video.src = "/video${extname(inputPath)}";
  await wait("loadedmetadata");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d", { alpha: true });
  context.imageSmoothingEnabled = false;
  const frameCount = Math.max(1, Math.ceil(video.duration * fps));
  for (let index = 0; index < frameCount; index += 1) {
    const target = Math.min(index / fps, Math.max(0, video.duration - 0.0001));
    if (Math.abs(video.currentTime - target) > 0.00001 || index > 0) {
      video.currentTime = target;
      await wait("seeked");
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    await post("/frame?index=" + index, await blob.arrayBuffer());
  }
  await post("/done", JSON.stringify({
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    frameCount,
    fps,
  }));
} catch (error) {
  await post("/failed", String(error && error.stack || error));
}
</script>`;

let chrome;
let settled = false;
let timeoutHandle = null;
const finish = (error, metadata) => {
  if (settled) return;
  settled = true;
  if (timeoutHandle) clearTimeout(timeoutHandle);
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  server.close();
  if (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(`${inputPath}: ${metadata.width}x${metadata.height}, ${metadata.duration.toFixed(3)}s, wrote ${metadata.frameCount} frames at ${metadata.fps} fps`);
};

const readBody = (request) => new Promise((resolveBody, rejectBody) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => resolveBody(Buffer.concat(chunks)));
  request.on("error", rejectBody);
});

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (request.method === "GET" && url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page);
    return;
  }
  if (request.method === "GET" && url.pathname.startsWith("/video")) {
    const size = statSync(inputPath).size;
    const range = request.headers.range;
    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      const start = match ? Number(match[1]) : 0;
      const end = match && match[2] ? Number(match[2]) : size - 1;
      response.writeHead(206, {
        "content-type": "video/mp4",
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${size}`,
        "content-length": end - start + 1,
      });
      createReadStream(inputPath, { start, end }).pipe(response);
      return;
    }
    response.writeHead(200, {
      "content-type": "video/mp4",
      "accept-ranges": "bytes",
      "content-length": size,
    });
    createReadStream(inputPath).pipe(response);
    return;
  }
  if (request.method === "POST" && url.pathname === "/frame") {
    const index = Number(url.searchParams.get("index"));
    const body = await readBody(request);
    writeFileSync(`${outputPath}/frame-${String(index).padStart(4, "0")}.png`, body);
    response.end("ok");
    return;
  }
  if (request.method === "POST" && url.pathname === "/done") {
    const metadata = JSON.parse((await readBody(request)).toString("utf8"));
    response.end("ok");
    setTimeout(() => finish(null, metadata), 50);
    return;
  }
  if (request.method === "POST" && url.pathname === "/failed") {
    const message = (await readBody(request)).toString("utf8");
    response.end("ok");
    setTimeout(() => finish(message), 50);
    return;
  }
  response.writeHead(404);
  response.end("not found");
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  const profilePath = `/tmp/hanoi-rider-chrome-${process.pid}`;
  chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--hide-scrollbars",
    `--user-data-dir=${profilePath}`,
    `http://127.0.0.1:${address.port}/`,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    if (/ERROR|FATAL/i.test(text) && !/cloud_management_controller/i.test(text)) {
      process.stderr.write(text);
    }
  });
  chrome.on("exit", (code) => {
    if (!settled && code !== 0) finish(`Chrome exited before extraction completed (code ${code}).`);
  });
});

timeoutHandle = setTimeout(() => finish("Timed out while extracting video frames."), 120000);
