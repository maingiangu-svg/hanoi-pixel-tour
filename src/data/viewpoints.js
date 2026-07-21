import { photoSpotsById } from "./photoSpots.js";

const DEFAULT_FOV = 68;
const DEFAULT_YAW_LIMIT = 44;
const DEFAULT_PITCH_LIMIT = 12;

const definitions = [
  viewpoint("view-ho-guom", "photo-ho-guom", "lake", "shore", ["skyline", "lake", "turtleTower", "promenade"], "Đứng đây nhìn hồ đẹp thật.", { label: "Hồ Gươm" }),
  viewpoint("view-thap-rua", "photo-thap-rua", "lake", "tower", ["skyline", "lake", "turtleTower", "reflections"], "Tháp Rùa giữa mặt hồ trông thật yên bình.", { label: "Tháp Rùa" }),
  viewpoint("view-cau-the-huc", "photo-cau-the-huc", "lake", "redBridge", ["lake", "redBridge", "templeIsland", "promenade"], "Cầu đỏ nổi bật hẳn giữa màu nước hồ.", { label: "Cầu Thê Húc" }),
  viewpoint("view-nha-tho-lon", "photo-nha-tho-lon", "cathedral", "facade", ["oldQuarter", "cathedral", "forecourt", "churchgoers"], "Buổi tối ở đây lúc nào cũng có người ghé qua."),
  viewpoint("view-ba-dinh", "photo-quang-truong-ba-dinh", "baDinh", "square", ["sky", "mausoleum", "flagRows", "square"], "Quảng trường rộng và trang nghiêm quá."),
  viewpoint("view-lang-bac", "photo-lang-bac", "baDinh", "mausoleum", ["treeLine", "mausoleum", "plannedLawns", "forecourt"], "Đứng gần mới thấy công trình thật vững chãi."),
  viewpoint("view-van-mieu", "photo-cong-van-mieu", "temple", "gate", ["oldTrees", "brickWalls", "templeGate", "courtyard"], "Không gian ở đây khiến người ta tự nhiên nói khẽ lại."),
  viewpoint("view-khue-van-cac", "photo-khue-van-cac", "temple", "khueVan", ["oldTrees", "brickCourtyard", "khueVanPavilion", "visitors"], "Khuê Văn Các nhìn từ sân đẹp và cân đối thật."),
  viewpoint("view-cau-long-bien", "photo-cau-long-bien", "longBien", "bridge", ["riverSkyline", "steelTruss", "railway", "bridgeDeck"], "Gió trên cầu mạnh ghê."),
  viewpoint("view-song-hong", "photo-song-hong", "longBien", "river", ["farBank", "river", "bridgeSilhouette", "railing"], "Từ đây mới thấy Sông Hồng rộng đến thế nào."),
];

export const viewpoints = Object.freeze(definitions.map(freezeViewpoint));

export const viewpointsById = Object.freeze(Object.fromEntries(
  viewpoints.map((entry) => [entry.id, entry])
));

export function getViewpointById(viewpointId) {
  return viewpointsById[viewpointId] || null;
}

export function getViewpointsForMap(mapId) {
  return viewpoints.filter((entry) => entry.mapId === mapId);
}

function viewpoint(id, photoSpotId, sceneType, variant, panoramaLayers, companionLine, options = {}) {
  const spot = photoSpotsById[photoSpotId];
  if (!spot) throw new Error(`Viewpoint ${id} thiếu photo spot ${photoSpotId}.`);
  return {
    id,
    type: "viewpoint",
    mapId: spot.mapId,
    landmarkId: spot.landmarkId,
    photoSpotId,
    position: { x: spot.x, y: spot.y },
    direction: spot.requiredFacing,
    interactionRadius: spot.radius,
    fov: options.fov || DEFAULT_FOV,
    yawLimit: options.yawLimit || DEFAULT_YAW_LIMIT,
    pitchLimit: options.pitchLimit || DEFAULT_PITCH_LIMIT,
    sceneType,
    variant,
    panoramaLayers,
    label: options.label || spot.title,
    companionLine,
    sheltered: Boolean(options.sheltered)
  };
}

function freezeViewpoint(entry) {
  return Object.freeze({
    ...entry,
    position: Object.freeze({ ...entry.position }),
    panoramaLayers: Object.freeze([...entry.panoramaLayers])
  });
}
