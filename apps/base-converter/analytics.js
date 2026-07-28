import { CONVERSION_CHOICES } from "./base-converter.js";
import { analyticsSummary, directionSummary, loadProgress } from "./progress-store.js";

const achievementCards = document.querySelector("#achievement-cards");
const directionChart = document.querySelector("#direction-chart");

function rateText(rate) {
  return rate === null ? "—" : `${rate}%`;
}

function bar(label, stat) {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `<div class="bar-label"><strong>${label}</strong><span>${stat.rate === null ? "未記録" : `${stat.correct} / ${stat.attempted}問 正解`}</span></div><div class="bar-track" aria-label="${label} ${rateText(stat.rate)}"><span class="bar-fill" style="width:${stat.rate ?? 0}%"></span></div><b>${rateText(stat.rate)}</b>`;
  return row;
}

function render() {
  const progress = loadProgress();
  const summary = analyticsSummary(progress);
  achievementCards.replaceChildren(...[
    ["解いた問題", `${summary.attempted}問`, "このブラウザで採点した問題数"],
    ["正解", `${summary.correct}問`, "採点で正解した問題数"],
    ["正解率", rateText(summary.rate), summary.rate === null ? "問題を解くと表示されます" : `${summary.correct} / ${summary.attempted}問`]
  ].map(([label, value, note]) => {
    const card = document.createElement("article");
    card.className = "achievement-card";
    card.innerHTML = `<p>${label}</p><strong>${value}</strong><small>${note}</small>`;
    return card;
  }));

  directionChart.replaceChildren(...CONVERSION_CHOICES.map((choice) => bar(choice.label, directionSummary(progress, choice.id))));
}

render();
