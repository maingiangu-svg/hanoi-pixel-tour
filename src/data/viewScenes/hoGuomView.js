const skyline = [
  [-0.08, 0.1, 0.34, "flat", 0],
  [0.01, 0.08, 0.46, "awning", 1],
  [0.09, 0.12, 0.31, "tile", 2],
  [0.2, 0.07, 0.55, "antenna", 1],
  [0.27, 0.11, 0.39, "waterTank", 0],
  [0.37, 0.08, 0.48, "tile", 2],
  [0.45, 0.13, 0.35, "flat", 1],
  [0.57, 0.075, 0.58, "antenna", 0],
  [0.64, 0.12, 0.4, "awning", 2],
  [0.75, 0.09, 0.5, "waterTank", 1],
  [0.84, 0.13, 0.33, "tile", 0],
  [0.95, 0.075, 0.62, "antenna", 2],
  [1.02, 0.12, 0.41, "flat", 1]
];

const treeClusters = [
  [-0.06, 0.1, 0.84, 2],
  [0.04, 0.085, 1.02, 0],
  [0.13, 0.1, 0.91, 1],
  [0.25, 0.09, 1.08, 2],
  [0.36, 0.11, 0.96, 0],
  [0.5, 0.085, 1.12, 1],
  [0.6, 0.11, 0.9, 2],
  [0.73, 0.09, 1.04, 0],
  [0.83, 0.105, 0.95, 1],
  [0.96, 0.095, 1.1, 2],
  [1.06, 0.1, 0.88, 0]
];

const farShoreLights = [0.03, 0.11, 0.19, 0.29, 0.39, 0.47, 0.59, 0.68, 0.78, 0.89, 0.97];
const foregroundLamps = [0.06, 0.48, 0.94];

export const HO_GUOM_VIEW_SCENE = Object.freeze({
  overscan: 460,
  skyline: freezeRows(skyline),
  treeClusters: freezeRows(treeClusters),
  farShoreLights: Object.freeze(farShoreLights),
  foregroundLamps: Object.freeze(foregroundLamps),
  colors: Object.freeze({
    daySky: Object.freeze(["#b9d9df", "#8fc4d2", "#72a8b7", "#d8d2a5"]),
    sunsetSky: Object.freeze(["#ef7b2d", "#f49c34", "#f8c35a", "#d98348"]),
    nightSky: Object.freeze(["#101d38", "#172e51", "#245171", "#3b6878"]),
    cloudySky: Object.freeze(["#65747e", "#788791", "#8d989d", "#788c8d"]),
    dayWater: Object.freeze(["#4c7778", "#3d696c", "#31595f", "#294c55"]),
    sunsetWater: Object.freeze(["#596c5b", "#455d54", "#374f4d", "#293f44"]),
    nightWater: Object.freeze(["#173747", "#143141", "#102a3a", "#0d2434"]),
    rainWater: Object.freeze(["#334d58", "#293f4b", "#223641", "#1b2d39"])
  })
});

function freezeRows(rows) {
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}
