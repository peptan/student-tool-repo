export const HEX_DIGITS = "0123456789ABCDEF";

const allowedWidths = [4, 8, 12];

export function formatBinary(value, width) {
  if (!Number.isInteger(value) || value < 0 || !allowedWidths.includes(width) || value >= 2 ** width) {
    throw new Error("value または width が不正です。");
  }
  return value.toString(2).padStart(width, "0");
}

export function formatHex(value, width) {
  if (!Number.isInteger(value) || value < 0 || !allowedWidths.includes(width) || value >= 2 ** width) {
    throw new Error("value または width が不正です。");
  }
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
  const terms = [...binary]
    .map((digit, index) => (digit === "1" ? `2^${binary.length - 1 - index}` : null))
    .filter(Boolean);
  if (terms.length === 0) return `${binary}₂ は全ての桁が0なので 0₁₀`;
  return `${binary}₂ = ${terms.join(" + ")} = ${parseInt(binary, 2)}₁₀`;
}

function decimalToBinarySteps(value, width) {
  const divisions = [];
  let remaining = value;
  do {
    const quotient = Math.floor(remaining / 2);
    divisions.push(`${remaining} ÷ 2 = ${quotient} 余り ${remaining % 2}`);
    remaining = quotient;
  } while (remaining > 0);
  return `${divisions.join(" → ")}。余りを下から読むと ${formatBinary(value, width)}₂`;
}

function binaryToHexSteps(binary) {
  const groups = binary.match(/.{4}/g);
  const digits = groups.map((group) => parseInt(group, 2).toString(16).toUpperCase());
  return `${binary}₂ を右から4ビットずつ区切る: ${groups.join(" ")} → ${digits.join(" ")}。したがって ${digits.join("")}₁₆`;
}

function hexToBinarySteps(hex, width) {
  const groups = [...hex].map((digit) => parseInt(digit, 16).toString(2).padStart(4, "0"));
  return `${hex}₁₆ の各桁を4ビットへ置換: ${[...hex].join(" ")} → ${groups.join(" ")}。したがって ${groups.join("").padStart(width, "0")}₂`;
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
  return `${divisions.join(" → ")}。余りを下から読むと ${hex}₁₆`;
}

function hexToDecimalSteps(hex) {
  const terms = [...hex].map((digit, index) => `${parseInt(digit, 16)} × 16^${hex.length - 1 - index}`);
  return `${hex}₁₆ = ${terms.join(" + ")} = ${parseInt(hex, 16)}₁₀`;
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
  if (base === 10) return String(value);
  if (base === 16) return formatHex(value, width);
  throw new Error("未対応の基数です。");
}

export function createQuestion(random = Math.random) {
  const width = allowedWidths[Math.floor(random() * allowedWidths.length)];
  const value = Math.floor(random() * (2 ** width));
  const pairs = [[2, 10], [10, 2], [2, 16], [16, 2], [10, 16], [16, 10]];
  const [fromBase, toBase] = pairs[Math.floor(random() * pairs.length)];
  return {
    id: crypto.randomUUID(),
    value,
    width,
    fromBase,
    toBase,
    prompt: `${valueForBase(value, fromBase, width)}${fromBase === 16 ? "₁₆" : fromBase === 10 ? "₁₀" : "₂"} を ${toBase}進数に変換しなさい（${width}ビット表現）。`,
    answer: valueForBase(value, toBase, width),
    explanation: explanationFor({ value, width, fromBase, toBase })
  };
}

export function createQuiz(count = 10, random = Math.random) {
  const questions = [];
  const used = new Set();
  while (questions.length < count) {
    const question = createQuestion(random);
    const key = `${question.value}-${question.width}-${question.fromBase}-${question.toBase}`;
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
