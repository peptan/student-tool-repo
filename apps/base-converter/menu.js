import { CONVERSION_CHOICES } from "./base-converter.js";
import { loadProgress, overallSummary, reviewQuestions, setSummary } from "./progress-store.js";

const cards = document.querySelector("#conversion-cards");
const progressList = document.querySelector("#progress-list");
const summary = document.querySelector("#progress-summary");
const reviewButton = document.querySelector("#review-mistakes");

function scoreText(score) {
  return score ? `${score.correct} / ${score.attempted}問` : "まだ採点していません";
}

function setText(set) {
  if (!set) return "新しい10問を開始する";
  return `到達状況 ${set.mastered} / ${set.total}問（${set.masteryRate}%）・未正解 ${set.remaining}問`;
}

function render() {
  const progress = loadProgress();
  const overall = overallSummary(progress);
  const mistakeCount = progress.mistakes.length;

  cards.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const set = setSummary(progress, choice.id);
    const card = document.createElement("a");
    card.className = "conversion-card";
    card.href = `quiz.html?mode=practice&conversion=${encodeURIComponent(choice.id)}`;
    card.innerHTML = `<span class="conversion-label">${choice.label}</span><span class="conversion-start">この変換の10問を開始する →</span><span class="conversion-stat">${setText(set)}</span>`;
    return card;
  }));

  if (progress.legacyNotice) {
    summary.textContent = `以前の「正解率」は全試行を混ぜた集計だったため、到達状況には使いません。誤答 ${mistakeCount}問は復習できます。新しい10問から、初回・復習・到達状況を分けて記録します。`;
  } else if (overall.total) {
    const rate = Math.round((overall.mastered / overall.total) * 100);
    summary.textContent = `現在の学習セットでは、${overall.mastered} / ${overall.total}問を一度以上正解しています（到達率 ${rate}%）。未正解は ${overall.total - overall.mastered}問です。`;
  } else {
    summary.textContent = "変換を選ぶと10問の学習セットを開始します。初回の成績、復習の成績、到達状況を分けて表示します。";
  }

  reviewButton.disabled = mistakeCount === 0;
  reviewButton.textContent = mistakeCount ? `間違いを復習（${mistakeCount}問）` : "間違いを復習（0問）";

  progressList.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const set = setSummary(progress, choice.id);
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = set
      ? `<span>${choice.label}</span><strong>到達 ${set.mastered} / ${set.total}問</strong><small>初回：${scoreText(set.initial)}　直近の復習：${scoreText(set.latestReview)}</small>`
      : `<span>${choice.label}</span><strong>未開始</strong>`;
    return item;
  }));
}

reviewButton.addEventListener("click", () => {
  if (reviewQuestions(loadProgress()).length > 0) window.location.href = "quiz.html?mode=review";
});

render();
