#!/usr/bin/env python3
"""Build transparent female rider spritesheets from the hand-drawn MP4 sources."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ANIMATIONS = {
    "rideNoHelmet": {
        "source": "rider.mp4",
        "output": "female-bike-ride.png",
        "fps": 12,
        "idleFrame": 0,
        "loop": True,
        "cropGroup": "base",
        "state": "ride",
        "helmet": False,
        "sourceFacing": "left",
    },
    "dismountNoHelmet": {
        "source": "rider1.mp4",
        "output": "female-bike-dismount.png",
        "fps": 12,
        "idleFrame": 0,
        "loop": False,
        "cropGroup": "base",
        "state": "dismount",
        "helmet": False,
        "sourceFacing": "left",
    },
    "rideHelmet": {
        "source": "rider2.mp4",
        "output": "female-bike-ride-helmet.png",
        "fps": 12,
        "idleFrame": 0,
        "loop": True,
        "cropGroup": "base",
        "state": "ride",
        "helmet": True,
        "sourceFacing": "left",
    },
    "dismountHelmet": {
        "source": "rider4.mp4",
        "output": "female-bike-dismount-helmet.png",
        "fps": 12,
        "idleFrame": 0,
        "loop": False,
        "frameStride": 2,
        "cropGroup": "helmetTransition",
        "state": "dismount",
        "helmet": True,
        "sourceFacing": "left",
    },
}

MAGENTA = (255, 0, 255)
OUTPUT_MAX_DIMENSION = 160
PADDING = 5


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-extract", action="store_true", help="Reuse frame PNGs from --frames-dir")
    parser.add_argument("--frames-dir", type=Path, default=None)
    parser.add_argument("--node", default=os.environ.get("NODE", "node"))
    return parser.parse_args()


def is_black_leader(image: Image.Image) -> bool:
    pixels = np.asarray(image.convert("RGB"), dtype=np.uint8)
    return float(pixels.mean()) < 18 and float(pixels.max()) < 45


def remove_background_and_marks(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    draw = ImageDraw.Draw(rgb)

    # ibisPaint sits in the lower-right; speed streaks sit beyond the bike body.
    draw.rectangle((int(width * 0.58), int(height * 0.84), width, height), fill="white")
    draw.rectangle((int(width * 0.80), 0, width, height), fill="white")

    for seed in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
        ImageDraw.floodfill(rgb, seed, MAGENTA, thresh=42)

    pixels = np.asarray(rgb, dtype=np.uint8)
    background = np.all(pixels == MAGENTA, axis=2)
    rgba = np.dstack((pixels, np.where(background, 0, 255).astype(np.uint8)))

    # Remove pale codec fringe connected to already transparent pixels.
    for _ in range(2):
        transparent = rgba[:, :, 3] == 0
        neighbors = np.zeros_like(transparent)
        neighbors[1:, :] |= transparent[:-1, :]
        neighbors[:-1, :] |= transparent[1:, :]
        neighbors[:, 1:] |= transparent[:, :-1]
        neighbors[:, :-1] |= transparent[:, 1:]
        pale = np.min(rgba[:, :, :3], axis=2) >= 225
        rgba[:, :, 3][neighbors & pale] = 0

    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba, mode="RGBA")


def opaque_bounds(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha > 0)
    if not len(xs):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def union_bounds(images: list[Image.Image]) -> tuple[int, int, int, int]:
    bounds = [opaque_bounds(image) for image in images]
    bounds = [value for value in bounds if value]
    if not bounds:
        raise RuntimeError("No opaque rider pixels found after background removal")
    width, height = images[0].size
    return (
        max(0, min(value[0] for value in bounds) - PADDING),
        max(0, min(value[1] for value in bounds) - PADDING),
        min(width, max(value[2] for value in bounds) + PADDING),
        min(height, max(value[3] for value in bounds) + PADDING),
    )


def extract_frames(repo: Path, frames_root: Path, node: str) -> None:
    extractor = repo / "scripts" / "extract-video-frames.mjs"
    sources = repo / "assets" / "source" / "rider"
    for name, config in ANIMATIONS.items():
        destination = frames_root / name
        destination.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [node, str(extractor), str(sources / config["source"]), str(destination), str(config["fps"])],
            cwd=repo,
            check=True,
            start_new_session=True,
        )


def load_processed_frames(frames_root: Path) -> dict[str, list[Image.Image]]:
    processed: dict[str, list[Image.Image]] = {}
    for name in ANIMATIONS:
        usable_paths = []
        for path in sorted((frames_root / name).glob("frame-*.png")):
            with Image.open(path) as source:
                if not is_black_leader(source):
                    usable_paths.append(path)
        frame_stride = max(1, int(ANIMATIONS[name].get("frameStride", 1)))
        frames = []
        for path in usable_paths[::frame_stride]:
            with Image.open(path) as source:
                frames.append(remove_background_and_marks(source))
        if not frames:
            raise RuntimeError(f"No usable frames extracted for {name}")
        processed[name] = frames
    return processed


def write_sheets(repo: Path, processed: dict[str, list[Image.Image]]) -> dict[str, dict]:
    output_dir = repo / "assets" / "sprites" / "vehicle" / "female"
    output_dir.mkdir(parents=True, exist_ok=True)
    group_crops = {}
    for name, frames in processed.items():
        group = ANIMATIONS[name].get("cropGroup", name)
        group_crops.setdefault(group, []).extend(frames)
    group_crops = {group: union_bounds(frames) for group, frames in group_crops.items()}
    metadata: dict[str, dict] = {}

    for name, frames in processed.items():
        group = ANIMATIONS[name].get("cropGroup", name)
        crop = group_crops[group]
        crop_width = crop[2] - crop[0]
        crop_height = crop[3] - crop[1]
        scale = min(1.0, OUTPUT_MAX_DIMENSION / max(crop_width, crop_height))
        cell_width = max(1, round(crop_width * scale))
        cell_height = max(1, round(crop_height * scale))
        sheet = Image.new("RGBA", (cell_width * len(frames), cell_height), (0, 0, 0, 0))
        for index, frame in enumerate(frames):
            cropped = frame.crop(crop)
            if cropped.size != (cell_width, cell_height):
                cropped = cropped.resize((cell_width, cell_height), Image.Resampling.NEAREST)
            sheet.alpha_composite(cropped, (index * cell_width, 0))
        config = ANIMATIONS[name]
        sheet.save(output_dir / config["output"], optimize=True)
        metadata[name] = {
            "src": f"./assets/sprites/vehicle/female/{config['output']}",
            "frameWidth": cell_width,
            "frameHeight": cell_height,
            "frameCount": len(frames),
            "fps": config["fps"],
            "idleFrame": min(config["idleFrame"], len(frames) - 1),
            "loop": config["loop"],
            "state": config["state"],
            "helmet": config["helmet"],
            "sourceFacing": config["sourceFacing"],
        }

    module = (
        "// Generated by scripts/build-female-bike-sprites.py.\n"
        "export const FEMALE_BIKE_ANIMATIONS = Object.freeze("
        + json.dumps(metadata, ensure_ascii=True, indent=2)
        + ");\n"
        "export const FEMALE_BIKE_TRANSITION_DURATION_MS = "
        "Math.round(FEMALE_BIKE_ANIMATIONS.dismountHelmet.frameCount / "
        "FEMALE_BIKE_ANIMATIONS.dismountHelmet.fps * 1000);\n"
    )
    (output_dir / "female-bike-animations.js").write_text(module, encoding="utf-8")
    return metadata


def main() -> None:
    args = parse_args()
    repo = Path(__file__).resolve().parents[1]
    temporary = None
    if args.frames_dir:
        frames_root = args.frames_dir.resolve()
    else:
        temporary = Path(tempfile.mkdtemp(prefix="hanoi-rider-frames-"))
        frames_root = temporary

    try:
        if not args.skip_extract:
            extract_frames(repo, frames_root, args.node)
        metadata = write_sheets(repo, load_processed_frames(frames_root))
        for name, config in metadata.items():
            print(f"{name}: {config['frameCount']} frames, {config['fps']} fps, {config['frameWidth']}x{config['frameHeight']}")
    finally:
        if temporary:
            shutil.rmtree(temporary, ignore_errors=True)


if __name__ == "__main__":
    main()
