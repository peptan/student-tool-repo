import { CONVERSION_CHOICES, choicesForQuestion, createQuiz, gradeQuestion } from "./base-converter.js";
import { beginPracticeSet, conversionKey, loadProgress, recordGrades, reviewQuestions, saveProgress, setSummary } from "./progress-store.js";

const questionsElement = document.querySelector("#questions");
const form = document.querySelector("#quiz-form");
const result = document.querySelector("#result");
const newQuizButton = document.querySelector("#new-quiz");
const quizTitle = document.querySelector("#quiz-title");
const quizKind = document.querySelector("#quiz-kind");
const quizDescription = document.querySelector("#quiz-description");
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") === "review" ? "review" : "practice";
const selectedConversion = CONVERSION_CHOICES.find((choice) => choice.id === params.get("conversion"));
let questions = [];

if (mode === "practice" && !selectedConversion) window.location.replace("index.html");

function escapeHtml(value) {
  return String(value).replace(/[&<'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function optionMarkup(question, choice, index) {
  const inputId = `choice-${question.id}-${index}`;
  return `<label class="choice" for="${inputId}"><input id="${inputId}" type="radio" name="answer-${question.id}" value="${escapeHtml(choice)}"><span class="choice-letter">${"アイウエ"[index]}</span><span>${escapeHtml(choice)}</span></label>`;
}

function renderQuiz() {
  result.hidden = true;
  result.replaceChildren();
  const isReview = mode === "review";
  quizTitle.textContent = isReview ? "間違えた問題を復習" : selectedConversion.label;
  quizKind.textContent = "間違いを復習";
  quizKind.hidden = !isReview;
  quizDescription.hidden = !isReview;
  quizDescription.textContent = isReview ? `${questions.length}問の誤答を出しています。正解すると、このブラウザの復習リストから外れます。` : "";
  newQuizButton.hidden = isReview;
  newQuizButton.style.display = isReview ? "none" : "";
  questionsElement.replaceChildren(...questions.map((question, index) => {
    const article = document.createElement("article");
    article.className = "question";
    article.innerHTML = `<h2>問 ${index + 1}</h2><p class="prompt">${escapeHtml(question.prompt)}</p><fieldset class="choices" aria-label="問 ${index + 1} の選択肢">${question.choices.map((choice, choiceIndex) => optionMarkup(question, choice, choiceIndex)).join("")}</fieldset>`;
    return article;
  }));
}

function progressText(progress, grades) {
  const lines = [...new Set(grades.map((grade) => conversionKey(grade.question)))].map((key) => {
    const set = setSummary(progress, key);
    return set ? `${key.replace("-to-", "進数 → ")}進数：到達 ${set.mastered} / ${set.total}問（${set.masteryRate}%）、未正解 ${set.remaining}問` : null;
  }).filter(Boolean);
  return lines.join("　");
}

function renderResults(grades, progress) {
  const correct = grades.filter((grade) => grade.correct).length;
  const total = grades.length;
  const heading = document.createElement("div");
  heading.className = "score";
  const label = mode === "review" ? "今回の復習" : "初回の成績";
  heading.innerHTML = `<p class="eyebrow">${label}</p><h2>${correct}<span> / ${total}問 正解</span></h2><p>${progressText(progress, grades)}</p><p>正解・不正解にかかわらず、全問の解説を確認しましょう。</p>`;
  const list = document.createElement("div");
  list.className = "answer-list";
  grades.forEach((grade, index) => {
    const details = document.createElement("details");
    details.className = grade.correct ? "answer correct" : "answer incorrect";
    details.open = true;
    details.innerHTML = `<summary><span>問 ${index + 1}</span><strong>${grade.correct ? "正解" : "不正解"}</strong></summary><p class="answer-prompt">${escapeHtml(grade.question.prompt)}</p><dl><div><dt>選んだ答え</dt><dd>${escapeHtml(grade.submitted || "（未選択）")}</dd></div><div><dt>正答</dt><dd>${escapeHtml(grade.question.answer)}</dd></div></dl><p class="explanation"><b>解き方:</b> ${escapeHtml(grade.question.explanation)}</p>`;
    list.append(details);
  });
  const back = document.createElement("a");
  back.className = "button primary result-back";
  back.href = "index.html";
  back.textContent = "学習記録と変換メニューへ戻る";
  result.replaceChildren(heading, list, back);
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startQuiz() {
  if (mode === "review") {
    questions = reviewQuestions(loadProgress()).map((question) => ({ ...question, choices: question.choices?.length === 4 ? question.choices : choicesForQuestion(question) }));
  } else {
    questions = createQuiz(10, selectedConversion);
    saveProgress(beginPracticeSet(loadProgress(), questions));
  }
  if (questions.length === 0) {
    window.location.replace("index.html");
    return;
  }
  renderQuiz();
}

function gradeQuiz() {
  const grades = questions.map((question) => {
    const selected = document.querySelector(`input[name="answer-${question.id}"]:checked`);
    const submitted = selected?.value ?? "";
    return { question, submitted, correct: Boolean(selected) && gradeQuestion(question, submitted) };
  });
  const progress = recordGrades(loadProgress(), grades, mode);
  saveProgress(progress);
  renderResults(grades, progress);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  gradeQuiz();
});
newQuizButton.addEventListener("click", startQuiz);
startQuiz();
