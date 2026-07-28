export const HEX_DIGITS = "0123456789ABCDEF";
export const CONVERSION_CHOICES = [
  { id: "2-to-10", label: "2進数 → 10進数", fromBase: 2, toBase: 10 },
  { id: "10-to-2", label: "10進数 → 2進数", fromBase: 10, toBase: 2 },
  { id: "2-to-16", label: "2進数 → 16進数", fromBase: 2, toBase: 16 },
  { id: "16-to-2", label: "16進数 → 2進数", fromBase: 16, toBase: 2 },
  { id: "10-to-16", label: "10進数 → 16進数", fromBase: 10, toBase: 16 },
  { id: "16-to-10", label: "16進数 → 10進数", fromBase: 16, toBase: 10 }
];

const allowedWidths = [4, 8, 12];

function assertRepresentable(value, width) {
  if (!Number.isInteger(value) || value < 0 || !allowedWidths.includes(width) || value >= 2 ** width) {
    throw new Error("value または width が不正です。");
  }
}

export function formatBinary(value, width) {
  assertRepresentable(value, width);
  return value.toString(2).padStart(width, "0");
}

export function formatHex(value, width) {
  assertRepresentable(value, width);
  return value.toString(16).toUpperCase().padStart(width / 4, "0");
}

export function normalizeAnswer(value, base) {
  const text = String(value ?? "").trim().toUpperCase().replace(/^0X/, "");
  if (base === 2) return text.replace(/\s+/g, "");
  if (base === 10) return text.replace(/^0+(?=\d)/, "");
  if (base === 16) return text.replace(/\s+/g, "").replace(/^0+(?=[0-9A-F])/i, "");
  return text;
}

export function isValidAnswer(value, base) {
  const normalized = normalizeAnswer(value, base);
  const patterns = { 2: /^[01]+$/, 10: /^\d+$/, 16: /^[0-9A-F]+$/ };
  return patterns[base]?.test(normalized) ?? false;
}

function binaryToDecimalSteps(binary) {
  const terms = [...binary].map((digit, index) => (digit === "1" ? `2^${binary.length - 1 - index}` : null)).filter(Boolean);
  if (terms.length === 0) return `${binary}（2進数）は全ての桁が0なので、0（10進数）`;
  return `${binary}（2進数） = ${terms.join(" + ")} = ${parseInt(binary, 2)}（10進数）`;
}

function decimalToBinarySteps(value, width) {
  const divisions = [];
  let remaining = value;
  do {
    const quotient = Math.floor(remaining / 2);
    divisions.push(`${remaining} ÷ 2 = ${quotient} 余り ${remaining % 2}`);
    remaining = quotient;
  } while (remaining > 0);
  return `${divisions.join(" → ")}。余りを下から読むと ${formatBinary(value, width)}（2進数）`;
}

function binaryToHexSteps(binary) {
  const groups = binary.match(/.{4}/g);
  const digits = groups.map((group) => parseInt(group, 2).toString(16).toUpperCase());
  return `${binary}（2進数）を右から4ビットずつ区切る: ${groups.join(" ")} → ${digits.join(" ")}。したがって ${digits.join("")}（16進数）`;
}

function hexToBinarySteps(hex, width) {
  const groups = [...hex].map((digit) => parseInt(digit, 16).toString(2).padStart(4, "0"));
  return `${hex}（16進数）の各桁を4ビットへ置換: ${[...hex].join(" ")} → ${groups.join(" ")}。したがって ${groups.join("").padStart(width, "0")}（2進数）`;
}

function decimalToHexSteps(value, width) {
  const hex = formatHex(value, width);
  const divisions = [];
  let remaining = value;
  do {
    const quotient = Math.floor(remaining / 16);
    const remainder = remaining % 16;
    divisions.push(`${remaining} ÷ 16 = ${quotient} 余り ${HEX_DIGITS[remainder]}`);
    remaining = quotient;
  } while (remaining > 0);
  return `${divisions.join(" → ")}。余りを下から読むと ${hex}（16進数）`;
}

function hexToDecimalSteps(hex) {
  const terms = [...hex].map((digit, index) => `${parseInt(digit, 16)} × 16^${hex.length - 1 - index}`);
  return `${hex}（16進数） = ${terms.join(" + ")} = ${parseInt(hex, 16)}（10進数）`;
}

export function explanationFor(question) {
  const { value, fromBase, toBase, width } = question;
  const binary = formatBinary(value, width);
  const hex = formatHex(value, width);
  if (fromBase === 2 && toBase === 10) return binaryToDecimalSteps(binary);
  if (fromBase === 10 && toBase === 2) return decimalToBinarySteps(value, width);
  if (fromBase === 2 && toBase === 16) return binaryToHexSteps(binary);
  if (fromBase === 16 && toBase === 2) return hexToBinarySteps(hex, width);
  if (fromBase === 10 && toBase === 16) return decimalToHexSteps(value, width);
  if (fromBase === 16 && toBase === 10) return hexToDecimalSteps(hex);
  throw new Error("未対応の変換です。");
}

export function valueForBase(value, base, width) {
  if (base === 2) return formatBinary(value, width);
  if (base === 10) {
    assertRepresentable(value, width);
    return String(value);
  }
  if (base === 16) return formatHex(value, width);
  throw new Error("未対応の基数です。");
}

function validateConversion(conversion) {
  if (!CONVERSION_CHOICES.some((choice) => choice.fromBase === conversion?.fromBase && choice.toBase === conversion?.toBase)) {
    throw new Error("未対応の変換です。");
  }
}

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function choicesForQuestion(question, random = Math.random) {
  const max = 2 ** question.width - 1;
  const values = [question.value];
  const deltas = [1, -1, 2, -2, 3, -3, 4, -4, 8, -8, 16, -16];
  for (const delta of deltas) {
    const candidate = question.value + delta;
    if (candidate >= 0 && candidate <= max && !values.includes(candidate)) values.push(candidate);
    if (values.length === 4) break;
  }
  for (let candidate = 0; values.length < 4 && candidate <= max; candidate += 1) {
    if (!values.includes(candidate)) values.push(candidate);
  }
  return shuffle(values.map((value) => valueForBase(value, question.toBase, question.width)), random);
}

export function createQuestion(conversion, random = Math.random) {
  validateConversion(conversion);
  const width = allowedWidths[Math.floor(random() * allowedWidths.length)];
  const value = Math.floor(random() * (2 ** width));
  const question = {
    id: crypto.randomUUID(),
    value,
    width,
    fromBase: conversion.fromBase,
    toBase: conversion.toBase,
    prompt: `${conversion.fromBase}進数の ${valueForBase(value, conversion.fromBase, width)} を ${conversion.toBase}進数に変換したものとして、次のうち正しいものはどれか。`,
    answer: valueForBase(value, conversion.toBase, width),
    explanation: explanationFor({ value, width, fromBase: conversion.fromBase, toBase: conversion.toBase })
  };
  return { ...question, choices: choicesForQuestion(question, random) };
}

export function createQuiz(count = 10, conversion = CONVERSION_CHOICES[0], random = Math.random) {
  validateConversion(conversion);
  const questions = [];
  const used = new Set();
  while (questions.length < count) {
    const question = createQuestion(conversion, random);
    const key = `${question.value}-${question.width}`;
    if (!used.has(key)) {
      used.add(key);
      questions.push(question);
    }
  }
  return questions;
}

export function gradeQuestion(question, submitted) {
  return normalizeAnswer(submitted, question.toBase) === normalizeAnswer(question.answer, question.toBase);
}
