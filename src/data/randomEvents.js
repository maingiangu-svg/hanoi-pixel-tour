const hour = (value) => Math.round(value * 60);
const windowOf = (start, end) => Object.freeze({ start: hour(start), end: hour(end) });

const BUS_EVENTS = [
  {
    id: "busArrivalHoanKiem",
    mapId: "hoanKiem",
    anchor: { x: 2450, y: 1374 },
    route: [{ x: 2780, y: 1374 }, { x: 2500, y: 1374 }, { x: 2200, y: 1374 }]
  },
  {
    id: "busArrivalBaDinh",
    mapId: "baDinh",
    anchor: { x: 332, y: 1848 },
    route: [{ x: 90, y: 1848 }, { x: 310, y: 1848 }, { x: 620, y: 1848 }]
  },
  {
    id: "busArrivalLongBien",
    mapId: "longBien",
    anchor: { x: 1466, y: 1348 },
    route: [{ x: 1080, y: 1215 }, { x: 1430, y: 1215 }, { x: 1680, y: 1215 }]
  }
].map((config) => ({
  ...config,
  name: "Xe buýt tới trạm",
  size: "small",
  visualType: "busArrival",
  timeWindows: [windowOf(5.5, 23)],
  evaluationInterval: 60,
  chance: 0.42,
  spawnSafeExempt: true,
  allowVisibleEnd: true,
  durationGameMinutes: 18,
  cooldownGameMinutes: 120,
  notice: "Một chuyến xe buýt vừa ghé trạm gần đây."
}));

const XE_OM_EVENTS = [
  { id: "xeOmGatheringHoanKiem", mapId: "hoanKiem", anchor: { x: 2450, y: 1460 } },
  { id: "xeOmGatheringLongBien", mapId: "longBien", anchor: { x: 1360, y: 1320 } }
].map((config) => ({
  ...config,
  name: "Nhóm xe ôm đầu phố",
  size: "small",
  visualType: "xeOmGathering",
  timeWindows: [windowOf(6, 10), windowOf(16, 22)],
  blockedWeather: ["heavyRain"],
  evaluationInterval: 60,
  chance: 0.28,
  durationGameMinutes: 80,
  cooldownGameMinutes: 480
}));

export const randomEventDefinitions = Object.freeze([
  {
    id: "hoanKiemDanceGroup",
    name: "Nhóm nhảy bên Hồ Gươm",
    mapId: "hoanKiem",
    size: "large",
    visualType: "danceGroup",
    anchor: { x: 1100, y: 1218 },
    timeWindows: [windowOf(18.5, 21)],
    allowedWeather: ["clear", "cloudy"],
    endOnWeather: ["drizzle", "rain", "heavyRain"],
    evaluationInterval: 30,
    chance: 0.36,
    minAreaActivity: 0.42,
    durationGameMinutes: 82,
    cooldownGameMinutes: 1440,
    notice: "Có một nhóm nhảy đang biểu diễn gần lối đi Hồ Gươm.",
    interaction: { name: "Người tổ chức", prompt: "E · Xem nhóm nhảy", radius: 62 },
    photoSpotIds: ["photo-ho-guom"],
    photoTags: ["sự kiện", "nhóm nhảy", "Hồ Gươm"]
  },
  {
    id: "hoanKiemDroppedItem",
    name: "Người đánh rơi đồ",
    mapId: "hoanKiem",
    size: "small",
    visualType: "droppedItem",
    anchor: { x: 1180, y: 1280 },
    timeWindows: [windowOf(7, 21.5)],
    blockedWeather: ["heavyRain"],
    evaluationInterval: 45,
    chance: 0.22,
    minAreaActivity: 0.22,
    durationGameMinutes: 95,
    cooldownGameMinutes: 1440,
    blockedByQuestIds: ["lostWallet"],
    interaction: { name: "Khách đi dạo", prompt: "E · Nhặt món đồ rơi", radius: 58 }
  },
  {
    id: "churchBell",
    name: "Chuông Nhà thờ Lớn",
    mapId: "hoanKiem",
    size: "small",
    capacityExempt: true,
    spawnSafeExempt: true,
    allowVisibleEnd: true,
    visualType: "churchBell",
    anchor: { x: 2483, y: 600 },
    triggerMinutes: [hour(17.75), hour(18), hour(19)],
    chance: 1,
    durationGameMinutes: 8,
    cooldownGameMinutes: 8,
    notice: "Tiếng chuông Nhà thờ Lớn vang lên giữa khu phố.",
    photoSpotIds: ["photo-nha-tho-lon"],
    photoTags: ["sự kiện", "Nhà thờ Lớn", "chuông nhà thờ"]
  },
  {
    id: "vanMieuStudentGroup",
    name: "Đoàn học sinh tham quan Văn Miếu",
    mapId: "baDinh",
    size: "large",
    visualType: "studentGroup",
    anchor: { x: 1100, y: 1660 },
    waypoints: [{ x: 1100, y: 1428 }, { x: 1100, y: 1660 }, { x: 1210, y: 1780 }],
    timeWindows: [windowOf(8, 16)],
    blockedWeather: ["heavyRain"],
    evaluationInterval: 60,
    chance: 0.3,
    minAreaActivity: 0.24,
    durationGameMinutes: 110,
    cooldownGameMinutes: 1080,
    blockedByQuestIds: ["tourGroup"],
    notice: "Một đoàn học sinh đang nghe thuyết minh trong Văn Miếu.",
    interaction: { name: "Hướng dẫn viên đoàn học sinh", prompt: "E · Nghe thuyết minh", radius: 64 },
    photoSpotIds: ["photo-khue-van-cac", "photo-bia-tien-si"],
    photoTags: ["sự kiện", "đoàn học sinh", "Văn Miếu"]
  },
  {
    id: "baDinhVisitorGroup",
    name: "Đoàn khách tại Ba Đình",
    mapId: "baDinh",
    size: "large",
    visualType: "visitorGroup",
    anchor: { x: 790, y: 760 },
    waypoints: [{ x: 610, y: 820 }, { x: 790, y: 760 }, { x: 1080, y: 700 }],
    timeWindows: [windowOf(7.5, 14.5)],
    blockedWeather: ["heavyRain"],
    evaluationInterval: 60,
    chance: 0.26,
    minAreaActivity: 0.16,
    durationGameMinutes: 88,
    cooldownGameMinutes: 1080,
    blockedByQuestIds: ["tourGroup"],
    interaction: { name: "Hướng dẫn viên Ba Đình", prompt: "E · Nghe giới thiệu", radius: 62 }
  },
  {
    id: "longBienTrainPass",
    name: "Tàu qua Cầu Long Biên",
    mapId: "longBien",
    size: "large",
    visualType: "trainPass",
    anchor: { x: 1120, y: 618 },
    triggerMinutes: [hour(6.67), hour(10.33), hour(15.17), hour(20.08)],
    chance: 1,
    spawnSafeExempt: true,
    allowVisibleEnd: true,
    durationGameMinutes: 22,
    cooldownGameMinutes: 120,
    notice: "Tín hiệu đường sắt bật sáng: tàu sắp qua Cầu Long Biên.",
    photoSpotIds: ["photo-cau-long-bien", "photo-duong-ray-long-bien"],
    photoTags: ["sự kiện", "tàu qua cầu", "Long Biên"]
  },
  {
    id: "longBienStreetVendor",
    name: "Hàng rong ven cầu",
    mapId: "longBien",
    size: "small",
    visualType: "streetVendor",
    anchor: { x: 820, y: 760 },
    waypoints: [{ x: 650, y: 760 }, { x: 820, y: 760 }, { x: 1010, y: 760 }],
    timeWindows: [windowOf(6, 20.5)],
    blockedWeather: ["heavyRain"],
    evaluationInterval: 45,
    chance: 0.3,
    minAreaActivity: 0.2,
    durationGameMinutes: 125,
    cooldownGameMinutes: 720,
    interaction: { name: "Cô hàng rong", prompt: "E · Ghé hàng rong", radius: 58 }
  },
  {
    id: "weatherRainRush",
    name: "Phố chạy trú mưa",
    mapIds: ["hoanKiem", "baDinh", "longBien"],
    size: "small",
    capacityExempt: true,
    visualType: "rainRush",
    weatherTrigger: "rainStart",
    spawnSafeExempt: true,
    allowVisibleEnd: true,
    anchorsByMap: {
      hoanKiem: { x: 1050, y: 1230 },
      baDinh: { x: 2240, y: 1680 },
      longBien: { x: 1060, y: 1120 }
    },
    durationGameMinutes: 35,
    cooldownGameMinutes: 90,
    photoSpotIds: ["photo-ho-guom"],
    photoTags: ["sự kiện", "mưa Hà Nội", "Hồ Gươm"]
  },
  {
    id: "weatherAfterRain",
    name: "Phố sau cơn mưa",
    mapIds: ["hoanKiem", "baDinh", "longBien"],
    size: "small",
    capacityExempt: true,
    visualType: "afterRain",
    weatherTrigger: "rainStop",
    spawnSafeExempt: true,
    allowVisibleEnd: true,
    anchorsByMap: {
      hoanKiem: { x: 1160, y: 1220 },
      baDinh: { x: 2110, y: 1690 },
      longBien: { x: 1030, y: 1160 }
    },
    durationGameMinutes: 55,
    cooldownGameMinutes: 90,
    photoSpotIds: ["photo-ho-guom"],
    photoTags: ["sự kiện", "sau mưa", "đường ướt"]
  },
  ...BUS_EVENTS,
  ...XE_OM_EVENTS,
  {
    id: "childrenStreetGame",
    name: "Trẻ em chơi ở sân nhỏ",
    mapId: "hoanKiem",
    size: "small",
    visualType: "childrenGame",
    anchor: { x: 2290, y: 1110 },
    timeWindows: [windowOf(16, 19.5)],
    allowedWeather: ["clear", "cloudy", "drizzle"],
    endOnWeather: ["rain", "heavyRain"],
    evaluationInterval: 30,
    chance: 0.34,
    minAreaActivity: 0.3,
    durationGameMinutes: 78,
    cooldownGameMinutes: 360,
    interaction: { name: "Nhóm trẻ em", prompt: "E · Xem trò chơi", radius: 58 }
  },
  {
    id: "couplePhotoHoanKiem",
    name: "Cặp đôi chụp ảnh",
    mapId: "hoanKiem",
    size: "small",
    visualType: "couplePhoto",
    anchor: { x: 2420, y: 835 },
    timeWindows: [windowOf(9, 21.5)],
    allowedWeather: ["clear", "cloudy", "drizzle"],
    endOnWeather: ["rain", "heavyRain"],
    evaluationInterval: 45,
    chance: 0.25,
    minAreaActivity: 0.28,
    durationGameMinutes: 58,
    cooldownGameMinutes: 720,
    interaction: { name: "Cặp đôi", prompt: "E · Chụp ảnh giúp", radius: 56 },
    photoSpotIds: ["photo-nha-tho-lon"],
    photoTags: ["sự kiện", "cặp đôi", "Nhà thờ Lớn"]
  }
].map((event) => Object.freeze(event)));

export const randomEventsById = Object.freeze(Object.fromEntries(
  randomEventDefinitions.map((event) => [event.id, event])
));

export const RANDOM_EVENT_IDS = Object.freeze(new Set(Object.keys(randomEventsById)));
