import test from "node:test";
import assert from "node:assert/strict";
import { CONVERSION_CHOICES, choicesForQuestion, createQuestion, createQuiz, explanationFor, formatBinary, formatHex, gradeQuestion, isValidAnswer, normalizeAnswer, valueForBase } from "../base-converter.js";

const twoToTen = CONVERSION_CHOICES.find((choice) => choice.id === "2-to-10");
const tenToSixteen = CONVERSION_CHOICES.find((choice) => choice.id === "10-to-16");

test("4・8・12ビットの表記をゼロ埋めする", () => {
  assert.equal(formatBinary(10, 4), "1010");
  assert.equal(formatBinary(10, 8), "00001010");
  assert.equal(formatHex(10, 8), "0A");
  assert.equal(formatHex(4095, 12), "FFF");
  assert.throws(() => formatBinary(16, 4), /不正/);
  assert.throws(() => formatHex(16, 4), /不正/);
});

test("0は各ビット幅で出題・表記できる", () => {
  const zeroQuestion = createQuestion(twoToTen, () => 0);
  assert.equal(zeroQuestion.value, 0);
  assert.equal(zeroQuestion.answer, valueForBase(0, zeroQuestion.toBase, zeroQuestion.width));
  assert.equal(explanationFor({ value: 0, width: 4, fromBase: 2, toBase: 10 }), "0000（2進数）は全ての桁が0なので、0（10進数）");
});

test("入力を基数ごとに正規化・検証する", () => {
  assert.equal(normalizeAnswer(" 0x0a ", 16), "A");
  assert.equal(normalizeAnswer("00010", 10), "10");
  assert.equal(normalizeAnswer(" 1010 ", 2), "1010");
  assert.equal(isValidAnswer("10102", 2), false);
  assert.equal(isValidAnswer("0xAF", 16), true);
  assert.equal(isValidAnswer("A", 10), false);
  assert.equal(isValidAnswer("-10", 10), false);
});

test("表記・採点は大文字小文字と先頭ゼロを吸収する", () => {
  const question = { value: 175, width: 8, fromBase: 10, toBase: 16, answer: "AF" };
  assert.equal(valueForBase(175, 16, 8), "AF");
  assert.equal(gradeQuestion(question, "0xaf"), true);
  assert.equal(gradeQuestion(question, "AE"), false);
});

test("各変換方向に下付き文字なしの固定形式解説がある", () => {
  for (const { fromBase, toBase } of CONVERSION_CHOICES) {
    const text = explanationFor({ value: 172, width: 8, fromBase, toBase });
    assert.ok(text.length > 20, `${fromBase}→${toBase}`);
    assert.doesNotMatch(text, /[₀₁₂₃₄₅₆₇₈₉ₐₑ]/u);
  }
});

test("各問題は正解を含む重複なしの4択を生成する", () => {
  const question = createQuestion(twoToTen, () => 0.4);
  assert.equal(question.choices.length, 4);
  assert.equal(new Set(question.choices).size, 4);
  assert.ok(question.choices.includes(question.answer));
  assert.deepEqual(choicesForQuestion({ value: 0, width: 4, toBase: 10 }, () => 0).sort(), ["0", "1", "2", "3"]);
});

test("選んだ変換だけを10問、重複なしで生成する", () => {
  let state = 0;
  const random = () => { state = (state + 0.137) % 1; return state; };
  const quiz = createQuiz(10, tenToSixteen, random);
  assert.deepEqual(quiz.map((question) => question.width), [4, 4, 4, 4, 8, 8, 8, 8, 12, 12]);
  assert.equal(new Set(quiz.map((q) => `${q.value}-${q.width}`)).size, 10);
  quiz.forEach((question) => {
    assert.equal(question.fromBase, 10);
    assert.equal(question.toBase, 16);
    assert.match(question.prompt, /^10進数の .+ を 16進数に変換したものとして、次のうち正しいものはどれか。$/);
    assert.equal(question.answer, valueForBase(question.value, question.toBase, question.width));
    assert.equal(question.choices.length, 4);
  });
});
