const HOAN_KIEM = "hoanKiem";
const BA_DINH = "baDinh";
const LONG_BIEN = "longBien";

export const BRANCHING_OUTCOMES = Object.freeze([
  "excellent",
  "good",
  "neutral",
  "declined",
  "failed",
  "unresolved"
]);

export const branchingQuests = Object.freeze({
  lostTourist: {
    id: "lostTourist",
    title: "Du khách bị lạc",
    description: "Giúp một du khách ở Phố Cổ tìm đường tới Nhà thờ Lớn.",
    startNodeId: "offer",
    rewards: { excellent: 25000, good: 12000 },
    outcomeItems: { excellent: { souvenirs: ["Bưu thiếp cảm ơn từ du khách"] } },
    consequenceFlag: "touristHelped",
    nodes: {
      offer: choiceNode("Du khách bị lạc", "Tôi muốn tới Nhà thờ Lớn nhưng chưa quen đường. Bạn giúp tôi được không?", [
        choice("directions", "Chỉ đường nhanh", "directionQuestion"),
        choice("escort", "Dẫn tới tận nơi", "escort", [startFollower("lostTouristFollower", 1)]),
        choice("xeOm", "Gọi xe ôm giúp", "findDriver"),
        choice("decline", "Xin lỗi, mình đang bận", null, [complete("declined")], true)
      ]),
      directionQuestion: choiceNode("Chỉ đường tới Nhà thờ", "Từ Phố Cổ, nên đi về hướng nào để tới quảng trường trước Nhà thờ Lớn?", [
        choice("correctDirection", "Đi về phía đông nam, theo phố nhỏ tới sân Nhà thờ", null, [complete("good"), setFlag("touristAtCathedral", true)]),
        choice("wrongNorth", "Đi thẳng về phía bắc tới Cầu Long Biên", "retryDirections", [setOutcome("unresolved"), waitMinutes("retryAt", 20)]),
        choice("wrongWest", "Đi về phía tây tới Quảng trường Ba Đình", "retryDirections", [setOutcome("unresolved"), waitMinutes("retryAt", 20)])
      ]),
      retryDirections: objectiveNode("Du khách sẽ quay lại", "Chờ ít phút trong game rồi quay lại gặp du khách để sửa chỉ dẫn.", actorObjective("lostTourist", { notBeforeFlag: "retryAt" }), [goTo("directionQuestion")]),
      escort: objectiveNode("Dẫn du khách tới Nhà thờ", "Đưa du khách tới khoảng sân trước Nhà thờ Lớn.", reachObjective(HOAN_KIEM, 2483, 792, 84), [complete("excellent"), setFlag("touristAtCathedral", true)]),
      findDriver: objectiveNode("Tìm xe ôm", "Tìm chú xe ôm gần phố cổ và nhờ chú chở du khách.", actorObjective("touristQuestDriver"), [complete("good"), setFlag("touristUsedXeOm", true)])
    }
  },
  lostWallet: {
    id: "lostWallet",
    title: "Chiếc ví thất lạc",
    description: "Một chiếc ví nằm cạnh ghế đá ven phố. Hãy quyết định cách xử lý.",
    startNodeId: "offer",
    rewards: { excellent: 22000, good: 12000 },
    outcomeItems: { excellent: { souvenirs: ["Lời cảm ơn của chủ chiếc ví"] }, neutral: { specialItems: ["Chiếc ví thất lạc"] } },
    consequenceFlag: "walletResolved",
    nodes: {
      offer: choiceNode("Chiếc ví thất lạc", "Trong ví có một tấm vé cũ và tên viết tắt. Bạn sẽ làm gì?", [
        choice("findOwner", "Tìm chủ nhân", "askWitness"),
        choice("giveGuard", "Đưa cho bảo vệ", "giveGuard"),
        choice("keepWallet", "Giữ chiếc ví", null, [complete("neutral"), setFlag("keptWallet", true)], true)
      ]),
      askWitness: objectiveNode("Tìm manh mối", "Hỏi người ngồi gần ghế đá về chủ chiếc ví.", sequenceObjective(["walletWitness", "walletOwner"]), [complete("excellent"), setFlag("walletOwnerThankful", true)]),
      giveGuard: objectiveNode("Giao ví cho bảo vệ", "Mang chiếc ví tới chú bảo vệ gần phố đi bộ.", actorObjective("walletGuard"), [complete("good"), setFlag("walletWithGuard", true)])
    }
  },
  teaVendorHelp: {
    id: "teaVendorHelp",
    title: "Một tay giúp quán trà đá",
    description: "Giúp cô Hương xử lý một buổi bán hàng bận rộn bên Hồ Gươm.",
    startNodeId: "offer",
    rewards: { excellent: 18000, good: 11000, neutral: 5000 },
    outcomeItems: { excellent: { foods: ["Trà đá cô Hương mời"] }, good: { foods: ["Trà đá cô Hương mời"] } },
    consequenceFlag: "teaVendorHelped",
    nodes: {
      offer: weatherChoiceNode("Quán trà đá đang bận", "Cô Hương đang xoay xở với ghế, nước và khách. Bạn muốn giúp việc nào?", [
        choice("chairs", "Thu và xếp ghế gọn", "collectChairs"),
        choice("water", "Đi lấy thêm nước", "fetchWater"),
        choice("serve", "Ở lại phụ bán", "serveOne"),
        choice("decline", "Để cô tự thu xếp", null, [complete("declined")])
      ]),
      collectChairs: objectiveNode("Xếp ghế trà đá", "Tương tác với ba chiếc ghế nhựa quanh quầy.", sequenceObjective(["teaChairA", "teaChairB", "teaChairC"]), [complete("good")]),
      fetchWater: objectiveNode("Lấy thêm nước", "Tới cửa hàng tạp hóa lấy bình nước rồi quay lại quầy.", sequenceObjective(["teaWaterStore", "teaQuestVendor"]), [complete("good")]),
      serveOne: choiceNode("Phụ bán trà", "Khách vừa chạy bộ xong muốn một thức uống thật đơn giản. Bạn đưa món nào?", [
        choice("tea", "Trà đá", "serveTwo", [incrementFlag("servedCorrect", 1)]),
        choice("coffee", "Cà phê trứng", "serveTwo"),
        choice("juice", "Nước ngọt", "serveTwo")
      ]),
      serveTwo: choiceNode("Phụ bán trà", "Một bác lớn tuổi muốn cốc ít đá. Bạn xử lý thế nào?", [
        choice("lessIce", "Rót trà và cho ít đá", null, [incrementFlag("servedCorrect", 1), completeByFlag("servedCorrect", 2, "excellent", "neutral")]),
        choice("fullIce", "Cho đầy đá như mọi cốc", null, [completeByFlag("servedCorrect", 2, "excellent", "neutral")])
      ])
    }
  },
  childToy: {
    id: "childToy",
    title: "Món đồ chơi của bé Lan",
    description: "Bé Lan làm thất lạc con quay trong sân nhỏ gần Nhà thờ.",
    startNodeId: "offer",
    rewards: { excellent: 16000, good: 10000 },
    outcomeItems: { excellent: { stamps: ["Tem Người bạn nhỏ"] } },
    consequenceFlag: "childrenGreetPlayer",
    nodes: {
      offer: choiceNode("Món đồ chơi thất lạc", "Bé Lan không tìm thấy con quay gỗ vừa chơi trong sân.", [
        choice("search", "Tìm giúp", "searchToy"),
        choice("askMo", "Hỏi Mơ", "askMo"),
        choice("replace", "Mua đồ chơi thay thế", null, [spendMoney(12000), complete("good"), setFlag("toyReplaced", true)])
      ]),
      searchToy: objectiveNode("Tìm con quay", "Kiểm tra các manh mối trong sân rồi trả đồ chơi cho bé Lan.", sequenceObjective(["toyClueBench", "toyClueLaundry", "toyFound", "childLanQuest"]), [complete("excellent")]),
      askMo: objectiveNode("Hỏi Mơ", "Nói chuyện với Mơ để xin gợi ý. Nếu Mơ đang đi cùng, hãy tương tác với cô ấy.", { type: "talkToMo" }, [goTo("shortSearch")]),
      shortSearch: objectiveNode("Tìm theo gợi ý của Mơ", "Mơ nhớ con quay lăn về phía dây phơi. Tìm ở đó rồi trả cho bé Lan.", sequenceObjective(["toyFound", "childLanQuest"]), [complete("good")])
    }
  },
  elderCrossing: {
    id: "elderCrossing",
    title: "Qua đường an toàn",
    description: "Giúp một cụ ông qua giao lộ gần khu Ba Đình.",
    startNodeId: "offer",
    rewards: { excellent: 18000, good: 10000, neutral: 6000 },
    consequenceFlag: "elderHelped",
    nodes: {
      offer: choiceNode("Qua đường an toàn", "Cụ muốn sang vỉa hè bên kia nhưng ngại dòng xe.", [
        choice("escort", "Dẫn cụ qua đường", "escort", [startFollower("elderFollower", 1, 1.35)]),
        choice("askGuard", "Nhờ bảo vệ hỗ trợ", "askGuard"),
        choice("safeRoute", "Chỉ lối vòng an toàn", "safeRoute", [startFollower("elderFollower", 1, 1.2)])
      ]),
      escort: objectiveNode("Dẫn cụ qua đường", "Đi chậm cùng cụ tới vỉa hè đối diện.", reachObjective(BA_DINH, 600, 900, 70), [complete("excellent"), setFlag("trafficYielding", true)]),
      askGuard: objectiveNode("Tìm người hỗ trợ", "Nói chuyện với bảo vệ gần quảng trường.", actorObjective("crossingGuard"), [complete("good")]),
      safeRoute: objectiveNode("Đi theo lối vòng", "Dẫn cụ theo lối vỉa hè phía nam, tránh giao lộ đông.", reachObjective(BA_DINH, 520, 1550, 80), [complete("neutral")])
    }
  },
  tourGroup: {
    id: "tourGroup",
    title: "Hỗ trợ đoàn khách",
    description: "Chọn cách giúp hướng dẫn viên tại Văn Miếu - Ba Đình.",
    startNodeId: "offer",
    rewards: { excellent: 24000, good: 15000 },
    consequenceFlag: "guideRemembersPlayer",
    nodes: {
      offer: choiceNode("Hỗ trợ đoàn khách", "Đoàn khách cần thêm một người hỗ trợ. Bạn muốn nhận phần việc nào?", [
        choice("history", "Thuyết minh lịch sử", "historyOne"),
        choice("route", "Dẫn đoàn theo lộ trình", "route", [startFollower("tourGroupFollower", 3, 1.7)]),
        choice("photo", "Chụp ảnh cho đoàn", "photoDecision"),
        choice("decline", "Xin phép từ chối", null, [complete("declined")])
      ]),
      historyOne: choiceNode("Câu hỏi thuyết minh 1", "Quốc Tử Giám được lập dưới triều vua nào?", [
        choice("lyNhanTong", "Lý Nhân Tông", "historyTwo", [incrementFlag("historyCorrect", 1)]),
        choice("lyThanhTong", "Lý Thánh Tông", "historyTwo"),
        choice("tranNhanTong", "Trần Nhân Tông", "historyTwo")
      ]),
      historyTwo: choiceNode("Câu hỏi thuyết minh 2", "Bia tiến sĩ ở Văn Miếu ghi danh những người đỗ loại kỳ thi nào?", [
        choice("dinh", "Các khoa thi Đình", null, [incrementFlag("historyCorrect", 1), completeByFlag("historyCorrect", 2, "excellent", "good")]),
        choice("huong", "Các kỳ thi Hương", null, [completeByFlag("historyCorrect", 2, "excellent", "good")]),
        choice("vo", "Các kỳ thi võ", null, [completeByFlag("historyCorrect", 2, "excellent", "good")])
      ]),
      route: objectiveNode("Dẫn đoàn tham quan", "Đi lần lượt qua Quảng trường Ba Đình, Chùa Một Cột và cổng Văn Miếu.", routeObjective([
        { id: "tourPlaza", x: 760, y: 748 },
        { id: "tourPagoda", x: 1718, y: 600 },
        { id: "tourTemple", x: 1100, y: 1422 }
      ], BA_DINH), [complete("excellent")]),
      photoDecision: choiceNode("Ảnh đoàn khách", "Bạn muốn dùng ảnh Cổng Văn Miếu đã có trong Album hay chụp một tấm mới?", [
        choice("retakePhoto", "Chụp ảnh mới", "photo"),
        choice("useOldPhoto", "Dùng ảnh trong Album", null, [complete("good")], false, "photo:photo-cong-van-mieu")
      ]),
      photo: objectiveNode("Chụp ảnh cho đoàn", "Chụp tại điểm ảnh Cổng Văn Miếu. Ảnh mới sẽ được lưu trong Album hiện tại.", { type: "photo", spotId: "photo-cong-van-mieu" }, [complete("good")])
    }
  },
  transportChoice: {
    id: "transportChoice",
    title: "Chọn đường tới Long Biên",
    description: "Chọn phương tiện từ Hoàn Kiếm tới Long Biên.",
    startNodeId: "offer",
    rewards: { excellent: 16000, good: 12000, neutral: 8000 },
    consequenceFlag: "transportLessonComplete",
    nodes: {
      offer: choiceNode("Đi tới Long Biên", "Bạn muốn trải nghiệm phương tiện nào cho chặng tiếp theo?", [
        choice("bus", "Đi xe buýt", "travelBus", [setFlag("transportChoice", "bus")]),
        choice("vinfast", "Dùng VinFast", "travelVinFast", [setFlag("transportChoice", "vinfast")], false, "vehicleOwned"),
        choice("xeOm", "Đi xe ôm", "findTransportDriver", [setFlag("transportChoice", "xeOm")]),
        choice("walk", "Đi bộ theo lối nối khu", "travelWalk", [setFlag("transportChoice", "walk")])
      ]),
      travelBus: objectiveNode("Đi xe buýt", "Dùng một trạm xe buýt để tới Long Biên.", transportObjective(LONG_BIEN, "bus"), [complete("excellent")]),
      travelVinFast: objectiveNode("Đi VinFast", "Lái VinFast tới lối chuyển khu Long Biên.", transportObjective(LONG_BIEN, "vinfast"), [complete("excellent")]),
      findTransportDriver: objectiveNode("Tìm xe ôm", "Nói chuyện với chú xe ôm gần điểm đón và trả 12.000đ.", actorObjective("transportQuestDriver"), [spendMoney(12000), questTravel(LONG_BIEN, 150, 890), complete("good")]),
      travelWalk: objectiveNode("Đi bộ tới Long Biên", "Đi bộ qua lối đường bộ nối sang khu Long Biên.", transportObjective(LONG_BIEN, "walk"), [complete("neutral")])
    }
  },
  moDestination: {
    id: "moDestination",
    title: "Mơ muốn đi đâu?",
    description: "Chọn một điểm ghé nhỏ trong lúc đi chơi cùng Mơ.",
    startNodeId: "offer",
    availability: "moCompanion",
    rewards: { good: 5000, neutral: 0 },
    consequenceFlag: "moOutingMemory",
    nodes: {
      offer: choiceNode("Đi đâu cùng Mơ?", "Mơ mỉm cười: Chúng mình ghé đâu trước nhỉ?", [
        choice("lake", "Hồ Gươm", "lake"),
        choice("temple", "Văn Miếu", "temple"),
        choice("bridge", "Cầu Long Biên", "bridge"),
        choice("tea", "Quán trà đá", "tea"),
        choice("free", "Tiếp tục đi tự do", null, [complete("neutral")])
      ]),
      lake: objectiveNode("Đi dạo Hồ Gươm", "Đưa Mơ tới lối đi ven Hồ Gươm.", reachObjective(HOAN_KIEM, 1226, 1020, 100), [complete("good"), setFlag("moDestination", "hoGuom")]),
      temple: objectiveNode("Ghé Văn Miếu", "Đưa Mơ tới cổng Văn Miếu.", reachObjective(BA_DINH, 1100, 1422, 110), [complete("good"), setFlag("moDestination", "vanMieu")]),
      bridge: objectiveNode("Ngắm Cầu Long Biên", "Đưa Mơ tới lối lên Cầu Long Biên.", reachObjective(LONG_BIEN, 1125, 610, 110), [complete("good"), setFlag("moDestination", "cauLongBien")]),
      tea: objectiveNode("Ghé quán trà đá", "Đưa Mơ tới quầy trà đá Bờ Hồ.", reachObjective(HOAN_KIEM, 1040, 1200, 105), [complete("good"), setFlag("moDestination", "traDa")])
    }
  }
});

export const branchingQuestActors = Object.freeze([
  actor("lostTourist", "Du khách bị lạc", "lostTourist", HOAN_KIEM, 1030, 1190, { start: true, hideWhileFollower: true, color: "#70c8e8", completedPosition: { x: 2460, y: 808, flag: "touristAtCathedral" } }),
  actor("touristQuestDriver", "Chú xe ôm đầu phố", "lostTourist", HOAN_KIEM, 700, 1290, { nodes: ["findDriver"], color: "#e0ad4e", activity: "xeOm" }),
  actor("lostWallet", "Chiếc ví", "lostWallet", HOAN_KIEM, 1160, 1248, { start: true, kind: "item", hideWhenCompleted: true }),
  actor("walletWitness", "Bác ngồi ghế đá", "lostWallet", HOAN_KIEM, 1210, 1210, { nodes: ["askWitness"], completedFlag: "keptWallet", color: "#9b8bd4" }),
  actor("walletOwner", "Chủ chiếc ví", "lostWallet", HOAN_KIEM, 1510, 1230, { nodes: ["askWitness"], completedFlag: "walletOwnerThankful", color: "#db7f72" }),
  actor("walletGuard", "Chú bảo vệ phố đi bộ", "lostWallet", HOAN_KIEM, 2080, 1230, { nodes: ["giveGuard"], completedFlag: "walletWithGuard", color: "#507aa8" }),
  actor("teaQuestVendor", "Cô bán trà đá Bờ Hồ", "teaVendorHelp", HOAN_KIEM, 1040, 1200, { start: true, nodes: ["fetchWater"], render: false, linkedNpcId: "teaSellerHoGuom" }),
  actor("teaChairA", "Ghế nhựa đỏ", "teaVendorHelp", HOAN_KIEM, 1082, 1222, { nodes: ["collectChairs"], kind: "chair" }),
  actor("teaChairB", "Ghế nhựa xanh", "teaVendorHelp", HOAN_KIEM, 1110, 1212, { nodes: ["collectChairs"], kind: "chair" }),
  actor("teaChairC", "Ghế nhựa vàng", "teaVendorHelp", HOAN_KIEM, 1098, 1242, { nodes: ["collectChairs"], kind: "chair" }),
  actor("teaWaterStore", "Cửa hàng nước", "teaVendorHelp", HOAN_KIEM, 960, 910, { nodes: ["fetchWater"], kind: "shop" }),
  actor("childLanQuest", "Bé Lan", "childToy", HOAN_KIEM, 2474, 1100, { start: true, nodes: ["searchToy", "shortSearch"], color: "#f2bd45", child: true, replacesScheduledNpcId: "childLan" }),
  actor("toyClueBench", "Dấu chân cạnh ghế", "childToy", HOAN_KIEM, 2518, 1110, { nodes: ["searchToy"], kind: "clue" }),
  actor("toyClueLaundry", "Vết lăn dưới dây phơi", "childToy", HOAN_KIEM, 2438, 1098, { nodes: ["searchToy"], kind: "clue" }),
  actor("toyFound", "Con quay gỗ", "childToy", HOAN_KIEM, 2404, 1112, { nodes: ["searchToy", "shortSearch"], kind: "item" }),
  actor("elderQuest", "Cụ ông qua đường", "elderCrossing", BA_DINH, 405, 1090, { start: true, hideWhileFollower: true, color: "#b79a77" }),
  actor("crossingGuard", "Bảo vệ Ba Đình", "elderCrossing", BA_DINH, 610, 930, { nodes: ["askGuard"], color: "#507aa8" }),
  actor("tourGuideQuest", "Trợ lý hướng dẫn đoàn", "tourGroup", BA_DINH, 1980, 1320, { start: true, hideWhileFollower: true, color: "#cc6d67" }),
  actor("transportHost", "Nhân viên điểm trung chuyển", "transportChoice", HOAN_KIEM, 430, 1370, { start: true, color: "#7252a8" }),
  actor("transportQuestDriver", "Chú xe ôm điểm đón", "transportChoice", HOAN_KIEM, 470, 1300, { nodes: ["findTransportDriver"], color: "#e0ad4e", activity: "xeOm" })
]);

export const branchingQuestActorsById = Object.freeze(Object.fromEntries(branchingQuestActors.map((entry) => [entry.id, entry])));

function choiceNode(title, body, choices) {
  return { type: "choice", title, body, choices };
}

function weatherChoiceNode(title, body, choices) {
  return { type: "choice", title, body, choices, weatherAware: true };
}

function objectiveNode(title, hint, objective, onComplete) {
  return { type: "objective", title, hint, objective, onComplete };
}

function choice(id, text, nextNodeId, effects = [], confirm = false, requires = null) {
  return { id, text, nextNodeId, effects, confirm, requires };
}

function actor(id, name, questId, mapId, x, y, options = {}) {
  return { id, name, questId, mapId, x, y, width: options.child ? 20 : 24, height: options.child ? 34 : 46, radius: 62, visibleRange: 180, ...options };
}

function actorObjective(actorId, options = {}) { return { type: "interactActor", actorId, ...options }; }
function sequenceObjective(actorIds) { return { type: "actorSequence", actorIds }; }
function reachObjective(mapId, x, y, radius) { return { type: "reachPoint", mapId, x, y, radius }; }
function routeObjective(points, mapId) { return { type: "routePoints", mapId, points }; }
function transportObjective(mapId, method) { return { type: "transport", mapId, method }; }
function complete(outcome) { return { type: "complete", outcome }; }
function goTo(nodeId) { return { type: "goTo", nodeId }; }
function setFlag(key, value) { return { type: "setFlag", key, value }; }
function incrementFlag(key, amount) { return { type: "incrementFlag", key, amount }; }
function setOutcome(outcome) { return { type: "setOutcome", outcome }; }
function completeByFlag(key, minimum, passOutcome, failOutcome) { return { type: "completeByFlag", key, minimum, passOutcome, failOutcome }; }
function startFollower(actorId, groupCount, speed = 2.15) { return { type: "startFollower", actorId, groupCount, speed }; }
function spendMoney(amount) { return { type: "spendMoney", amount }; }
function questTravel(mapId, x, y) { return { type: "questTravel", mapId, x, y }; }
function waitMinutes(key, amount) { return { type: "waitMinutes", key, amount }; }
