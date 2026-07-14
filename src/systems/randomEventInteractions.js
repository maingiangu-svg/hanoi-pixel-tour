import { randomEventsById } from "../data/randomEvents.js";
import { state } from "../state.js";
import { completeRandomEventInteraction } from "./randomEvents.js";
import { closeChoiceModal, openChoiceModal, showMessage } from "./modal.js";

export function handleRandomEventInteraction(source) {
  const definition = source?.definition || randomEventsById[source?.eventId || source?.id];
  const active = definition && state.randomEvents.active[definition.id];
  if (!definition || !active || active.interactionResolved) return false;

  const handlers = {
    danceGroup: openDanceInteraction,
    droppedItem: openDroppedItemInteraction,
    studentGroup: openStudentInteraction,
    visitorGroup: openVisitorInteraction,
    streetVendor: openStreetVendorInteraction,
    childrenGame: openChildrenInteraction,
    couplePhoto: openCouplePhotoInteraction
  };
  return handlers[definition.visualType]?.(definition, active) || false;
}

function openDanceInteraction(definition) {
  openChoiceModal({
    tag: "Hoạt động ven hồ",
    title: definition.name,
    body: "Nhóm đang tập một đoạn nhảy ngắn. Bạn muốn làm gì?",
    actions: [
      action("Tham gia một đoạn", () => resolve(definition.id, "joined", "Bạn hòa vào nhịp nhảy rồi nhận một tràng vỗ tay.")),
      action("Đứng xem", () => resolve(definition.id, "watched", "Bạn đứng lại xem phố đi bộ rộn ràng trong ít phút.")),
      action("Rời đi", closeChoiceModal)
    ]
  });
  return true;
}

function openDroppedItemInteraction(definition) {
  openChoiceModal({
    tag: "Sự kiện đường phố",
    title: "Một túi đồ lưu niệm bị rơi",
    body: "Người khách phía trước vẫn chưa nhận ra. Bạn sẽ xử lý thế nào?",
    actions: [
      action("Trả lại người đánh rơi", () => resolve(definition.id, "returned", "Người khách cảm ơn bạn và gửi 5.000đ tiền cà phê.", { reward: 5000, endAfter: true })),
      action("Đưa cho bảo vệ", () => resolve(definition.id, "guard", "Bảo vệ nhận giữ món đồ và cảm ơn bạn. Bạn nhận 3.000đ.", { reward: 3000, endAfter: true })),
      action("Bỏ qua", () => resolve(definition.id, "ignored", "Bạn tiếp tục hành trình; một người khác đã nhặt món đồ.", { endAfter: true }))
    ]
  });
  return true;
}

function openStudentInteraction(definition) {
  openChoiceModal({
    tag: "Kiến thức Văn Miếu",
    title: "Hướng dẫn viên hỏi cả đoàn",
    body: "Việc dựng bia tiến sĩ tại Văn Miếu dưới triều Lê sơ chủ yếu nhằm mục đích nào?",
    actions: [
      action("Ghi danh và khuyến học", () => resolve(definition.id, "correct", "Đúng. Bia ghi danh người đỗ đại khoa, đồng thời đề cao đạo học và trách nhiệm với đất nước.", { reward: 8000 })),
      action("Đánh dấu ranh giới kinh thành", () => resolve(definition.id, "wrong", "Chưa đúng. Bia tiến sĩ gắn với việc ghi danh khoa bảng và khuyến học.")),
      action("Ghi lịch thuế của triều đình", () => resolve(definition.id, "wrong", "Chưa đúng. Bia tiến sĩ gắn với việc ghi danh khoa bảng và khuyến học.")),
      action("Tưởng niệm các tướng lĩnh", () => resolve(definition.id, "wrong", "Chưa đúng. Bia tiến sĩ gắn với việc ghi danh khoa bảng và khuyến học."))
    ]
  });
  return true;
}

function openVisitorInteraction(definition) {
  openChoiceModal({
    tag: "Không gian Ba Đình",
    title: definition.name,
    body: "Hướng dẫn viên đang nhắc đoàn giữ hàng và nói nhỏ trong khu quảng trường.",
    actions: [
      action("Nghe giới thiệu", () => resolve(definition.id, "listened", "Bạn nghe thêm về trục không gian trang nghiêm giữa quảng trường và Lăng Bác.", { reward: 2000 })),
      action("Rời đi", closeChoiceModal)
    ]
  });
  return true;
}

function openStreetVendorInteraction(definition) {
  const item = "Món quà hàng rong Long Biên";
  const owned = state.inventory.specialItems.includes(item);
  openChoiceModal({
    tag: "Hàng rong Long Biên",
    title: "Một gánh quà nhỏ ven cầu",
    body: owned ? "Bạn đã mua một món quà từ gánh hàng này." : "Một món quà nhỏ có giá 4.000đ.",
    actions: [
      action("Mua món quà · 4.000đ", () => {
        if (state.money < 4000) {
          closeChoiceModal();
          showMessage("Bạn chưa đủ tiền để mua món quà này.");
          return;
        }
        state.money -= 4000;
        if (!state.inventory.specialItems.includes(item)) state.inventory.specialItems.push(item);
        resolve(definition.id, "purchased", "Bạn nhận một món quà nhỏ gói bằng giấy nâu.");
      }, owned),
      action("Hỏi đường", () => resolve(definition.id, "directions", "Cô chỉ lối lên cầu và dặn bạn tránh đi sát đường ray khi có tín hiệu.")),
      action("Rời đi", closeChoiceModal)
    ]
  });
  return true;
}

function openChildrenInteraction(definition, active) {
  const games = ["nhảy dây", "đá cầu", "vẽ phấn", "chơi chuyền"];
  const game = games[Math.abs(Math.floor(active.startedAt)) % games.length];
  openChoiceModal({
    tag: "Sân nhỏ gần Nhà thờ",
    title: `Bọn trẻ đang ${game}`,
    body: "Các em chơi trong khoảng sân lát, tránh xa lòng đường.",
    actions: [
      action("Cổ vũ", () => resolve(definition.id, "cheered", "Bọn trẻ cười và tiếp tục trò chơi.")),
      action("Rời đi", closeChoiceModal)
    ]
  });
  return true;
}

function openCouplePhotoInteraction(definition) {
  openChoiceModal({
    tag: "Khoảnh khắc Hà Nội",
    title: definition.name,
    body: "Cặp đôi đang tạo dáng trước Nhà thờ. Mở chế độ ảnh bằng P tại điểm chụp để lưu khoảnh khắc sự kiện.",
    actions: [action("Đã hiểu", closeChoiceModal)]
  });
  return true;
}

function resolve(eventId, outcome, message, options = {}) {
  closeChoiceModal();
  if (!completeRandomEventInteraction(eventId, outcome, options)) return false;
  showMessage(message);
  return true;
}

function action(label, onClick, disabled = false) {
  return { label, onClick, disabled, className: disabled ? "" : "primary-choice" };
}
