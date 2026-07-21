import { state } from "../state.js";
import { saveGame } from "../storage.js";
import { addUnique, isQuizCorrect } from "../utils/helpers.js";
import { enterNpcDialogue } from "./dialogueView.js";
import { showMessage } from "./modal.js";
import { openQuiz } from "./quiz.js";

export function openCinematicNpcTask(npc, task, { completeTask } = {}) {
  const vehicleNote = npc.activity === "xeOm" && state.vehicle?.owned
    ? " Thấy cháu có VinFast rồi, chú vẫn sẵn lòng chỉ đường."
    : "";
  if (!task) {
    return enterNpcDialogue(npc, {
      text: "Chúc bạn có một chuyến đi vui vẻ.",
      expression: "gentleSmile"
    });
  }
  if (task.taskId && state.completedTasks[task.taskId]) {
    return enterNpcDialogue(npc, {
      text: task.done || "Cảm ơn bạn nhé!",
      expression: "happy"
    });
  }
  if (["simple", "ambient"].includes(task.type)) {
    return enterNpcDialogue(npc, {
      text: task.intro,
      expression: "neutral",
      choices: [
        {
          text: task.action || "Trò chuyện",
          expression: "happy",
          pose: "gesture",
          response: { text: task.done || "Cảm ơn bạn đã giúp.", expression: "happy", pose: "gesture" },
          afterClose: () => completeTask?.(task)
        },
        { text: "Rời đi" }
      ]
    });
  }
  if (task.type === "chat") {
    return enterNpcDialogue(npc, {
      text: `${task.intro}${vehicleNote}`,
      expression: "neutral",
      choices: [
        {
          text: task.action || "Trò chuyện",
          expression: "happy",
          pose: "gesture",
          response: { text: task.done || "Cảm ơn bạn đã ghé lại.", expression: "happy", pose: "gesture" }
        },
        { text: "Rời đi" }
      ]
    });
  }
  if (task.type === "quiz") {
    return enterNpcDialogue(npc, {
      text: task.intro,
      expression: "curious",
      choices: [
        { text: "Trả lời", expression: "determined", afterClose: () => openQuiz(task.quizId, { npcId: npc.id, taskId: task.taskId }) },
        { text: "Để sau" }
      ]
    });
  }
  if (task.type === "quizChain") {
    const nextQuiz = task.quizIds.find((quizId) => !isQuizCorrect(quizId));
    if (!nextQuiz) {
      completeTask?.(task);
      return true;
    }
    return enterNpcDialogue(npc, {
      text: task.intro,
      expression: "curious",
      pose: "explain",
      choices: [
        {
          text: "Bắt đầu",
          expression: "determined",
          afterClose: () => openQuiz(nextQuiz, { npcId: npc.id, taskId: task.taskId, quizChain: task.quizIds })
        },
        { text: "Để sau" }
      ]
    });
  }
  if (task.type === "requiresStampQuiz") {
    if (!state.inventory.stamps.includes(task.requiredStamp)) {
      return enterNpcDialogue(npc, { text: task.intro, expression: "concerned" });
    }
    return enterNpcDialogue(npc, {
      text: "Bạn đã có con tem cần thiết. Chúng ta bắt đầu nhé?",
      expression: "happy",
      choices: [
        { text: "Trả lời", afterClose: () => openQuiz(task.quizId, { npcId: npc.id, taskId: task.taskId }) },
        { text: "Để sau" }
      ]
    });
  }
  if (task.type === "delivery") {
    if (state.taskStages[task.taskId] === "accepted") {
      return enterNpcDialogue(npc, {
        text: "Gói hàng đang chờ ở Chợ Đồng Xuân. Cháu đem đến quầy chính giúp bác nhé.",
        expression: "concerned"
      });
    }
    return enterNpcDialogue(npc, {
      text: task.intro,
      expression: "concerned",
      choices: [
        {
          text: "Nhận gói hàng",
          expression: "happy",
          response: { text: "Cảm ơn cháu. Nhớ mang gói hàng tới quầy chính Chợ Đồng Xuân nhé.", expression: "happy" },
          afterClose: () => acceptDeliveryTask(task)
        },
        { text: "Rời đi" }
      ]
    });
  }
  return false;
}

function acceptDeliveryTask(task) {
  if (state.taskStages[task.taskId] === "accepted") return;
  state.taskStages[task.taskId] = "accepted";
  addUnique(state.inventory.specialItems, task.packageItem);
  saveGame();
  showMessage("Bạn đã nhận Gói hàng nhỏ. Hãy mang đến Chợ Đồng Xuân.");
}
