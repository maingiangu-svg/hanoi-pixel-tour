import { FEMALE_BIKE_ANIMATIONS } from "../../assets/sprites/vehicle/female/female-bike-animations.js";

const spriteSources = {
  characterMale: new URL("../../assets/sprites/character_male.png", import.meta.url).href,
  characterFemale: new URL("../../assets/sprites/character_female.png", import.meta.url).href,
  vinfastBike: new URL("../../assets/sprites/vinfast-bike.png", import.meta.url).href,
  femaleBikeRideNoHelmet: resolvePageAsset(FEMALE_BIKE_ANIMATIONS.rideNoHelmet.src),
  femaleBikeRideHelmet: resolvePageAsset(FEMALE_BIKE_ANIMATIONS.rideHelmet.src),
  femaleBikeDismountNoHelmet: resolvePageAsset(FEMALE_BIKE_ANIMATIONS.dismountNoHelmet.src),
  femaleBikeDismountHelmet: resolvePageAsset(FEMALE_BIKE_ANIMATIONS.dismountHelmet.src)
};

const femaleBikeAssetIds = Object.freeze({
  rideNoHelmet: "femaleBikeRideNoHelmet",
  rideHelmet: "femaleBikeRideHelmet",
  dismountNoHelmet: "femaleBikeDismountNoHelmet",
  dismountHelmet: "femaleBikeDismountHelmet"
});

const spriteAssets = Object.fromEntries(
  Object.entries(spriteSources).map(([id, src]) => [id, createSpriteAsset(id, src)])
);

export function preloadSpriteAssets() {
  Object.values(spriteAssets).forEach(loadSpriteAsset);
}

export function getCharacterSprite(gender) {
  return getSpriteAsset(gender === "female" ? "characterFemale" : "characterMale");
}

export function getVinfastBikeSprite() {
  return getSpriteAsset("vinfastBike");
}

export function getFemaleBikeAnimationSprite(animationId) {
  return getSpriteAsset(femaleBikeAssetIds[animationId]);
}

export function isSpriteReady(asset) {
  return Boolean(asset && asset.status === "ready" && asset.drawable);
}

function getSpriteAsset(id) {
  const asset = spriteAssets[id];
  if (asset) {
    loadSpriteAsset(asset);
  }
  return asset || null;
}

function createSpriteAsset(id, src) {
  return {
    id,
    src,
    status: "idle",
    image: null,
    drawable: null,
    width: 0,
    height: 0,
    removedWhiteBorder: false,
    preserveFrameGrid: id.startsWith("femaleBike")
  };
}

function loadSpriteAsset(asset) {
  if (!asset || asset.status !== "idle") {
    return;
  }

  if (typeof Image === "undefined") {
    asset.status = "error";
    return;
  }

  asset.status = "loading";
  const image = new Image();
  asset.image = image;

  image.addEventListener("load", () => {
    try {
      if (asset.preserveFrameGrid) {
        asset.drawable = image;
        asset.width = image.naturalWidth;
        asset.height = image.naturalHeight;
        asset.status = "ready";
        return;
      }
      const prepared = preparePixelSprite(image);
      asset.drawable = prepared.drawable;
      asset.width = prepared.width;
      asset.height = prepared.height;
      asset.removedWhiteBorder = prepared.removedWhiteBorder;
      asset.status = "ready";
    } catch (error) {
      asset.drawable = image;
      asset.width = image.naturalWidth;
      asset.height = image.naturalHeight;
      asset.status = "ready";
    }
  }, { once: true });

  image.addEventListener("error", () => {
    asset.status = "error";
    asset.drawable = null;
  }, { once: true });

  image.src = asset.src;
}

function resolvePageAsset(path) {
  if (typeof document !== "undefined" && typeof document.baseURI === "string" && document.baseURI) {
    return new URL(path, document.baseURI).href;
  }
  return new URL(`../../${path.replace(/^\.\//, "")}`, import.meta.url).href;
}

function preparePixelSprite(image) {
  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  sourceCtx.imageSmoothingEnabled = false;
  sourceCtx.drawImage(image, 0, 0);

  const imageData = sourceCtx.getImageData(0, 0, source.width, source.height);
  const removedWhiteBorder = clearConnectedWhiteBackground(imageData, source.width, source.height);
  const bounds = getOpaqueBounds(imageData, source.width, source.height);
  if (!bounds) {
    return {
      drawable: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      removedWhiteBorder: false
    };
  }

  sourceCtx.putImageData(imageData, 0, 0);
  const trimmed = document.createElement("canvas");
  trimmed.width = bounds.width;
  trimmed.height = bounds.height;
  const trimmedCtx = trimmed.getContext("2d");
  trimmedCtx.imageSmoothingEnabled = false;
  trimmedCtx.drawImage(
    source,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  );

  return {
    drawable: trimmed,
    width: bounds.width,
    height: bounds.height,
    removedWhiteBorder
  };
}

function clearConnectedWhiteBackground(imageData, width, height) {
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixelIndex = y * width + x;
    if (visited[pixelIndex] || !isEdgeWhitePixel(data, pixelIndex)) {
      return;
    }

    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;
    data[pixelIndex * 4 + 3] = 0;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  return tail > 0;
}

function isEdgeWhitePixel(data, pixelIndex) {
  const offset = pixelIndex * 4;
  return data[offset + 3] > 0 &&
    data[offset] >= 245 &&
    data[offset + 1] >= 245 &&
    data[offset + 2] >= 245;
}

function getOpaqueBounds(imageData, width, height) {
  const { data } = imageData;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 16) {
        continue;
      }
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return null;
  }

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1
  };
}
