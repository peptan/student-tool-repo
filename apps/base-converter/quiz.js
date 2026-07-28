import { CONVERSION_CHOICES, createQuiz, gradeQuestion, isValidAnswer } from "./base-converter.js";
import { loadProgress, recordGrades, reviewQuestions, saveProgress } from "./progress-store.js";

const questionsElement = document.querySelector("#questions");
const form = document.querySelector("#quiz-form");
const result = document.querySelector("#result");
const message = document.querySelector("#form-message");
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
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderQuiz() {
  result.hidden = true;
  result.replaceChildren();
  message.textContent = "";
  const isReview = mode === "review";
  quizTitle.textContent = isReview ? "間違えた問題を復習" : selectedConversion.label;
  quizKind.hidden = !isReview;
  quizDescription.hidden = !isReview;
  quizDescription.textContent = isReview ? `${questions.length}問の誤答を出しています。正解すると、このブラウザの復習リストから外れます。` : "";
  newQuizButton.hidden = isReview;
  newQuizButton.style.display = isReview ? "none" : "";
  questionsElement.replaceChildren(...questions.map((question, index) => {
    const article = document.createElement("article");
    article.className = "question";
    article.innerHTML = `
      <h2>問 ${index + 1}</h2>
      <p class="prompt">${escapeHtml(question.prompt)}</p>
      <input id="answer-${question.id}" name="answer-${question.id}" autocomplete="off" inputmode="text" aria-label="問 ${index + 1} の ${question.toBase}進数の答え" placeholder="答えを入力">
    `;
    return article;
  }));
}

function renderResults(grades) {
  const correct = grades.filter((grade) => grade.correct).length;
  const total = grades.length;
  const heading = document.createElement("div");
  heading.className = "score";
  heading.innerHTML = `<p class="eyebrow">採点結果</p><h2>${correct}<span> / ${total}問 正解</span></h2><p>${correct === total ? "満点です。メニューから次の変換に挑戦できます。" : "答えと式を見比べて、考え方を確認しましょう。間違えた問題はメニューから復習できます。"}</p>`;
  const list = document.createElement("div");
  list.className = "answer-list";
  grades.forEach((grade, index) => {
    const details = document.createElement("details");
    details.className = grade.correct ? "answer correct" : "answer incorrect";
    details.open = !grade.correct;
    details.innerHTML = `<summary><span>問 ${index + 1}</span><strong>${grade.correct ? "正解" : "復習"}</strong></summary><p class="answer-prompt">${escapeHtml(grade.question.prompt)}</p><dl><div><dt>あなたの答え</dt><dd>${escapeHtml(grade.submitted || "（未入力）")}</dd></div><div><dt>正答</dt><dd>${escapeHtml(grade.question.answer)}</dd></div></dl><p class="explanation"><b>解き方:</b> ${escapeHtml(grade.question.explanation)}</p>`;
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
  questions = mode === "review" ? reviewQuestions(loadProgress()) : createQuiz(10, selectedConversion);
  if (questions.length === 0) {
    window.location.replace("index.html");
    return;
  }
  renderQuiz();
}

function gradeQuiz() {
  const grades = questions.map((question) => {
    const input = document.querySelector(`#answer-${question.id}`);
    const submitted = input.value;
    const valid = isValidAnswer(submitted, question.toBase);
    input.classList.toggle("invalid", submitted.length > 0 && !valid);
    return { question, submitted, correct: valid && gradeQuestion(question, submitted) };
  });
  if (grades.some((grade) => grade.submitted.length > 0 && !isValidAnswer(grade.submitted, grade.question.toBase))) {
    message.textContent = "入力形式を確認してください。2進数は0と1、10進数は0〜9、16進数は0〜9とA〜Fだけを使います。";
    return;
  }
  const progress = recordGrades(loadProgress(), grades);
  saveProgress(progress);
  message.textContent = "";
  renderResults(grades);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  gradeQuiz();
});
newQuizButton.addEventListener("click", startQuiz);
startQuiz();
