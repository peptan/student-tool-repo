import test from "node:test";
import assert from "node:assert/strict";
import { analyticsSummary, conversionKey, directionSummary, emptyProgress, loadProgress, PROGRESS_KEY, recordGrades, saveProgress } from "../progress-store.js";

function question(value, fromBase = 2, toBase = 10, width = 4) {
  return { id: `test-${value}-${width}`, value, fromBase, toBase, width, prompt: "問題", answer: String(value), choices: ["0", "1", "2", "3"], explanation: "解説" };
}

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("採点結果を変換方向ごとの正解数・解答数へ積み上げる", () => {
  const questions = [question(1), question(2), question(3, 10, 16)];
  const progress = recordGrades(emptyProgress(), [
    { question: questions[0], correct: true },
    { question: questions[1], correct: false },
    { question: questions[2], correct: true }
  ]);
  assert.deepEqual(directionSummary(progress, "2-to-10"), { attempted: 2, correct: 1, rate: 50 });
  assert.deepEqual(directionSummary(progress, "10-to-16"), { attempted: 1, correct: 1, rate: 100 });
  assert.deepEqual(analyticsSummary(progress), { attempted: 3, correct: 2, rate: 67 });
});

test("40問中7問正解の通算記録をそのまま表示できる", () => {
  const questions = Array.from({ length: 40 }, (_, index) => question(index, 2, 10, 12));
  const progress = recordGrades(emptyProgress(), questions.map((item, index) => ({ question: item, correct: index < 7 })));
  assert.deepEqual(analyticsSummary(progress), { attempted: 40, correct: 7, rate: 18 });
});

test("採点済みの記録をブラウザ保存から読込む", () => {
  const storage = memoryStorage();
  const original = question(12, 10, 16, 8);
  const recorded = recordGrades(emptyProgress(), [{ question: original, correct: false }]);
  saveProgress(recorded, storage);
  const loaded = loadProgress(storage);
  assert.equal(directionSummary(loaded, conversionKey(original)).attempted, 1);
  assert.equal(directionSummary(loaded, conversionKey(original)).correct, 0);
});

test("バージョン4の初回集計を通算記録として引き継ぐ", () => {
  const storage = memoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 4, history: { directions: { "2-to-10": { initialAttempted: 40, initialCorrect: 7 } } } }));
  const migrated = loadProgress(storage);
  assert.equal(migrated.version, 5);
  assert.deepEqual(analyticsSummary(migrated), { attempted: 40, correct: 7, rate: 18 });
});

test("壊れた保存値は空の学習記録として扱う", () => {
  const storage = memoryStorage();
  storage.setItem(PROGRESS_KEY, "not-json");
  assert.deepEqual(loadProgress(storage), emptyProgress());
});
