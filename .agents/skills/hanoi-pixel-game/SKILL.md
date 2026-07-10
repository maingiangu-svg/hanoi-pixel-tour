---
name: hanoi-pixel-game
description: Maintain, refactor, polish, and extend the Hà Nội Pixel Tour vanilla HTML/CSS/JavaScript Canvas 2D top-down pixel game. Use when working on world maps, camera, collisions, interaction points, render layers, sprite animation, pixel-art procedural rendering, requestAnimationFrame performance, or any gameplay-preserving upgrade to this Hanoi urban exploration game.
---

# Hà Nội Pixel Game

## Core Scope

Work only within the existing vanilla HTML, CSS, and JavaScript Canvas 2D architecture.

- Use HTML5 Canvas 2D for game rendering.
- Use DOM/CSS only for HUD, panels, modals, inventory, quest, journal, and dialogue overlays.
- Do not introduce Phaser, PixiJS, Three.js, WebGL, multiplayer, backend services, external assets, package managers, build tools, or new frameworks.
- Preserve the current gameplay contract: movement, collision, map transitions, landmarks, shops, NPCs, quiz, money, inventory, quest, journal, localStorage, keyboard controls, and victory/reset flows.

## Required Workflow

1. Read the full relevant code path before editing. For map or engine changes, inspect `src/main.js`, `src/state.js`, `src/input.js`, `src/camera.js`, `src/utils/collision.js`, `src/systems/interaction.js`, map data, renderers, and affected systems.
2. Identify existing state/data flow before moving logic. Prefer small edits that fit the current modules.
3. Keep data in map/data modules and generic behavior in systems/render/utils modules.
4. Do not hard-code one-off coordinates inside render or interaction logic when the map data can own them.
5. After each large change, run syntax/runtime checks and fix console errors before continuing.

## Hanoi Urban Design Rules

Make the game feel like walking through Hanoi, not a generic RPG field.

- Prioritize streets, sidewalks, plazas, paved courtyards, lake paths, bridges, market lanes, house fronts, gates, walls, and urban edges.
- Use trees as accents along lakes, streets, squares, and courtyards; do not fill empty space with forests.
- Do not turn breathing room into grassland, countryside, fantasy terrain, dirt roads, farms, mountains, or random modern towers.
- Use Hanoi cues: tube houses, balconies, yellow walls, green doors, red signs, Vietnamese shop signs, motorbikes, power poles, street lamps, benches, lake railings, temple gates, bridge steel, flags where appropriate.
- Landmark silhouettes must be distinct: Lăng Bác, Chùa Một Cột, Cầu Long Biên, Hồ Gươm, Cầu Thê Húc, Văn Miếu/Khuê Văn Các, Chợ Đồng Xuân.

## World Coordinates And Camera

Treat maps as worlds larger than the canvas viewport.

- Store player, landmarks, NPCs, shops, exits, collision, decorations, and interaction points in world coordinates.
- Keep the camera as viewport state with `x`, `y`, `width`, and `height`.
- Follow the player smoothly but clamp the camera to map bounds.
- Render world objects through camera translation or `worldToScreen`; render HUD/modal UI outside camera transforms.
- Never mix screen coordinates into collision or interaction calculations.

## Movement And Collision

Use simple, stable 2D collision suited to top-down Canvas.

- Prefer AABB rectangles and player feet hitboxes for buildings, walls, water, landmarks, shops, and map edges.
- Resolve X and Y movement separately when needed to reduce corner sticking.
- Make walkable zones explicit: roads, sidewalks, plazas, courtyards, bridges, paths.
- Do not collide with tiny decorative decals, labels, shadows, lamps, small props, or purely visual texture.
- Ensure every spawn, exit destination, and interaction point has a reachable standing position.

## Interaction Points

Use explicit points for precise interaction instead of large landmark boxes.

- Define interaction points in map data near gates, signs, entrances, bridge heads, lake railings, or reachable check-in spots.
- Calculate proximity from player center to point with `Math.hypot`.
- Use separate ranges: a larger visible/discovery range for the marker, and a smaller interaction range for prompt/E.
- If several targets are near, choose the nearest valid target and show one prompt only.
- Keep rewards idempotent: reopening a landmark or quiz must not grant duplicate money, stamps, foods, or souvenirs.

## Rendering Layers

Render in a predictable top-down order.

1. Background and ground texture.
2. Water and terrain surfaces.
3. Roads, sidewalks, plazas, courtyards, paths, bridges.
4. Back decorations and shadows.
5. Buildings and landmarks.
6. Shops, exits, interaction points, NPCs.
7. Highlights, player, and front details that must appear above the player.
8. HUD and modal DOM overlays outside the camera transform.

Use pixel-friendly primitives: `fillRect`, `strokeRect`, short lines, stepped silhouettes, hard shadows, limited palettes, and `ctx.imageSmoothingEnabled = false`.

## Procedural Pixel Map Detail

Generate tile-like detail with lightweight loops and reusable helpers.

- Use repeated small rectangles for pavers, windows, railings, lane markings, water shimmer, roof tiles, banners, and bridge trusses.
- Keep texture subtle enough that roads, walk zones, and landmarks remain readable.
- Prefer data-driven decoration arrays and helper functions over repeated drawing code.
- Avoid per-frame creation of large arrays/objects in hot render paths.

## Sprite Animation

For the player and simple NPCs, animate with Canvas primitives.

- Keep four-direction facing state based on movement.
- Use a small frame/step counter for walking legs, backpack, cap/hair, and idle pose.
- Keep the player visible above map surfaces and below modal/HUD overlays.
- Avoid smooth circular anatomy that breaks the pixel-art style.

## Culling And Performance

Keep `requestAnimationFrame` smooth.

- Use one main loop that processes input, updates state, updates camera, renders, and schedules the next frame.
- Keep frame work under the 60 FPS budget where practical.
- Skip drawing objects outside the viewport plus a small margin.
- Reuse helpers and existing arrays; avoid unnecessary allocation in every frame.
- Do not run expensive save, DOM rebuild, modal render, or localStorage work every frame.
- Use direct Canvas drawing for world visuals and DOM only for UI overlays.

## Validation Checklist

Before finishing a game/map change:

- Run `node --check` over JavaScript modules.
- Load the game through Live Server or a local static server.
- Check the browser console for `ReferenceError`, import/export failures, and runtime errors.
- Smoke test movement, camera follow, collisions, map exits, landmark info, interaction points, shops, NPCs, quiz keyboard/click controls, inventory, quest log, journal, save/load, and reset confirmation.
- Verify old localStorage data does not strand the player inside collision.
- Verify map spacing still feels urban, explorable, and distinctly Hanoi.
