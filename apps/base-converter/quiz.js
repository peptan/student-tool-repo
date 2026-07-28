import { CONVERSION_CHOICES, createQuiz, gradeQuestion } from "./base-converter.js";
import { loadProgress, recordGrades, saveProgress } from "./progress-store.js";

const questionsElement = document.querySelector("#questions");
const form = document.querySelector("#quiz-form");
const result = document.querySelector("#result");
const newQuizButton = document.querySelector("#new-quiz");
const quizTitle = document.querySelector("#quiz-title");
const params = new URLSearchParams(window.location.search);
const selectedConversion = CONVERSION_CHOICES.find((choice) => choice.id === params.get("conversion"));
let questions = [];

if (!selectedConversion) window.location.replace("index.html");

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
  quizTitle.textContent = selectedConversion.label;
  questionsElement.replaceChildren(...questions.map((question, index) => {
    const article = document.createElement("article");
    article.className = "question";
    article.innerHTML = `<h2>問 ${index + 1}</h2><p class="prompt">${escapeHtml(question.prompt)}</p><fieldset class="choices" aria-label="問 ${index + 1} の選択肢">${question.choices.map((choice, choiceIndex) => optionMarkup(question, choice, choiceIndex)).join("")}</fieldset>`;
    return article;
  }));
}

function renderResults(grades) {
  const correct = grades.filter((grade) => grade.correct).length;
  const heading = document.createElement("div");
  heading.className = "score";
  heading.innerHTML = `<h2>${correct}<span> / ${grades.length}問 正解</span></h2><p>正解・不正解にかかわらず、全問の解説を確認しましょう。</p>`;
  const list = document.createElement("div");
  list.className = "answer-list";
  grades.forEach((grade, index) => {
    const details = document.createElement("details");
    details.className = grade.correct ? "answer correct" : "answer incorrect";
    details.open = true;
    details.innerHTML = `<summary><span>問 ${index + 1}</span><strong>${grade.correct ? "正解" : "不正解"}</strong></summary><p class="answer-prompt">${escapeHtml(grade.question.prompt)}</p><dl class="answer-values"><div><dt>選んだ答え</dt><dd>${escapeHtml(grade.submitted || "（未選択）")}</dd></div><div><dt>正答</dt><dd>${escapeHtml(grade.question.answer)}</dd></div></dl><p class="explanation"><b>解き方:</b> ${escapeHtml(grade.question.explanation)}</p>`;
    list.append(details);
  });
  const back = document.createElement("a");
  back.className = "button primary result-back";
  back.href = "index.html";
  back.textContent = "変換を選ぶ画面へ戻る";
  result.replaceChildren(heading, list, back);
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startQuiz() {
  questions = createQuiz(10, selectedConversion);
  renderQuiz();
}

function gradeQuiz() {
  const grades = questions.map((question) => {
    const selected = document.querySelector(`input[name="answer-${question.id}"]:checked`);
    const submitted = selected?.value ?? "";
    return { question, submitted, correct: Boolean(selected) && gradeQuestion(question, submitted) };
  });
  const progress = recordGrades(loadProgress(), grades);
  saveProgress(progress);
  renderResults(grades);
}

if (selectedConversion) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    gradeQuiz();
  });
  newQuizButton.addEventListener("click", startQuiz);
  startQuiz();
}
