import { CONVERSION_CHOICES } from "./base-converter.js";
import { initialSummary, loadProgress, overallSummary, reviewQuestions, setSummary } from "./progress-store.js";

const cards = document.querySelector("#conversion-cards");
const progressList = document.querySelector("#progress-list");
const summary = document.querySelector("#progress-summary");
const reviewButton = document.querySelector("#review-mistakes");

function scoreText(score) {
  return score ? `${score.correct} / ${score.attempted}問` : "まだ採点していません";
}

function initialText(progress, key) {
  const initial = initialSummary(progress, key);
  return initial.rate === null ? "通算初回：未挑戦" : `通算初回：${initial.rate}%（${initial.initialCorrect} / ${initial.initialAttempted}問）`;
}

function setText(progress, key) {
  const set = setSummary(progress, key);
  return set ? `今回：${set.mastered} / ${set.total}問正解済み・未正解 ${set.remaining}問` : initialText(progress, key);
}

function render() {
  const progress = loadProgress();
  const overall = overallSummary(progress);
  const mistakeCount = progress.mistakes.length;

  cards.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const card = document.createElement("a");
    card.className = "conversion-card";
    card.href = `quiz.html?mode=practice&conversion=${encodeURIComponent(choice.id)}`;
    card.innerHTML = `<span class="conversion-label">${choice.label}</span><span class="conversion-start">この変換の10問を開始する →</span><span class="conversion-stat">${setText(progress, choice.id)}</span>`;
    return card;
  }));

  if (progress.legacyNotice) {
    summary.textContent = `以前の集計は到達状況に混ぜません。誤答 ${mistakeCount}問は復習できます。新しい10問から、通算初回成績と到達状況を分けて記録します。`;
  } else if (overall.total) {
    const rate = Math.round((overall.mastered / overall.total) * 100);
    summary.textContent = `現在の学習セットでは、${overall.mastered} / ${overall.total}問を一度以上正解しています（到達率 ${rate}%）。未正解は ${overall.total - overall.mastered}問です。`;
  } else {
    summary.textContent = "変換を選ぶと10問の学習セットを開始します。初回の成績・復習・通算分析を分けて記録します。";
  }

  reviewButton.disabled = mistakeCount === 0;
  reviewButton.textContent = mistakeCount ? `間違いを復習（${mistakeCount}問）` : "間違いを復習（0問）";

  progressList.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const set = setSummary(progress, choice.id);
    const initial = initialSummary(progress, choice.id);
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `<span>${choice.label}</span><strong>${initial.rate === null ? "初回：未挑戦" : `通算初回 ${initial.rate}%`}</strong>${set ? `<small>今回：${set.mastered}/${set.total}　初回：${scoreText(set.initial)}　復習：${scoreText(set.latestReview)}</small>` : ""}`;
    return item;
  }));
}

reviewButton.addEventListener("click", () => {
  if (reviewQuestions(loadProgress()).length > 0) window.location.href = "quiz.html?mode=review";
});

render();
