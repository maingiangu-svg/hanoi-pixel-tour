const DEFAULT_RADIUS = 58;
const DEFAULT_VISIBLE_RANGE = 230;

export const photoSpots = Object.freeze([
  createSpot({
    id: "photo-ho-guom",
    mapId: "hoanKiem",
    landmarkId: "hoGuom",
    title: "Hồ Gươm từ lối đi ven hồ",
    x: 1226,
    y: 1020,
    requiredFacing: "right",
    targetBounds: { x: 1360, y: 700, width: 520, height: 360 },
    preview: "lake",
    glyph: "HG"
  }),
  createSpot({
    id: "photo-thap-rua",
    mapId: "hoanKiem",
    landmarkId: "hoGuom",
    title: "Tháp Rùa giữa Hồ Gươm",
    x: 1226,
    y: 700,
    requiredFacing: "right",
    targetBounds: { x: 1610, y: 650, width: 92, height: 96 },
    preview: "tower",
    glyph: "TR"
  }),
  createSpot({
    id: "photo-cau-the-huc",
    mapId: "hoanKiem",
    landmarkId: "cauTheHuc",
    title: "Cầu Thê Húc bên bờ hồ",
    x: 1858,
    y: 718,
    requiredFacing: "right",
    targetBounds: { x: 1848, y: 676, width: 292, height: 80 },
    preview: "bridge-red",
    glyph: "TH"
  }),
  createSpot({
    id: "photo-pho-co",
    mapId: "hoanKiem",
    landmarkId: "phoCo",
    title: "Một góc Phố Cổ Hà Nội",
    x: 878,
    y: 620,
    requiredFacing: "up",
    targetBounds: { x: 560, y: 250, width: 520, height: 340 },
    preview: "old-quarter",
    glyph: "PC"
  }),
  createSpot({
    id: "photo-nha-tho-lon",
    mapId: "hoanKiem",
    landmarkId: "nhaThoLon",
    title: "Nhà thờ Lớn từ sân trước",
    x: 2483,
    y: 792,
    requiredFacing: "up",
    targetBounds: { x: 2348, y: 536, width: 270, height: 254 },
    preview: "cathedral",
    glyph: "NT"
  }),
  createSpot({
    id: "photo-nha-tho-noi-that",
    mapId: "churchInterior",
    landmarkId: "nhaThoLon",
    title: "Gian chính Nhà thờ Lớn",
    x: 700,
    y: 720,
    requiredFacing: "up",
    targetBounds: { x: 430, y: 240, width: 540, height: 400 },
    preview: "church-interior",
    glyph: "NT"
  }),
  createSpot({
    id: "photo-lang-bac",
    mapId: "baDinh",
    landmarkId: "langBac",
    title: "Lăng Bác từ quảng trường",
    x: 1145,
    y: 462,
    requiredFacing: "up",
    targetBounds: { x: 896, y: 238, width: 498, height: 220 },
    preview: "mausoleum",
    glyph: "LB"
  }),
  createSpot({
    id: "photo-quang-truong-ba-dinh",
    mapId: "baDinh",
    landmarkId: "quangTruongBaDinh",
    title: "Quảng trường Ba Đình",
    x: 760,
    y: 748,
    requiredFacing: "up",
    targetBounds: { x: 720, y: 360, width: 600, height: 320 },
    preview: "plaza",
    glyph: "BĐ"
  }),
  createSpot({
    id: "photo-chua-mot-cot",
    mapId: "baDinh",
    landmarkId: "chuaMotCot",
    title: "Chùa Một Cột bên ao sen",
    x: 1718,
    y: 600,
    requiredFacing: "right",
    targetBounds: { x: 1760, y: 380, width: 250, height: 260 },
    preview: "pagoda",
    glyph: "MC"
  }),
  createSpot({
    id: "photo-cong-van-mieu",
    mapId: "baDinh",
    landmarkId: "vanMieu",
    title: "Cổng Văn Miếu",
    x: 1100,
    y: 1422,
    requiredFacing: "up",
    targetBounds: { x: 940, y: 1370, width: 320, height: 160 },
    preview: "temple-gate",
    glyph: "VM"
  }),
  createSpot({
    id: "photo-khue-van-cac",
    mapId: "baDinh",
    landmarkId: "vanMieu",
    title: "Khuê Văn Các",
    x: 1100,
    y: 1662,
    requiredFacing: "up",
    targetBounds: { x: 990, y: 1580, width: 230, height: 170 },
    preview: "khue-van",
    glyph: "KV"
  }),
  createSpot({
    id: "photo-bia-tien-si",
    mapId: "baDinh",
    landmarkId: "vanMieu",
    title: "Sân bia tiến sĩ",
    x: 1100,
    y: 1840,
    requiredFacing: "up",
    targetBounds: { x: 820, y: 1680, width: 560, height: 220 },
    preview: "steles",
    glyph: "BT"
  }),
  createSpot({
    id: "photo-cau-long-bien",
    mapId: "longBien",
    landmarkId: "cauLongBien",
    title: "Cầu Long Biên từ lối lên cầu",
    x: 1125,
    y: 610,
    requiredFacing: "right",
    targetBounds: { x: 1200, y: 470, width: 620, height: 270 },
    preview: "steel-bridge",
    glyph: "LB"
  }),
  createSpot({
    id: "photo-duong-ray-long-bien",
    mapId: "longBien",
    landmarkId: "cauLongBien",
    title: "Đường ray trên Cầu Long Biên",
    x: 1450,
    y: 686,
    requiredFacing: "right",
    targetBounds: { x: 1540, y: 548, width: 620, height: 190 },
    preview: "railway",
    glyph: "ĐR"
  }),
  createSpot({
    id: "photo-song-hong",
    mapId: "longBien",
    landmarkId: "songHong",
    title: "Sông Hồng nhìn từ Long Biên",
    x: 1690,
    y: 610,
    requiredFacing: "right",
    targetBounds: { x: 1800, y: 420, width: 560, height: 500 },
    preview: "river",
    glyph: "SH"
  })
]);

export const photoSpotsById = Object.freeze(Object.fromEntries(
  photoSpots.map((spot) => [spot.id, spot])
));

const photoSpotsByMap = Object.freeze(Object.fromEntries(
  ["hoanKiem", "churchInterior", "baDinh", "longBien"].map((mapId) => [
    mapId,
    Object.freeze(photoSpots.filter((spot) => spot.mapId === mapId))
  ])
));

export function getPhotoSpotsForMap(mapId) {
  return photoSpotsByMap[mapId] || [];
}

function createSpot(config) {
  return Object.freeze({
    radius: DEFAULT_RADIUS,
    visibleRange: DEFAULT_VISIBLE_RANGE,
    ...config,
    targetBounds: Object.freeze({ ...config.targetBounds })
  });
}
