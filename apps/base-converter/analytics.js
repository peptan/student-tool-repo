import { CONVERSION_CHOICES } from "./base-converter.js";
import { analyticsSummary, initialSummary, loadProgress } from "./progress-store.js";

const achievementCards = document.querySelector("#achievement-cards");
const directionChart = document.querySelector("#direction-chart");
const difficultyChart = document.querySelector("#difficulty-chart");

function rateText(rate) {
  return rate === null ? "未挑戦" : `${rate}%`;
}

function bar(label, rate, detail) {
  const safeRate = rate ?? 0;
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `<div class="bar-label"><strong>${label}</strong><span>${detail}</span></div><div class="bar-track" aria-label="${label} ${rateText(rate)}"><span class="bar-fill" style="width:${safeRate}%"></span></div><b>${rateText(rate)}</b>`;
  return row;
}

function render() {
  const progress = loadProgress();
  const summary = analyticsSummary(progress);
  const advanced = summary.difficulty[12];
  achievementCards.replaceChildren(...[
    ["通算で正解した問題", `${summary.solved}問`, "一度以上正解した重複なしの問題数"],
    ["通算の初回正解率", rateText(summary.initialRate), summary.initialAttempted ? `${summary.initialCorrect} / ${summary.initialAttempted}問` : "最初の10問を解くと表示されます"],
    ["発展問題を正解", `${advanced.solved}問`, "12ビットの問題を一度以上正解した数"]
  ].map(([label, value, note]) => {
    const card = document.createElement("article");
    card.className = "achievement-card";
    card.innerHTML = `<p>${label}</p><strong>${value}</strong><small>${note}</small>`;
    return card;
  }));

  directionChart.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const stat = initialSummary(progress, choice.id);
    const detail = stat.rate === null ? "初回の記録なし" : `${stat.initialCorrect} / ${stat.initialAttempted}問`;
    return bar(choice.label, stat.rate, detail);
  }));

  const levels = { 4: "基礎（4ビット）", 8: "標準（8ビット）", 12: "発展（12ビット）" };
  difficultyChart.replaceChildren(...[4, 8, 12].map((width) => {
    const stat = summary.difficulty[width];
    const rate = stat.initialAttempted ? Math.round((stat.initialCorrect / stat.initialAttempted) * 100) : null;
    const detail = stat.initialAttempted ? `初回 ${stat.initialCorrect} / ${stat.initialAttempted}問・通算正解 ${stat.solved}問` : "初回の記録なし";
    return bar(levels[width], rate, detail);
  }));
}

render();
