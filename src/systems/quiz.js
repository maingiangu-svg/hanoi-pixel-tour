import { runtime, state, ui } from "../state.js";
import { quizBank } from "../data/landmarks.js";
import { addUnique, findLandmark, findNpcTask, grantLandmarkRewards, isQuizCorrect } from "../utils/helpers.js";
import { formatMoney } from "../utils/format.js";
import { saveGame } from "../storage.js";
import { discoverLandmark } from "./journal.js";
import { checkAreaQuests, checkVictory } from "./questSystem.js";
import { showMessage } from "./modal.js";

export function openQuiz(quizId, context = {}) {
  const quiz = quizBank[quizId];
  if (!quiz) {
    showMessage("Câu hỏi này chưa sẵn sàng.");
    return;
  }

  if (isQuizCorrect(quizId)) {
    showMessage("Bạn đã trả lời đúng câu hỏi này rồi, phần thưởng chỉ nhận một lần.");
    return;
  }

  runtime.activeQuiz = { id: quizId, context, answered: false };
  runtime.quizSelectedIndex = 0;
  ui.quizTag.textContent = "Câu hỏi";
  ui.quizTitle.textContent = quiz.title;
  ui.quizQuestion.textContent = quiz.question;
  ui.quizOptions.innerHTML = "";
  ui.quizFeedback.textContent = "";
  ui.quizFeedback.classList.add("hidden");
  ui.quizContinue.classList.add("hidden");

  quiz.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.dataset.optionLabel = `${String.fromCharCode(65 + index)}. ${answer}`;
    button.textContent = button.dataset.optionLabel;
    button.addEventListener("click", () => {
      selectQuizOption(index);
      answerQuiz(index);
    });
    ui.quizOptions.appendChild(button);
  });

  renderQuizSelection();
  ui.quizModal.classList.remove("hidden");
  ui.nearbyHint.classList.add("hidden");
}

export function getQuizOptionButtons() {
  return Array.from(ui.quizOptions.querySelectorAll("button"));
}

export function selectQuizOption(index) {
  if (!runtime.activeQuiz || runtime.activeQuiz.answered) {
    return;
  }

  const buttons = getQuizOptionButtons();
  if (!buttons.length) {
    runtime.quizSelectedIndex = 0;
    return;
  }

  runtime.quizSelectedIndex = (index + buttons.length) % buttons.length;
  renderQuizSelection();
}

export function moveQuizSelection(delta) {
  selectQuizOption(runtime.quizSelectedIndex + delta);
}

export function confirmSelectedQuizOption() {
  if (!runtime.activeQuiz) {
    return;
  }

  if (runtime.activeQuiz.answered) {
    closeQuiz();
    return;
  }

  answerQuiz(runtime.quizSelectedIndex);
}

export function renderQuizSelection() {
  const buttons = getQuizOptionButtons();

  buttons.forEach((button, index) => {
    const label = button.dataset.optionLabel || button.textContent.replace(/^▶\s*/, "").trim();
    button.dataset.optionLabel = label;
    const selected = runtime.activeQuiz && !runtime.activeQuiz.answered && index === runtime.quizSelectedIndex;
    button.classList.toggle("is-selected", selected);
    button.textContent = selected ? `▶ ${label}` : label;
  });
}

export function answerQuiz(answerIndex) {
  if (!runtime.activeQuiz || runtime.activeQuiz.answered) {
    return;
  }

  const quiz = quizBank[runtime.activeQuiz.id];
  const buttons = getQuizOptionButtons();
  const correct = answerIndex === quiz.correctIndex;
  runtime.quizSelectedIndex = answerIndex;
  runtime.activeQuiz.answered = true;
  renderQuizSelection();

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === quiz.correctIndex) {
      button.classList.add("is-correct");
    }
    if (index === answerIndex && !correct) {
      button.classList.add("is-wrong");
    }
  });

  if (correct) {
    const rewardLines = completeQuiz(runtime.activeQuiz.id, runtime.activeQuiz.context);
    ui.quizFeedback.textContent = `Chính xác! ${quiz.explanation}\n${rewardLines.join(" ")}`;
  } else {
    rememberWrongAttempt(runtime.activeQuiz.id);
    ui.quizFeedback.textContent = `Chưa đúng. ${quiz.explanation}`;
  }

  ui.quizFeedback.classList.remove("hidden");
  ui.quizContinue.classList.remove("hidden");
  saveGame();
}

export function completeQuiz(quizId, context) {
  const quiz = quizBank[quizId];
  const rewards = [];

  state.completedQuizzes[quizId] = {
    correct: true,
    completedAt: Date.now()
  };
  state.money += quiz.reward;
  rewards.push(`Bạn nhận ${formatMoney(quiz.reward)}.`);

  if (quiz.souvenir) {
    addUnique(state.inventory.souvenirs, quiz.souvenir);
    rewards.push(`Thêm ${quiz.souvenir} vào tủ đồ.`);
  }

  if (context.landmarkId) {
    const landmark = findLandmark(context.landmarkId);
    discoverLandmark(landmark.id);
    grantLandmarkRewards(landmark).forEach((reward) => rewards.push(`Nhận ${reward}.`));
  }

  if (context.taskId) {
    handleQuizTaskProgress(context.taskId, context.quizChain, rewards);
  }

  checkAreaQuests(rewards);
  checkVictory();
  return rewards;
}

export function handleQuizTaskProgress(taskId, quizChain, rewards) {
  if (state.completedTasks[taskId]) {
    return;
  }

  const task = findNpcTask(taskId);
  if (!task) {
    return;
  }

  if (quizChain && quizChain.some((quizId) => !isQuizCorrect(quizId))) {
    rewards.push("Hãy nói chuyện tiếp để nhận câu hỏi còn lại.");
    return;
  }

  state.completedTasks[taskId] = true;

  if (task.reward) {
    state.money += task.reward;
    rewards.push(`Hoàn thành nhiệm vụ, nhận ${formatMoney(task.reward)}.`);
  }

  if (task.souvenir) {
    addUnique(state.inventory.souvenirs, task.souvenir);
    rewards.push(`Thêm ${task.souvenir} vào tủ đồ.`);
  }
}

export function rememberWrongAttempt(quizId) {
  const existing = state.completedQuizzes[quizId] || {};
  state.completedQuizzes[quizId] = {
    ...existing,
    correct: false,
    wrongAttempts: (existing.wrongAttempts || 0) + 1
  };
}

export function closeQuiz() {
  ui.quizModal.classList.add("hidden");
  runtime.activeQuiz = null;
  runtime.quizSelectedIndex = 0;
  renderQuizSelection();
  if (runtime.pendingVictory) {
    runtime.pendingVictory = false;
    checkVictory();
  }
}
