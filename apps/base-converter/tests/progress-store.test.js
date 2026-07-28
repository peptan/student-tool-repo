import test from "node:test";
import assert from "node:assert/strict";
import { accuracy, emptyProgress, loadProgress, PROGRESS_KEY, recordGrades, reviewQuestions, saveProgress } from "../progress-store.js";

function question(value, fromBase = 2, toBase = 10, width = 4) {
  return { id: `test-${value}`, value, fromBase, toBase, width, prompt: "問題", note: "4ビット", answer: String(value), explanation: "解説" };
}

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("採点結果を変換別の正解率と誤答復習に反映する", () => {
  const first = recordGrades(emptyProgress(), [
    { question: question(3), correct: true },
    { question: question(5), correct: false }
  ]);
  assert.deepEqual(first.stats["2-to-10"], { attempted: 2, correct: 1 });
  assert.equal(accuracy(first.stats["2-to-10"]), 50);
  assert.equal(first.mistakes.length, 1);
  assert.equal(first.mistakes[0].value, 5);

  const second = recordGrades(first, [{ question: question(5), correct: true }]);
  assert.deepEqual(second.stats["2-to-10"], { attempted: 3, correct: 2 });
  assert.equal(second.mistakes.length, 0);
});

test("学習記録はブラウザ保存から読込み、復習用問題を再生成する", () => {
  const storage = memoryStorage();
  const recorded = recordGrades(emptyProgress(), [{ question: question(12, 10, 16, 8), correct: false }]);
  saveProgress(recorded, storage);
  assert.equal(JSON.parse(storage.getItem(PROGRESS_KEY)).mistakes.length, 1);
  const restored = loadProgress(storage);
  const review = reviewQuestions(restored);
  assert.equal(review.length, 1);
  assert.equal(review[0].id.startsWith("test-"), false);
  assert.equal(review[0].fromBase, 10);
  assert.equal(review[0].toBase, 16);
});

test("壊れた保存値は空の学習記録として扱う", () => {
  const storage = memoryStorage();
  storage.setItem(PROGRESS_KEY, "not-json");
  assert.deepEqual(loadProgress(storage), emptyProgress());
});
