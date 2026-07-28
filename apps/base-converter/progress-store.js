export const PROGRESS_KEY = "student-tool.base-converter.progress.v1";

export function emptyProgress() {
  return { version: 2, stats: {}, mistakes: [], sets: {}, legacyNotice: false };
}

export function questionKey(question) {
  return `${question.fromBase}-${question.toBase}-${question.width}-${question.value}`;
}

export function conversionKey(question) {
  return `${question.fromBase}-to-${question.toBase}`;
}

function validProgress(value) {
  return value && value.version === 2 && typeof value.stats === "object" && Array.isArray(value.mistakes) && typeof value.sets === "object";
}

function migrateV1(value) {
  return {
    ...emptyProgress(),
    mistakes: value.mistakes,
    legacyNotice: true
  };
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(PROGRESS_KEY));
    if (validProgress(value)) return value;
    if (value?.version === 1 && Array.isArray(value.mistakes)) return migrateV1(value);
    return emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function savedQuestion(question) {
  const { id, ...record } = question;
  return record;
}

function unique(values) {
  return [...new Set(values)];
}

export function beginPracticeSet(progress, questions) {
  const next = structuredClone(progress);
  const key = conversionKey(questions[0]);
  next.sets[key] = {
    questionKeys: questions.map(questionKey),
    masteredKeys: [],
    initial: null,
    latestReview: null
  };
  next.mistakes = next.mistakes.filter((question) => conversionKey(question) !== key);
  next.legacyNotice = false;
  return next;
}

export function recordGrades(progress, grades, mode = "practice") {
  const next = structuredClone(progress);
  const grouped = new Map();

  for (const grade of grades) {
    const key = conversionKey(grade.question);
    const collection = grouped.get(key) ?? [];
    collection.push(grade);
    grouped.set(key, collection);

    const stats = next.stats[key] ?? { attempted: 0, correct: 0 };
    stats.attempted += 1;
    if (grade.correct) stats.correct += 1;
    next.stats[key] = stats;

    const keyForQuestion = questionKey(grade.question);
    next.mistakes = next.mistakes.filter((question) => questionKey(question) !== keyForQuestion);
    if (!grade.correct) next.mistakes.push(savedQuestion(grade.question));

    const set = next.sets[key];
    if (set && grade.correct && set.questionKeys.includes(keyForQuestion)) {
      set.masteredKeys = unique([...set.masteredKeys, keyForQuestion]);
    }
  }

  for (const [key, group] of grouped) {
    const result = { attempted: group.length, correct: group.filter((grade) => grade.correct).length };
    const set = next.sets[key];
    if (set) {
      if (mode === "practice") set.initial = result;
      if (mode === "review") set.latestReview = result;
    }
  }
  return next;
}

export function setSummary(progress, key) {
  const set = progress.sets[key];
  if (!set) return null;
  const total = set.questionKeys.length;
  const mastered = set.masteredKeys.length;
  return {
    total,
    mastered,
    remaining: total - mastered,
    masteryRate: total ? Math.round((mastered / total) * 100) : 0,
    initial: set.initial,
    latestReview: set.latestReview
  };
}

export function overallSummary(progress) {
  return Object.keys(progress.sets).reduce((summary, key) => {
    const set = setSummary(progress, key);
    return { total: summary.total + set.total, mastered: summary.mastered + set.mastered };
  }, { total: 0, mastered: 0 });
}

export function reviewQuestions(progress, limit = 10) {
  return progress.mistakes.slice(0, limit).map((question) => ({ ...question, id: crypto.randomUUID() }));
}
