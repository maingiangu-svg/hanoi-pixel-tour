import { photoSpotsById } from "./photoSpots.js";

const DEFAULT_RADIUS = 46;
const DEFAULT_VISIBLE_RANGE = 150;

const interactions = [
  seat("bench-ho-guom-01", "hoanKiem", 1300, 1228, 1311, 1215, "down", "Ghế đá ven Hồ Gươm"),
  seat("bench-ho-guom-02", "hoanKiem", 1450, 1228, 1461, 1215, "down", "Ghế đá ven Hồ Gươm", {
    occupiedByNpcIds: ["coupleHoGuom"]
  }),
  seat("bench-ho-guom-03", "hoanKiem", 1620, 1228, 1631, 1215, "down", "Ghế đá ven Hồ Gươm"),
  seat("bench-pho-co-01", "hoanKiem", 1190, 530, 1201, 517, "down", "Ghế nghỉ phố cổ"),
  teaSeat("tea-seat-ho-guom", "hoanKiem", 1200, 936, 1206, 924, "left", "Trà đá Bờ Hồ", "teaSellerHoGuom", {
    sheltered: true,
    companionPosition: { x: 1238, y: 924, facing: "right", activity: "resting" }
  }),

  viewpoint("view-ho-guom", "hoanKiem", "photo-ho-guom", "Hồ Gươm", "Mặt hồ mở ra giữa nhịp phố, với lối đi bộ và hàng cây ven bờ.", { x: 130, y: -20 }),
  viewpoint("view-thap-rua", "hoanKiem", "photo-thap-rua", "Tháp Rùa", "Tháp Rùa hiện lên giữa mặt nước, tách khỏi phố xá đông đúc quanh hồ."),
  viewpoint("view-cau-the-huc", "hoanKiem", "photo-cau-the-huc", "Cầu Thê Húc", "Nhịp cầu đỏ dẫn từ bờ hồ về phía Đền Ngọc Sơn."),
  viewpoint("view-nha-tho-lon", "hoanKiem", "photo-nha-tho-lon", "Nhà thờ Lớn Hà Nội", "Hai tháp chuông và khoảng sân nhỏ tạo nên một góc phố vừa trang nghiêm vừa gần gũi.", { x: 0, y: -120 }),

  inspect("inspect-hang-bac", "hoanKiem", 876, 604, "Biển phố Hàng Bạc", "Một biển tên phố nhỏ giữa khu phố cổ, nơi mặt tiền nhà ống nối tiếp nhau."),
  inspect("inspect-le-thai-to", "hoanKiem", 1168, 1260, "Biển phố Lê Thái Tổ", "Con phố chạy sát Hồ Gươm, nối các đoạn vỉa hè và phố đi bộ quanh hồ."),
  inspect("inspect-church-calendar", "hoanKiem", 2554, 800, "Lịch lễ Nhà thờ", "Bảng nhỏ ghi giờ sinh hoạt của Nhà thờ. Thánh lễ chiều diễn ra từ 18:00 đến 19:00."),
  inspect("inspect-bus-hoan-kiem", "hoanKiem", 2450, 1410, "Bảng tuyến xe buýt", "Điểm dừng kết nối khu trung tâm với Ba Đình và các khu tham quan khác."),
  vehicleWalkZone("walk-bike-ho-guom", "hoanKiem", 1112, 1184, "parkingHoGuom"),
  vehicleWalkZone("walk-bike-church", "hoanKiem", 2518, 842, "parkingHoGuom"),

  seat("bench-ba-dinh-01", "baDinh", 760, 748, 771, 735, "down", "Ghế nghỉ Quảng trường Ba Đình"),
  seat("bench-ba-dinh-02", "baDinh", 920, 748, 931, 735, "down", "Ghế nghỉ Quảng trường Ba Đình"),
  seat("bench-van-mieu-01", "baDinh", 840, 1810, 851, 1797, "down", "Ghế nghỉ sân Văn Miếu"),
  seat("bench-van-mieu-02", "baDinh", 1160, 1810, 1171, 1797, "down", "Ghế nghỉ sân Văn Miếu"),
  teaSeat("tea-seat-van-mieu", "baDinh", 500, 1694, 506, 1682, "left", "Trà đá cổng Văn Miếu", "teaSellerBaDinh", {
    sheltered: true,
    companionPosition: { x: 538, y: 1682, facing: "right", activity: "resting" }
  }),
  viewpoint("view-ba-dinh", "baDinh", "photo-quang-truong-ba-dinh", "Quảng trường Ba Đình", "Không gian rộng, trật tự và trang nghiêm mở ra trước Lăng Chủ tịch Hồ Chí Minh.", { x: 0, y: -130 }),
  viewpoint("view-lang-bac", "baDinh", "photo-lang-bac", "Lăng Chủ tịch Hồ Chí Minh", "Khối công trình nổi bật phía cuối quảng trường, sau những dải cỏ quy hoạch thẳng hàng."),
  viewpoint("view-chua-mot-cot", "baDinh", "photo-chua-mot-cot", "Chùa Một Cột", "Ngôi chùa nhỏ vươn trên một cột đá giữa ao, tách khỏi những trục đường lớn xung quanh."),
  viewpoint("view-van-mieu", "baDinh", "photo-cong-van-mieu", "Văn Miếu - Quốc Tử Giám", "Cổng gạch mở vào nhiều lớp sân và không gian học thuật của kinh thành xưa.", { x: 0, y: -80 }),
  viewpoint("view-khue-van-cac", "baDinh", "photo-khue-van-cac", "Khuê Văn Các", "Gác nhỏ cân đối nổi bật giữa sân lát và những lớp kiến trúc Văn Miếu."),
  inspect("inspect-ba-dinh-sign", "baDinh", 372, 1510, "Biển phố khu Ba Đình", "Từ trục đường lớn, các lối vỉa hè dẫn tới quảng trường và khu Văn Miếu."),
  inspect("inspect-van-mieu-board", "baDinh", 1040, 1440, "Bảng thông tin Văn Miếu", "Bảng giới thiệu nhắc khách giữ yên lặng và đi theo các lối sân lát trong khu di tích."),
  vehicleWalkZone("walk-bike-ba-dinh", "baDinh", 482, 888, "parkingBaDinh"),
  vehicleWalkZone("walk-bike-van-mieu", "baDinh", 552, 1586, "parkingVanMieu"),

  seat("bench-long-bien-01", "longBien", 1010, 1090, 1021, 1077, "down", "Ghế đá ven khu dân cư"),
  teaSeat("tea-seat-long-bien", "longBien", 1160, 1090, 1168, 1078, "left", "Trà đá ven chợ", "teaSellerLongBien", {
    sheltered: true,
    companionPosition: { x: 1202, y: 1078, facing: "right", activity: "resting" }
  }),
  railingView("view-cau-long-bien", "longBien", "photo-cau-long-bien", "Cầu Long Biên", "Khung thép và đường ray kéo dài về phía bờ sông.", ["longBienTrainPass"], { x: 120, y: -20 }),
  railingView("view-duong-ray-long-bien", "longBien", "photo-duong-ray-long-bien", "Đường ray Cầu Long Biên", "Nhịp ray chạy giữa kết cấu thép cũ. Hãy đứng sau vùng cảnh báo khi tàu đi qua.", ["longBienTrainPass"]),
  railingView("view-song-hong", "longBien", "photo-song-hong", "Sông Hồng", "Từ cầu nhìn xuống, mặt sông và bãi bồi mở rộng phía ngoài khu dân cư.", [], { x: 120, y: 0 }),
  inspect("inspect-long-bien-warning", "longBien", 1010, 520, "Biển cảnh báo đường sắt", "Không đứng trên đường ray và luôn chờ tín hiệu an toàn trước khi đi qua."),
  inspect("inspect-long-bien-street", "longBien", 1520, 1260, "Biển phố Long Biên", "Khu dân cư cũ nối với chợ, đường dẫn lên cầu và các ngõ nhỏ ven sông."),
  inspect("inspect-bus-long-bien", "longBien", 1466, 1348, "Bảng tuyến xe buýt Long Biên", "Trạm xe buýt kết nối khu cầu với Ba Đình và trung tâm thành phố."),
  vehicleWalkZone("walk-bike-long-bien", "longBien", 494, 398, "parkingDongXuan"),

  churchSeat("church-seat-left-01", 310, 252, 310, 252),
  churchSeat("church-seat-right-01", 1064, 252, 1064, 252),
  churchSeat("church-seat-left-02", 310, 392, 310, 392),
  churchSeat("church-seat-right-02", 1064, 392, 1064, 392),
  churchSeat("church-seat-left-03", 310, 532, 310, 532),
  churchSeat("church-seat-right-03", 1064, 532, 1064, 532),
  viewpoint("view-church-interior", "churchInterior", "photo-nha-tho-noi-that", "Gian chính Nhà thờ Lớn", "Lối đi giữa hai dãy ghế hướng về bàn thờ và những ô kính màu.", { x: 0, y: -120 }, { sheltered: true }),
  inspect("inspect-church-service-board", "churchInterior", 784, 824, "Bảng giờ lễ", "Thánh lễ chiều diễn ra từ 18:00 đến 19:00. Trong giờ lễ, khách tham quan được nhắc giữ yên lặng.", { sheltered: true })
];

export const ENVIRONMENT_INTERACTION_TYPES = Object.freeze([
  "seat", "teaSeat", "churchSeat", "viewpoint", "railingView", "vehicleWalkZone", "inspectObject"
]);

export const environmentInteractions = Object.freeze(interactions.map(freezeInteraction));

const interactionsByMap = Object.freeze(Object.fromEntries(
  ["hoanKiem", "baDinh", "longBien", "churchInterior"].map((mapId) => [
    mapId,
    Object.freeze(environmentInteractions.filter((entry) => entry.mapId === mapId))
  ])
));

export function getEnvironmentInteractionsForMap(mapId) {
  return interactionsByMap[mapId] || [];
}

function seat(id, mapId, x, y, playerX, playerY, direction, name, options = {}) {
  return createInteraction({
    id, type: "seat", mapId, x: x + 23, y: y + 15, direction, name,
    prompt: "Ngồi nghỉ", pose: "sit", playerPosition: { x: playerX, y: playerY },
    allowPhoto: false, ...options
  });
}

function teaSeat(id, mapId, x, y, playerX, playerY, direction, name, vendorNpcId, options = {}) {
  return createInteraction({
    id, type: "teaSeat", mapId, x, y, direction, name, vendorNpcId,
    prompt: "Ghé quán trà đá", pose: "sit", playerPosition: { x: playerX, y: playerY },
    allowPhoto: false, ...options
  });
}

function churchSeat(id, x, y, playerX, playerY) {
  const aisleMarkerX = x < 700 ? 518 : 882;
  return createInteraction({
    id, type: "churchSeat", mapId: "churchInterior", x: aisleMarkerX, y: y + 22,
    name: "Ghế Nhà thờ", prompt: "Ngồi xuống", direction: "up", pose: "sit",
    playerPosition: { x: playerX, y: playerY }, sheltered: true, interactionRadius: 42
  });
}

function viewpoint(id, mapId, photoSpotId, name, description, cameraOffset = {}, options = {}) {
  const spot = photoSpotsById[photoSpotId];
  return createInteraction({
    id, type: "viewpoint", mapId, photoSpotId, name, description,
    x: spot.x, y: spot.y, direction: spot.requiredFacing,
    playerPosition: { x: spot.x - 12, y: spot.y - 16 },
    prompt: "Ngắm cảnh", pose: "lookOut", cameraOffset, allowPhoto: true, ...options
  });
}

function railingView(id, mapId, photoSpotId, name, description, blockedEventIds = [], cameraOffset = {}) {
  const spot = photoSpotsById[photoSpotId];
  return createInteraction({
    id, type: "railingView", mapId, photoSpotId, name, description,
    x: spot.x, y: spot.y, direction: spot.requiredFacing,
    playerPosition: { x: spot.x - 12, y: spot.y - 16 },
    prompt: "Tựa lan can ngắm cảnh", pose: "lean", cameraOffset, allowPhoto: true,
    blockedEventIds
  });
}

function inspect(id, mapId, x, y, name, description, options = {}) {
  return createInteraction({
    id, type: "inspectObject", mapId, x, y, name, description,
    prompt: "Kiểm tra", pose: "inspect", interactionRadius: 48, ...options
  });
}

function vehicleWalkZone(id, mapId, x, y, parkingSpotId) {
  return createInteraction({
    id, type: "vehicleWalkZone", mapId, x, y, parkingSpotId,
    name: "Lối vào khu đi bộ", prompt: "Dắt hoặc gửi xe", interactionRadius: 58,
    visibleRange: 120
  });
}

function createInteraction(config) {
  return {
    interactionRadius: DEFAULT_RADIUS,
    visibleRange: DEFAULT_VISIBLE_RANGE,
    labelOffsetX: 0,
    labelOffsetY: -26,
    direction: "down",
    sheltered: false,
    allowPhoto: false,
    ...config
  };
}

function freezeInteraction(entry) {
  const result = { ...entry };
  ["playerPosition", "companionPosition", "cameraOffset"].forEach((key) => {
    if (result[key]) result[key] = Object.freeze({ ...result[key] });
  });
  if (result.blockedEventIds) result.blockedEventIds = Object.freeze([...result.blockedEventIds]);
  if (result.occupiedByNpcIds) result.occupiedByNpcIds = Object.freeze([...result.occupiedByNpcIds]);
  return Object.freeze(result);
}
