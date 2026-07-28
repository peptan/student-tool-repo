import test from "node:test";
import assert from "node:assert/strict";
import { analyticsSummary, beginPracticeSet, emptyProgress, initialSummary, loadProgress, PROGRESS_KEY, recordGrades, reviewQuestions, saveProgress, setSummary } from "../progress-store.js";

function question(value, fromBase = 2, toBase = 10, width = 4) {
  return { id: `test-${value}-${width}`, value, fromBase, toBase, width, prompt: "問題", answer: String(value), choices: ["0", "1", "2", "3"], explanation: "解説" };
}

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("初回と復習を混ぜず、元の10問に対する到達状況を計算する", () => {
  const questions = Array.from({ length: 10 }, (_, index) => question(index));
  let progress = beginPracticeSet(emptyProgress(), questions);
  progress = recordGrades(progress, questions.map((item, index) => ({ question: item, correct: index === 0 })), "practice");
  let summary = setSummary(progress, "2-to-10");
  assert.deepEqual(summary.initial, { attempted: 10, correct: 1 });
  assert.equal(summary.mastered, 1);
  assert.equal(summary.remaining, 9);
  assert.equal(summary.masteryRate, 10);

  progress = recordGrades(progress, questions.slice(1).map((item, index) => ({ question: item, correct: index === 0 })), "review");
  summary = setSummary(progress, "2-to-10");
  assert.deepEqual(summary.latestReview, { attempted: 9, correct: 1 });
  assert.equal(summary.mastered, 2);
  assert.equal(summary.remaining, 8);
  assert.equal(summary.masteryRate, 20);
  assert.equal(progress.mistakes.length, 8);
  assert.deepEqual(initialSummary(progress, "2-to-10"), { initialAttempted: 10, initialCorrect: 1, rate: 10 });
});

test("通算初回成績は新しい10問で積み上がり、復習では変わらない", () => {
  const first = [question(1), question(2)];
  const second = [question(3), question(4)];
  let progress = beginPracticeSet(emptyProgress(), first);
  progress = recordGrades(progress, [{ question: first[0], correct: true }, { question: first[1], correct: false }], "practice");
  progress = recordGrades(progress, [{ question: first[1], correct: true }], "review");
  progress = beginPracticeSet(progress, second);
  progress = recordGrades(progress, [{ question: second[0], correct: true }, { question: second[1], correct: false }], "practice");
  assert.deepEqual(initialSummary(progress, "2-to-10"), { initialAttempted: 4, initialCorrect: 2, rate: 50 });
  assert.equal(analyticsSummary(progress).solved, 3);
});

test("発展問題は通算正解を重複なく数え、難易度別の初回成績を持つ", () => {
  const advanced = question(321, 10, 16, 12);
  let progress = beginPracticeSet(emptyProgress(), [advanced]);
  progress = recordGrades(progress, [{ question: advanced, correct: true }], "practice");
  progress = recordGrades(progress, [{ question: advanced, correct: true }], "review");
  const summary = analyticsSummary(progress);
  assert.deepEqual(summary.difficulty[12], { initialAttempted: 1, initialCorrect: 1, solved: 1 });
  assert.equal(summary.solved, 1);
});

test("正解済み問題は誤答復習リストから外れる", () => {
  const questions = [question(3), question(5)];
  let progress = beginPracticeSet(emptyProgress(), questions);
  progress = recordGrades(progress, [{ question: questions[0], correct: true }, { question: questions[1], correct: false }], "practice");
  assert.equal(progress.mistakes.length, 1);
  progress = recordGrades(progress, [{ question: questions[1], correct: true }], "review");
  assert.equal(progress.mistakes.length, 0);
});

test("学習記録はブラウザ保存から読込み、復習用問題を再生成する", () => {
  const storage = memoryStorage();
  const original = question(12, 10, 16, 8);
  const recorded = recordGrades(beginPracticeSet(emptyProgress(), [original]), [{ question: original, correct: false }], "practice");
  saveProgress(recorded, storage);
  assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)).mistakes.length, 1);
  const review = reviewQuestions(loadProgress(storage));
  assert.equal(review.length, 1);
  assert.equal(review[0].id.startsWith("test-"), false);
  assert.equal(review[0].fromBase, 10);
  assert.equal(review[0].toBase, 16);
});

test("旧形式の保存値は推測で新しい初回成績へ混ぜない", () => {
  const storage = memoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, stats: { "2-to-10": { attempted: 19, correct: 2 } }, mistakes: [question(5)] }));
  const migrated = loadProgress(storage);
  assert.equal(migrated.version, 3);
  assert.equal(migrated.legacyNotice, true);
  assert.equal(migrated.mistakes.length, 1);
  assert.equal(initialSummary(migrated, "2-to-10").rate, null);
});

test("壊れた保存値は空の学習記録として扱う", () => {
  const storage = memoryStorage();
  storage.setItem(PROGRESS_KEY, "not-json");
  assert.deepEqual(loadProgress(storage), emptyProgress());
});
