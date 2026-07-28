import { CONVERSION_CHOICES } from "./base-converter.js";
import { analyticsSummary, initialSummary, loadProgress } from "./progress-store.js";

const achievementCards = document.querySelector("#achievement-cards");
const directionChart = document.querySelector("#direction-chart");

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
  achievementCards.replaceChildren(...[
    ["通算で正解した問題", `${summary.solved} / ${summary.attempted}問`, "最初に出題された重複なしの問題を分母にしています"],
    ["通算の初回正解率", rateText(summary.initialRate), summary.initialAttempted ? `${summary.initialCorrect} / ${summary.initialAttempted}問` : "最初の10問を解くと表示されます"]
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
}

render();
