export const PROGRESS_KEY = "student-tool.base-converter.progress.v1";
const DIFFICULTIES = [4, 8, 12];

function emptyDifficulty() {
  return Object.fromEntries(DIFFICULTIES.map((width) => [width, { initialAttempted: 0, initialCorrect: 0, solved: 0 }]));
}

export function emptyProgress() {
  return { version: 3, stats: {}, mistakes: [], sets: {}, history: { directions: {}, difficulty: emptyDifficulty() }, solvedQuestionKeys: [], legacyNotice: false };
}

export function questionKey(question) {
  return `${question.fromBase}-${question.toBase}-${question.width}-${question.value}`;
}

export function conversionKey(question) {
  return `${question.fromBase}-to-${question.toBase}`;
}

function widthFromQuestionKey(key) {
  return Number(key.split("-")[3]);
}

function validProgress(value) {
  return value && value.version === 3 && typeof value.stats === "object" && Array.isArray(value.mistakes) && typeof value.sets === "object" && typeof value.history === "object" && Array.isArray(value.solvedQuestionKeys);
}

function migrateV1(value) {
  return { ...emptyProgress(), mistakes: value.mistakes, legacyNotice: true };
}

function migrateV2(value) {
  const next = { ...emptyProgress(), mistakes: value.mistakes, sets: value.sets, legacyNotice: value.legacyNotice };
  for (const [key, set] of Object.entries(value.sets ?? {})) {
    if (set.initial) next.history.directions[key] = { initialAttempted: set.initial.attempted, initialCorrect: set.initial.correct };
    for (const solvedKey of set.masteredKeys ?? []) {
      if (!next.solvedQuestionKeys.includes(solvedKey)) {
        next.solvedQuestionKeys.push(solvedKey);
        const width = widthFromQuestionKey(solvedKey);
        if (next.history.difficulty[width]) next.history.difficulty[width].solved += 1;
      }
    }
  }
  return next;
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(PROGRESS_KEY));
    if (validProgress(value)) return value;
    if (value?.version === 2 && Array.isArray(value.mistakes)) return migrateV2(value);
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

function directionHistory(progress, key) {
  return progress.history.directions[key] ?? { initialAttempted: 0, initialCorrect: 0 };
}

export function beginPracticeSet(progress, questions) {
  const next = structuredClone(progress);
  const key = conversionKey(questions[0]);
  next.sets[key] = { questionKeys: questions.map(questionKey), masteredKeys: [], initial: null, latestReview: null };
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

    if (mode === "practice") {
      const history = directionHistory(next, key);
      history.initialAttempted += 1;
      if (grade.correct) history.initialCorrect += 1;
      next.history.directions[key] = history;
      const difficulty = next.history.difficulty[grade.question.width];
      difficulty.initialAttempted += 1;
      if (grade.correct) difficulty.initialCorrect += 1;
    }

    const keyForQuestion = questionKey(grade.question);
    next.mistakes = next.mistakes.filter((question) => questionKey(question) !== keyForQuestion);
    if (!grade.correct) next.mistakes.push(savedQuestion(grade.question));

    const set = next.sets[key];
    if (set && grade.correct && set.questionKeys.includes(keyForQuestion)) set.masteredKeys = unique([...set.masteredKeys, keyForQuestion]);
    if (grade.correct && !next.solvedQuestionKeys.includes(keyForQuestion)) {
      next.solvedQuestionKeys.push(keyForQuestion);
      next.history.difficulty[grade.question.width].solved += 1;
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
  return { total, mastered, remaining: total - mastered, masteryRate: total ? Math.round((mastered / total) * 100) : 0, initial: set.initial, latestReview: set.latestReview };
}

export function initialSummary(progress, key) {
  const history = directionHistory(progress, key);
  return { ...history, rate: history.initialAttempted ? Math.round((history.initialCorrect / history.initialAttempted) * 100) : null };
}

export function analyticsSummary(progress) {
  const directions = Object.values(progress.history.directions);
  const initialAttempted = directions.reduce((total, stat) => total + stat.initialAttempted, 0);
  const initialCorrect = directions.reduce((total, stat) => total + stat.initialCorrect, 0);
  return { initialAttempted, initialCorrect, initialRate: initialAttempted ? Math.round((initialCorrect / initialAttempted) * 100) : null, solved: progress.solvedQuestionKeys.length, difficulty: progress.history.difficulty };
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
