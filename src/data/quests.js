import { AREA_REWARD } from "../state.js";

export const areaQuests = {
  hoanKiem: {
    name: "Hoàn Kiếm - Phố Cổ",
    stamps: ["Tem check-in Hồ Gươm", "Tem Đền Ngọc Sơn", "Tem Phố Cổ"],
    reward: AREA_REWARD
  },
  baDinh: {
    name: "Ba Đình - Văn Miếu",
    stamps: ["Tem Lăng Bác", "Tem Chùa Một Cột", "Tem Văn Miếu"],
    reward: AREA_REWARD
  },
  longBien: {
    name: "Long Biên - Đồng Xuân",
    stamps: ["Tem Cầu Long Biên", "Tem Chợ Đồng Xuân"],
    reward: AREA_REWARD
  }
};

export const sideQuestReward = {
  small: 15000,
  medium: 22000,
  large: 30000,
  route: 35000
};

export const sideQuests = [
  {
    id: "hoanKiemDiSanVenHo",
    title: "Vòng hồ và phố cổ",
    description: "Đi một vòng qua các điểm di sản trung tâm để hiểu lớp đô thị quanh Hồ Gươm.",
    reward: sideQuestReward.large,
    objectives: [
      { type: "stamp", value: "Tem check-in Hồ Gươm", text: "Check-in Hồ Gươm." },
      { type: "stamp", value: "Tem Đền Ngọc Sơn", text: "Tìm hiểu Đền Ngọc Sơn." },
      { type: "stamp", value: "Tem Cầu Thê Húc", text: "Ghé đầu Cầu Thê Húc." },
      { type: "stamp", value: "Tem Nhà thờ Lớn Hà Nội", text: "Ghé Nhà thờ Lớn Hà Nội." }
    ]
  },
  {
    id: "phoCoAmThuc",
    title: "Ăn trong phố cũ",
    description: "Khám phá nhịp phố cổ qua món ăn, đồ uống và một điểm check-in lâu đời.",
    reward: sideQuestReward.medium,
    objectives: [
      { type: "food", value: "bunCha", text: "Thưởng thức Bún Chả Hà Nội." },
      { type: "food", value: "caPheTrung", text: "Thưởng thức Cà Phê Trứng." },
      { type: "stamp", value: "Tem Phố Cổ", text: "Check-in Phố Cổ." }
    ]
  },
  {
    id: "trucBaDinh",
    title: "Trục lịch sử Ba Đình",
    description: "Đi qua quảng trường, lăng và chùa để đọc lớp lịch sử trang nghiêm của Ba Đình.",
    reward: sideQuestReward.large,
    objectives: [
      { type: "stamp", value: "Tem Quảng trường Ba Đình", text: "Tìm hiểu Quảng trường Ba Đình." },
      { type: "stamp", value: "Tem Lăng Bác", text: "Check-in Lăng Bác." },
      { type: "stamp", value: "Tem Chùa Một Cột", text: "Check-in Chùa Một Cột." }
    ]
  },
  {
    id: "thangLongHieuHoc",
    title: "Từ Hoàng Thành tới Văn Miếu",
    description: "Nối hai lớp ký ức: trung tâm quyền lực Thăng Long và truyền thống hiếu học.",
    reward: sideQuestReward.route,
    objectives: [
      { type: "stamp", value: "Tem Hoàng Thành Thăng Long", text: "Tìm hiểu Hoàng Thành Thăng Long." },
      { type: "stamp", value: "Tem Văn Miếu", text: "Check-in Văn Miếu - Quốc Tử Giám." },
      { type: "task", value: "studentVanMieu", text: "Hoàn thành câu hỏi của Sinh viên." }
    ]
  },
  {
    id: "songHongChoCu",
    title: "Sông Hồng và chợ cũ",
    description: "Đi từ bờ sông đến chợ để nhìn Hà Nội qua giao thương và hạ tầng đô thị.",
    reward: sideQuestReward.large,
    objectives: [
      { type: "stamp", value: "Tem Cầu Long Biên", text: "Check-in Cầu Long Biên." },
      { type: "stamp", value: "Tem Sông Hồng", text: "Quan sát Sông Hồng." },
      { type: "stamp", value: "Tem Chợ Đồng Xuân", text: "Tìm hiểu Chợ Đồng Xuân." }
    ]
  },
  {
    id: "amThucLongBien",
    title: "Vị phố ven cầu",
    description: "Nếm các món bình dân quanh Long Biên và hiểu thêm một thức quà Hà Nội.",
    reward: sideQuestReward.medium,
    objectives: [
      { type: "food", value: "phoGanh", text: "Thưởng thức Phở Gánh." },
      { type: "food", value: "comLangVong", text: "Thưởng thức Cốm Làng Vòng." },
      { type: "food", value: "traDa", text: "Uống Trà Đá Vỉa Hè." },
      { type: "task", value: "comCulture", text: "Trả lời câu hỏi của Cô bán cốm." }
    ]
  },
  {
    id: "tuyenXeBuytDoThi",
    title: "Tuyến xe buýt đô thị",
    description: "Dùng xe buýt để nối ba khu vực lớn của chuyến tham quan.",
    reward: sideQuestReward.small,
    objectives: [
      { type: "map", value: "hoanKiem", text: "Có mặt tại Hoàn Kiếm." },
      { type: "map", value: "baDinh", text: "Có mặt tại Ba Đình - Văn Miếu." },
      { type: "map", value: "longBien", text: "Có mặt tại Long Biên - Đồng Xuân." },
      { type: "item", value: "Vé xe buýt", text: "Giữ ít nhất một Vé xe buýt trong tủ đồ." }
    ]
  },
  {
    id: "vinfastThuPho",
    title: "Nhịp phố điện",
    description: "Sở hữu xe máy điện VinFast rồi thử di chuyển qua các khu đô thị khác nhau.",
    reward: sideQuestReward.medium,
    objectives: [
      { type: "vehicleOwned", value: "vinfast-electric", text: "Mua xe máy điện VinFast." },
      { type: "visitedMapCount", value: 3, text: "Ghé đủ 3 khu vực sau khi có xe." }
    ]
  },
  {
    id: "hocGiaLichSu",
    title: "Học giả lịch sử nhỏ",
    description: "Trả lời nhiều câu hỏi sâu hơn để chứng minh bạn thật sự đọc hiểu câu chuyện địa danh.",
    reward: sideQuestReward.large,
    objectives: [
      { type: "quizCount", value: 8, text: "Trả lời đúng ít nhất 8 câu hỏi." }
    ]
  },
  {
    id: "nguoiBanDuong",
    title: "Những người bạn trên đường",
    description: "Giúp các NPC chính trong chuyến tour và nhận lại các mẩu chuyện nhỏ của Hà Nội.",
    reward: sideQuestReward.route,
    objectives: [
      { type: "task", value: "vendorIntro", text: "Giúp Cô bán hàng giới thiệu món ăn." },
      { type: "task", value: "touristPostcard", text: "Giúp Du khách nước ngoài hiểu về Hồ Gươm." },
      { type: "task", value: "guideHistoryChain", text: "Hoàn thành chuỗi câu hỏi của Hướng dẫn viên." },
      { type: "task", value: "deliveryDongXuan", text: "Hoàn thành việc gửi gói hàng Đồng Xuân." }
    ]
  },
  {
    id: "nhipSongCongCong",
    title: "Nhịp sống nơi công cộng",
    description: "Gặp những người đang hẹn hò, nhảy múa, tập thể dục và chạy bộ trong thành phố.",
    reward: sideQuestReward.medium,
    objectives: [
      { type: "task", value: "ambientCoupleHoGuom", text: "Trò chuyện với đôi bạn bên Hồ Gươm." },
      { type: "task", value: "ambientDanceNhaTho", text: "Gặp nhóm nhảy phố đi bộ." },
      { type: "task", value: "ambientExerciseBaDinh", text: "Nghe người tập thể dục ở Ba Đình." },
      { type: "task", value: "ambientJogVanMieu", text: "Chào người chạy bộ gần Văn Miếu." },
      { type: "task", value: "ambientRiversideWalker", text: "Gặp người đi dạo ven sông." }
    ]
  },
  {
    id: "gocNhaThoCaPhe",
    title: "Góc Nhà thờ và cà phê",
    description: "Ghé khu Nhà thờ Lớn rồi tìm một hương vị cà phê gắn với phố cổ Hà Nội.",
    reward: sideQuestReward.medium,
    objectives: [
      { type: "stamp", value: "Tem Nhà thờ Lớn Hà Nội", text: "Check-in Nhà thờ Lớn Hà Nội." },
      { type: "food", value: "caPheTrung", text: "Thưởng thức Cà Phê Trứng." }
    ]
  }
];
