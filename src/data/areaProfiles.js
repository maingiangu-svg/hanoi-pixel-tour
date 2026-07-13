const period = (start, end, value) => ({ start: Math.round(start * 60), end: Math.round(end * 60), value });

export const AREA_PROFILES = {
  hoanKiemOldQuarter: {
    id: "hoanKiemOldQuarter",
    label: "Hồ Gươm - Phố Cổ",
    crowdDensity: 1,
    trafficDensity: 0.9,
    pedestrianSpeed: 1,
    nightActivity: 0.72,
    rainActivityMultiplier: 0.46,
    ambientTypes: ["tourist", "photographer", "vendor", "couple", "jogger", "local"],
    densityByTime: [
      period(5, 7, 0.5), period(7, 9, 0.82), period(9, 16, 0.94),
      period(16, 21.5, 1.2), period(21.5, 24, 0.42), period(0, 5, 0.2)
    ],
    soundscape: { base: 0.24, traffic: 0.34, crowd: 0.32, nature: 0.12, landmark: 0.08 },
    soundSources: [
      { kind: "nature", x: 1680, y: 730, radius: 720, strength: 0.16 },
      { kind: "traffic", x: 620, y: 760, radius: 620, strength: 0.18 },
      { kind: "crowd", x: 760, y: 540, radius: 520, strength: 0.2 }
    ],
    visual: { birds: 3, leaves: 1, wind: 0.22, accent: "#e5b854" }
  },
  cathedralExterior: {
    id: "cathedralExterior",
    label: "Nhà thờ Lớn",
    crowdDensity: 0.76,
    trafficDensity: 0.28,
    pedestrianSpeed: 0.82,
    nightActivity: 0.78,
    rainActivityMultiplier: 0.55,
    ambientTypes: ["photographer", "parishioner", "couple", "friendGroup", "cafeGuest"],
    densityByTime: [
      period(5, 9, 0.34), period(9, 16, 0.68), period(16, 17.5, 0.86),
      period(17.5, 19.5, 1.3), period(19.5, 22.5, 0.82), period(22.5, 24, 0.2), period(0, 5, 0.08)
    ],
    soundscape: { base: 0.18, traffic: 0.14, crowd: 0.23, nature: 0.05, landmark: 0.2 },
    soundSources: [
      { kind: "landmark", x: 2478, y: 650, radius: 620, strength: 0.3 },
      { kind: "crowd", x: 2460, y: 900, radius: 430, strength: 0.18 }
    ],
    visual: { birds: 2, leaves: 0, wind: 0.12, accent: "#d8c49c" }
  },
  baDinhCeremonial: {
    id: "baDinhCeremonial",
    label: "Ba Đình",
    crowdDensity: 0.44,
    trafficDensity: 0.24,
    pedestrianSpeed: 0.7,
    nightActivity: 0.16,
    rainActivityMultiplier: 0.38,
    ambientTypes: ["visitor", "guide", "guard", "slowWalker"],
    densityByTime: [
      period(5, 7, 0.42), period(7, 9, 0.56), period(9, 16.5, 0.76),
      period(16.5, 19, 0.46), period(19, 22, 0.18), period(22, 24, 0.05), period(0, 5, 0.03)
    ],
    soundscape: { base: 0.12, traffic: 0.06, crowd: 0.09, nature: 0.24, landmark: 0.08 },
    soundSources: [
      { kind: "nature", x: 1120, y: 560, radius: 860, strength: 0.2 },
      { kind: "landmark", x: 1145, y: 390, radius: 520, strength: 0.1 }
    ],
    visual: { birds: 2, leaves: 1, wind: 0.3, accent: "#b3483f" }
  },
  vanMieuCourtyard: {
    id: "vanMieuCourtyard",
    label: "Văn Miếu",
    crowdDensity: 0.58,
    trafficDensity: 0.12,
    pedestrianSpeed: 0.62,
    nightActivity: 0.1,
    rainActivityMultiplier: 0.42,
    ambientTypes: ["student", "reader", "guide", "visitor"],
    densityByTime: [
      period(6, 8, 0.16), period(8, 11.5, 0.86), period(11.5, 13.5, 0.42),
      period(13.5, 17.5, 0.78), period(17.5, 20, 0.18), period(20, 24, 0.05), period(0, 6, 0.02)
    ],
    soundscape: { base: 0.12, traffic: 0.04, crowd: 0.11, nature: 0.25, landmark: 0.1 },
    soundSources: [
      { kind: "nature", x: 1110, y: 1640, radius: 650, strength: 0.22 },
      { kind: "traffic", x: 1100, y: 1885, radius: 300, strength: 0.08 }
    ],
    visual: { birds: 2, leaves: 3, wind: 0.18, accent: "#a64d3f" }
  },
  longBienMarket: {
    id: "longBienMarket",
    label: "Đồng Xuân - Phố ven cầu",
    crowdDensity: 0.76,
    trafficDensity: 0.78,
    pedestrianSpeed: 0.92,
    nightActivity: 0.48,
    rainActivityMultiplier: 0.5,
    ambientTypes: ["local", "vendor", "porter", "shopper", "xeOm"],
    densityByTime: [
      period(5, 8, 0.88), period(8, 12, 1), period(12, 14, 0.62),
      period(14, 20.5, 0.9), period(20.5, 23, 0.34), period(23, 24, 0.12), period(0, 5, 0.08)
    ],
    soundscape: { base: 0.2, traffic: 0.3, crowd: 0.25, nature: 0.08, landmark: 0.12 },
    soundSources: [
      { kind: "crowd", x: 760, y: 570, radius: 520, strength: 0.26 },
      { kind: "traffic", x: 620, y: 930, radius: 680, strength: 0.22 }
    ],
    visual: { birds: 1, leaves: 1, wind: 0.35, accent: "#bc764a" }
  },
  longBienBridge: {
    id: "longBienBridge",
    label: "Cầu Long Biên",
    crowdDensity: 0.38,
    trafficDensity: 0.52,
    pedestrianSpeed: 0.86,
    nightActivity: 0.26,
    rainActivityMultiplier: 0.32,
    ambientTypes: ["local", "bridgeWalker", "photographer", "commuter"],
    densityByTime: [
      period(5, 8, 0.62), period(8, 16, 0.5), period(16, 20, 0.7),
      period(20, 23, 0.24), period(23, 24, 0.08), period(0, 5, 0.04)
    ],
    soundscape: { base: 0.18, traffic: 0.2, crowd: 0.06, nature: 0.36, landmark: 0.24 },
    soundSources: [
      { kind: "landmark", x: 1780, y: 620, radius: 980, strength: 0.28 },
      { kind: "nature", x: 2050, y: 880, radius: 1120, strength: 0.28 }
    ],
    visual: { birds: 1, leaves: 2, wind: 0.82, accent: "#7d8584" }
  },
  longBienRiverside: {
    id: "longBienRiverside",
    label: "Ven Sông Hồng",
    crowdDensity: 0.22,
    trafficDensity: 0.08,
    pedestrianSpeed: 0.76,
    nightActivity: 0.16,
    rainActivityMultiplier: 0.25,
    ambientTypes: ["riversideWalker", "local", "photographer"],
    densityByTime: [
      period(5, 8, 0.46), period(8, 16, 0.34), period(16, 20, 0.54),
      period(20, 23, 0.15), period(23, 24, 0.04), period(0, 5, 0.03)
    ],
    soundscape: { base: 0.13, traffic: 0.03, crowd: 0.03, nature: 0.44, landmark: 0.1 },
    soundSources: [{ kind: "nature", x: 1900, y: 1000, radius: 1300, strength: 0.4 }],
    visual: { birds: 2, leaves: 2, wind: 0.92, accent: "#8aa5a8" }
  },
  churchInterior: {
    id: "churchInterior",
    label: "Bên trong Nhà thờ Lớn",
    crowdDensity: 0.44,
    trafficDensity: 0.01,
    pedestrianSpeed: 0.55,
    nightActivity: 0.42,
    rainActivityMultiplier: 0.9,
    ambientTypes: ["parishioner", "visitor"],
    densityByTime: [period(0, 24, 1)],
    soundscape: { base: 0.1, traffic: 0.01, crowd: 0.08, nature: 0.01, landmark: 0.24 },
    soundSources: [{ kind: "landmark", x: 700, y: 180, radius: 820, strength: 0.2 }],
    visual: { birds: 0, leaves: 0, wind: 0, accent: "#d7b46a" },
    interior: true
  }
};

export const AREA_MAP_CONFIG = {
  hoanKiem: {
    defaultProfile: "hoanKiemOldQuarter",
    zones: [{ profileId: "cathedralExterior", x: 2160, y: 390, width: 640, height: 1380 }]
  },
  baDinh: {
    defaultProfile: "baDinhCeremonial",
    zones: [{ profileId: "vanMieuCourtyard", x: 540, y: 1210, width: 1120, height: 800 }]
  },
  longBien: {
    defaultProfile: "longBienMarket",
    zones: [
      { profileId: "longBienRiverside", x: 1660, y: 760, width: 1340, height: 1040 },
      { profileId: "longBienBridge", x: 1010, y: 390, width: 1990, height: 430 }
    ]
  },
  churchInterior: { defaultProfile: "churchInterior", zones: [] }
};

export const AMBIENT_ROLE_LABELS = {
  tourist: "Khách tham quan",
  photographer: "Khách chụp ảnh",
  vendor: "Người bán hàng",
  couple: "Người đi dạo",
  jogger: "Người chạy bộ",
  local: "Người Hà Nội",
  parishioner: "Giáo dân",
  friendGroup: "Nhóm bạn",
  cafeGuest: "Khách quán cà phê",
  visitor: "Khách tham quan",
  guide: "Hướng dẫn viên",
  guard: "Nhân viên khu vực",
  slowWalker: "Người đi bộ",
  student: "Sinh viên",
  reader: "Người đọc bảng",
  porter: "Người chuyển hàng",
  shopper: "Người đi chợ",
  xeOm: "Người lái xe ôm",
  bridgeWalker: "Người đi bộ trên cầu",
  commuter: "Người qua cầu",
  riversideWalker: "Người đi dạo ven sông"
};
