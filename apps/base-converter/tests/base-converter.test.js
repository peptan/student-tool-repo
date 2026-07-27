import test from "node:test";
import assert from "node:assert/strict";
import { createQuiz, explanationFor, formatBinary, formatHex, gradeQuestion, isValidAnswer, normalizeAnswer, valueForBase } from "../base-converter.js";

test("4・8・12ビットの表記をゼロ埋めする", () => {
  assert.equal(formatBinary(10, 4), "1010");
  assert.equal(formatBinary(10, 8), "00001010");
  assert.equal(formatHex(10, 8), "0A");
  assert.equal(formatHex(4095, 12), "FFF");
});

test("入力を基数ごとに正規化・検証する", () => {
  assert.equal(normalizeAnswer(" 0x0a ", 16), "A");
  assert.equal(normalizeAnswer("00010", 10), "10");
  assert.equal(normalizeAnswer(" 1010 ", 2), "1010");
  assert.equal(isValidAnswer("10102", 2), false);
  assert.equal(isValidAnswer("0xAF", 16), true);
  assert.equal(isValidAnswer("-10", 10), false);
});

test("表記・採点は大文字小文字と先頭ゼロを吸収する", () => {
  const question = { value: 175, width: 8, fromBase: 10, toBase: 16, answer: "AF" };
  assert.equal(valueForBase(175, 16, 8), "AF");
  assert.equal(gradeQuestion(question, "0xaf"), true);
  assert.equal(gradeQuestion(question, "AE"), false);
});

test("各変換方向に固定形式の解説がある", () => {
  const cases = [[2,10],[10,2],[2,16],[16,2],[10,16],[16,10]];
  for (const [fromBase, toBase] of cases) {
    const text = explanationFor({ value: 172, width: 8, fromBase, toBase });
    assert.ok(text.length > 20, `${fromBase}→${toBase}`);
  }
});

test("10問は重複なしで生成する", () => {
  let state = 0;
  const random = () => { state = (state + 0.137) % 1; return state; };
  const quiz = createQuiz(10, random);
  assert.equal(quiz.length, 10);
  assert.equal(new Set(quiz.map((q) => `${q.value}-${q.width}-${q.fromBase}-${q.toBase}`)).size, 10);
  quiz.forEach((question) => assert.equal(question.answer, valueForBase(question.value, question.toBase, question.width)));
});
