export const CHAPTER_4_ID = "chapter-4";
export const CHAPTER_4_TITLE = "Con đường trở về";

export const CHAPTER_4_REVEAL_POINT = Object.freeze({
  id: "chapter4-long-bien-reveal",
  label: "Cùng Mơ đối diện sự thật",
  mapId: "longBien",
  x: 1910,
  y: 612,
  radius: 58,
  visibleRange: 280,
  kind: "reveal"
});

export const CHAPTER_4_REQUIRED_HISTORY_MARKS = Object.freeze([
  "history-hoan-kiem",
  "history-cathedral",
  "history-ba-dinh",
  "history-van-mieu"
]);

export const CHAPTER_4_REQUIRED_HUMAN_MEMORIES = Object.freeze([
  "memory-tea-stall",
  "memory-mo-and-children",
  "memory-held-hand",
  "memory-school-trip"
]);

export const CHAPTER_4_REQUIRED_CLUES = Object.freeze([
  "clue-instinctive-hoan-kiem-name",
  "clue-childhood-song",
  "clue-church-bell-memory",
  "clue-mo-old-photo",
  "clue-modern-school-lesson",
  "clue-long-bien-disappearance"
]);

export const CHAPTER_4_PREREQUISITE_TARGETS = Object.freeze({
  "history-hoan-kiem": target("Ôn lại Dấu ấn Hồ Hoàn Kiếm", "hoanKiem", 1328, 650, "hoGuom"),
  "history-cathedral": target("Ôn lại lịch sử Nhà thờ Lớn", "hoanKiem", 2483, 792, "nhaThoLon"),
  "history-ba-dinh": target("Ôn lại Dấu ấn Ba Đình", "baDinh", 1145, 462, "langBac"),
  "history-van-mieu": target("Ôn lại Dấu ấn Văn Miếu", "baDinh", 1100, 1840, "vanMieu"),
  "memory-tea-stall": target("Nhớ lại câu chuyện ở quán trà đá", "hoanKiem", 650, 1390, "chapter1-tea-stall"),
  "memory-mo-and-children": target("Nhớ lại Mơ và nhóm trẻ", "hoanKiem", 2260, 980, "chapter2-children"),
  "memory-held-hand": target("Trở lại Quảng trường Ba Đình", "baDinh", 760, 748, "chapter3-ba-dinh-arrival"),
  "memory-school-trip": target("Trở lại Khuê Văn Các", "baDinh", 1100, 1662, "chapter3-khue-van-memory"),
  "clue-instinctive-hoan-kiem-name": target("Tìm lại tên Hồ Hoàn Kiếm", "hoanKiem", 1328, 650, "hoGuom"),
  "clue-childhood-song": target("Tìm lại bài hát tuổi thơ", "hoanKiem", 920, 1120, "chapter1-child-song"),
  "clue-church-bell-memory": target("Nghe lại tiếng chuông Nhà thờ", "hoanKiem", 2483, 792, "nhaThoLon"),
  "clue-mo-old-photo": target("Hỏi Mơ về bức ảnh cũ", "hoanKiem", 2260, 980, "chapter2-old-photo"),
  "clue-modern-school-lesson": target("Nhớ lại bài học tại Khuê Văn Các", "baDinh", 1100, 1662, "chapter3-khue-van-memory"),
  "clue-long-bien-disappearance": target("Tìm lời kể về vụ mất tích", "baDinh", 1440, 1830, "chapter3-old-witness")
});

export const CHAPTER_4_REVEAL_SCENE = Object.freeze({
  id: "chapter4-origin-reveal-scene",
  renderer: "chapter4Reveal",
  state: Object.freeze({
    storm: 0,
    lightning: 0,
    view: null,
    flash: null,
    portal: 0,
    pendantGlow: 0
  })
});

export const CHAPTER_4_REVEAL_TIMELINE = Object.freeze([
  { type: "letterbox", to: 1, duration: 260 },
  { type: "checkpoint", sceneId: CHAPTER_4_ID, checkpointId: "bridge-arrival" },
  { type: "sceneState", patch: { storm: 0.68, view: null, flash: null }, animation: "stormGathering", duration: 720 },
  narration("Chiều trên cầu tối lại. Gió từ Sông Hồng kéo dọc những nhịp thép, mang theo mùi mưa sắp tới."),
  speech("Mơ", "Có chuyện này mình đã giấu bạn."),
  { type: "sceneState", patch: { view: "old-photo", pendantGlow: 0 }, animation: "photoReveal", duration: 520 },
  narration("Mơ mở bức ảnh cũ. Đứa trẻ bên Hồ Gươm đeo một mặt dây chuyền hình Tháp Rùa."),
  { type: "sceneState", patch: { view: "pendant-compare", pendantGlow: 0.45 }, animation: "pendantCompare", duration: 620 },
  speech("Bạn", "Đứa trẻ này…"),
  speech("Mơ", "Đã mất tích tại đây nhiều năm trước."),
  speech("Mơ", "Bà mình đã tìm đứa trẻ ấy suốt cả đời."),
  speech("Mơ", "Và mình tin… đó là bạn."),
  { type: "sceneState", patch: { view: null }, duration: 180 },
  { type: "camera", entityId: "mo", zoom: 2, duration: 560, trackEntity: true },
  { type: "suspicion", active: true, entityId: "mo", zoom: 2, audioDuck: 0.08, heartbeat: true },
  internal("Nếu nói ra, người ấy có thể sẽ rời đi."),
  internal("Nhưng giữ im lặng còn tàn nhẫn hơn."),
  internal("Bạn không phải người lạ."),
  internal("Bạn là người đã trở về."),
  { type: "suspicion", active: false, audioDuck: 0.25 },
  { type: "cameraRestore", duration: 560 },
  { type: "checkpoint", sceneId: CHAPTER_4_ID, checkpointId: "portal-awakening" },
  { type: "sceneState", patch: { storm: 0.9, pendantGlow: 1, portal: 0.22 }, animation: "pendantAwakening", duration: 520 },
  { type: "audioCue", cue: "portalResonance" },
  narration("Mặt dây chuyền phát sáng. Âm rung trầm của cây cổ thụ từ dị giới vọng qua những thanh thép."),
  { type: "shake", magnitude: 3, duration: 420 },
  { type: "sceneState", patch: { lightning: 1, portal: 0.72 }, animation: "portalOpening", duration: 220 },
  { type: "sceneState", patch: { lightning: 0, portal: 1 }, animation: "portalStable", duration: 620 },
  narration("Đường ray rung nhẹ. Một khe nứt sáng mở ra giữa các nhịp cầu."),
  { type: "checkpoint", sceneId: CHAPTER_4_ID, checkpointId: "complete-memory" },
  memoryFlash("childhood-hanoi", 420),
  narration("Bạn từng là một đứa trẻ sống tại Hà Nội, lớn lên giữa những con phố, tiếng chuông và mặt hồ này."),
  memoryFlash("bridge-storm", 420),
  narration("Trong một đêm giông, đứa trẻ đi qua Cầu Long Biên cùng người thân."),
  memoryFlash("child-rift", 460),
  memoryFlash("broken-pendant", 340),
  narration("Khe nứt mở ra. Bàn tay tuột mất, mặt dây bị đứt và đứa trẻ bị hút sang một thế giới khác."),
  memoryFlash("worlds-time", 420),
  narration("Thời gian ở hai thế giới trôi khác nhau. Một khoảnh khắc tại Hà Nội đã trở thành cả một đời ở dị giới."),
  memoryFlash("elder-immortal", 430),
  memoryFlash("tree-seed", 420),
  narration("Một hạt giống mang ký ức Hà Nội đã theo đứa trẻ qua cổng, lớn thành cây cổ thụ và trở thành chiếc neo giữa hai thế giới."),
  memoryFlash("tree-return", 460),
  narration("Cây không cố giết người. Nó cảm nhận cánh cổng sắp mở và dùng cú đổ cuối cùng để đưa người trở lại."),
  memoryFlash("disciples-safe", 360),
  narration("Ba đệ tử đã kịp thoát khỏi tán cây. Họ vẫn còn sống ở phía bên kia."),
  memoryFlash("young-restored", 420),
  narration("Khi trở về đúng dòng thời gian đã mất, cơ thể già nua của người được trả lại tuổi trẻ."),
  narration("Dị giới không phải quê hương của người."),
  narration("Nó mới là thế giới xa lạ."),
  narration("Hà Nội là nơi người đã bị lấy mất."),
  { type: "sceneState", patch: { flash: null, view: null, portal: 1, storm: 0.72 }, duration: 240 },
  speech("Bạn", "Ta không xuyên không tới nơi này…"),
  speech("Mơ", "Không."),
  speech("Mơ", "Bạn chỉ mất cả một đời để tìm đường trở về."),
  { type: "wait", duration: 1900 },
  narration("Ba đệ tử vẫn an toàn phía bên kia. Cánh cổng chỉ còn mở trong ít phút."),
  { type: "letterbox", to: 0, duration: 360 }
]);

function target(label, mapId, x, y, targetId) {
  return Object.freeze({ label, mapId, x, y, targetId });
}

function speech(speaker, text) {
  return Object.freeze({ type: "dialogue", kind: "speech", speaker, text });
}

function internal(text) {
  return Object.freeze({ type: "dialogue", kind: "internal", speaker: "Mơ (nghĩ)", text });
}

function narration(text) {
  return Object.freeze({ type: "dialogue", kind: "narration", text });
}

function memoryFlash(flash, duration) {
  return Object.freeze({ type: "sceneState", patch: { flash, view: "memory" }, animation: "memoryFlash", duration });
}
