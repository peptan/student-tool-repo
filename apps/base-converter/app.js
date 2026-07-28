import { CONVERSION_CHOICES, createQuiz, gradeQuestion, isValidAnswer } from "./base-converter.js";

const menu = document.querySelector("#conversion-menu");
const questionsElement = document.querySelector("#questions");
const form = document.querySelector("#quiz-form");
const result = document.querySelector("#result");
const message = document.querySelector("#form-message");
const newQuizButton = document.querySelector("#new-quiz");
const quizTitle = document.querySelector("#quiz-title");
let questions = [];
let selectedConversion = CONVERSION_CHOICES[0];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function populateMenu() {
  menu.replaceChildren(...CONVERSION_CHOICES.map((choice) => {
    const option = document.createElement("option");
    option.value = choice.id;
    option.textContent = choice.label;
    return option;
  }));
}

function renderQuiz() {
  result.hidden = true;
  result.replaceChildren();
  message.textContent = "";
  quizTitle.textContent = selectedConversion.label;
  questionsElement.replaceChildren(...questions.map((question, index) => {
    const article = document.createElement("article");
    article.className = "question exam-question";
    article.innerHTML = `
      <p class="exam-title"><span aria-hidden="true"></span>基本情報技術者試験　数値表現</p>
      <div class="exam-rule"></div>
      <h3>問 ${index + 1}</h3>
      <p class="prompt">${escapeHtml(question.prompt)}</p>
      <p class="question-note">${escapeHtml(question.note)}</p>
      <label for="answer-${question.id}">${question.toBase}進数で入力</label>
      <input id="answer-${question.id}" name="answer-${question.id}" autocomplete="off" inputmode="text" aria-describedby="hint-${question.id}" placeholder="答えを入力">
      <p id="hint-${question.id}" class="input-hint">${question.toBase === 16 ? "例: AF または 0xAF" : question.toBase === 2 ? "例: 10101100" : "例: 172"}</p>
    `;
    return article;
  }));
}

function renderResults(grades) {
  const correct = grades.filter((grade) => grade.correct).length;
  const heading = document.createElement("div");
  heading.className = "score";
  heading.innerHTML = `<p class="eyebrow">採点結果</p><h2>${correct}<span> / 10問 正解</span></h2><p>${correct === 10 ? "満点です。同じ変換でもう一度挑戦できます。" : "答えと式を見比べて、考え方を確認しましょう。"}</p>`;
  const list = document.createElement("div");
  list.className = "answer-list";
  grades.forEach((grade, index) => {
    const details = document.createElement("details");
    details.className = grade.correct ? "answer correct" : "answer incorrect";
    details.open = !grade.correct;
    details.innerHTML = `
      <summary><span>問 ${index + 1}</span><strong>${grade.correct ? "正解" : "確認"}</strong></summary>
      <p class="answer-prompt">${escapeHtml(grade.question.prompt)}</p>
      <dl>
        <div><dt>あなたの答え</dt><dd>${escapeHtml(grade.submitted || "（未入力）")}</dd></div>
        <div><dt>正答</dt><dd>${escapeHtml(grade.question.answer)}</dd></div>
      </dl>
      <p class="explanation"><b>解き方:</b> ${escapeHtml(grade.question.explanation)}</p>
    `;
    list.append(details);
  });
  result.replaceChildren(heading, list);
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startQuiz() {
  questions = createQuiz(10, selectedConversion);
  renderQuiz();
  document.querySelector("#quiz-title").scrollIntoView({ behavior: "smooth", block: "start" });
}

function gradeQuiz() {
  const grades = questions.map((question) => {
    const input = document.querySelector(`#answer-${question.id}`);
    const submitted = input.value;
    const valid = isValidAnswer(submitted, question.toBase);
    input.classList.toggle("invalid", submitted.length > 0 && !valid);
    return { question, submitted, correct: valid && gradeQuestion(question, submitted) };
  });
  const invalid = grades.find((grade) => grade.submitted.length > 0 && !isValidAnswer(grade.submitted, grade.question.toBase));
  if (invalid) {
    message.textContent = "入力形式を確認してください。2進数は0と1、10進数は0〜9、16進数は0〜9とA〜Fだけを使います。";
    return;
  }
  message.textContent = "";
  renderResults(grades);
}

menu.addEventListener("change", () => {
  selectedConversion = CONVERSION_CHOICES.find((choice) => choice.id === menu.value) ?? CONVERSION_CHOICES[0];
  startQuiz();
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  gradeQuiz();
});
newQuizButton.addEventListener("click", startQuiz);
populateMenu();
startQuiz();
