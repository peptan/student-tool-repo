import { CONVERSION_CHOICES } from "./base-converter.js";
import { analyticsSummary, clearProgress, directionSummary, loadProgress } from "./progress-store.js";

const cards = document.querySelector("#conversion-cards");
const progressList = document.querySelector("#progress-list");
const summary = document.querySelector("#progress-summary");
const clearButton = document.querySelector("#clear-progress");

function statText(stat) {
  return stat.rate === null ? "まだ解いていません" : `${stat.correct} / ${stat.attempted}問 正解（${stat.rate}%）`;
}

function render() {
  const progress = loadProgress();
  const overall = analyticsSummary(progress);
  cards.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const stat = directionSummary(progress, choice.id);
    const card = document.createElement("a");
    card.className = "conversion-card";
    card.href = `quiz.html?conversion=${encodeURIComponent(choice.id)}`;
    card.innerHTML = `<span class="conversion-label">${choice.label}</span><span class="conversion-start">10問に挑戦する →</span><span class="conversion-stat">${statText(stat)}</span>`;
    return card;
  }));

  summary.textContent = overall.rate === null
    ? "問題を解くと、正解数と正解率を記録します。"
    : `これまでに ${overall.attempted}問解き、${overall.correct}問正解しました（正解率 ${overall.rate}%）。`;

  progressList.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const stat = directionSummary(progress, choice.id);
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `<span>${choice.label}</span><strong>${statText(stat)}</strong>`;
    return item;
  }));
}

clearButton.addEventListener("click", () => {
  const accepted = window.confirm("このブラウザに保存されている進数変換の学習記録を消去します。元に戻せません。消去しますか？");
  if (!accepted) return;
  clearProgress();
  render();
});

render();
