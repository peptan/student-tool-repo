import { CONVERSION_CHOICES } from "./base-converter.js";
import { accuracy, loadProgress, reviewQuestions } from "./progress-store.js";

const cards = document.querySelector("#conversion-cards");
const progressList = document.querySelector("#progress-list");
const summary = document.querySelector("#progress-summary");
const reviewButton = document.querySelector("#review-mistakes");

function statsText(stats) {
  const rate = accuracy(stats);
  return rate === null ? "未挑戦" : `正解率 ${rate}%（${stats.correct} / ${stats.attempted}問）`;
}

function render() {
  const progress = loadProgress();
  cards.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const stats = progress.stats[choice.id];
    const button = document.createElement("a");
    button.className = "conversion-card";
    button.href = `quiz.html?mode=practice&conversion=${encodeURIComponent(choice.id)}`;
    button.innerHTML = `<span class="conversion-label">${choice.label}</span><span class="conversion-start">この変換を練習する →</span><span class="conversion-stat">${statsText(stats)}</span>`;
    return button;
  }));

  const totalAttempted = Object.values(progress.stats).reduce((total, stats) => total + stats.attempted, 0);
  const totalCorrect = Object.values(progress.stats).reduce((total, stats) => total + stats.correct, 0);
  const mistakeCount = progress.mistakes.length;
  summary.textContent = totalAttempted
    ? `これまで ${totalAttempted}問中 ${totalCorrect}問正解（正解率 ${Math.round((totalCorrect / totalAttempted) * 100)}%）。間違いは ${mistakeCount}問です。`
    : "まだ採点記録はありません。問題を解くと変換ごとの正解率を表示します。";
  reviewButton.disabled = mistakeCount === 0;
  reviewButton.textContent = mistakeCount ? `間違いを復習（${mistakeCount}問）` : "間違いを復習（0問）";

  progressList.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const stats = progress.stats[choice.id];
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `<span>${choice.label}</span><strong>${statsText(stats)}</strong>`;
    return item;
  }));
}

reviewButton.addEventListener("click", () => {
  if (reviewQuestions(loadProgress()).length > 0) window.location.href = "quiz.html?mode=review";
});

render();
