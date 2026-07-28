export const PROGRESS_KEY = "student-tool.base-converter.progress.v1";

export function emptyProgress() {
  return { version: 1, stats: {}, mistakes: [] };
}

export function questionKey(question) {
  return `${question.fromBase}-${question.toBase}-${question.width}-${question.value}`;
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(PROGRESS_KEY));
    if (!value || value.version !== 1 || typeof value.stats !== "object" || !Array.isArray(value.mistakes)) return emptyProgress();
    return value;
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function conversionKey(question) {
  return `${question.fromBase}-to-${question.toBase}`;
}

function savedQuestion(question) {
  const { id, ...record } = question;
  return record;
}

export function recordGrades(progress, grades) {
  const next = structuredClone(progress);
  for (const grade of grades) {
    const key = conversionKey(grade.question);
    const stats = next.stats[key] ?? { attempted: 0, correct: 0 };
    stats.attempted += 1;
    if (grade.correct) stats.correct += 1;
    next.stats[key] = stats;

    const keyForQuestion = questionKey(grade.question);
    next.mistakes = next.mistakes.filter((question) => questionKey(question) !== keyForQuestion);
    if (!grade.correct) next.mistakes.push(savedQuestion(grade.question));
  }
  return next;
}

export function accuracy(stats) {
  if (!stats?.attempted) return null;
  return Math.round((stats.correct / stats.attempted) * 100);
}

export function reviewQuestions(progress, limit = 10) {
  return progress.mistakes.slice(0, limit).map((question) => ({ ...question, id: crypto.randomUUID() }));
}
