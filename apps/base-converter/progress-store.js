export const PROGRESS_KEY = "student-tool.base-converter.progress.v1";

export function emptyProgress() {
  return { version: 5, directions: {}, legacyNotice: false };
}

export function conversionKey(question) {
  return `${question.fromBase}-to-${question.toBase}`;
}

function validProgress(value) {
  return value && value.version === 5 && typeof value.directions === "object";
}

function cleanDirections(directions) {
  return Object.fromEntries(Object.entries(directions ?? {}).map(([key, value]) => [key, {
    attempted: Number.isInteger(value?.attempted) ? value.attempted : Number(value?.initialAttempted) || 0,
    correct: Number.isInteger(value?.correct) ? value.correct : Number(value?.initialCorrect) || 0
  }]));
}

function migrateV4(value) {
  return { version: 5, directions: cleanDirections(value.history?.directions), legacyNotice: false };
}

function migrateV3(value) {
  return { version: 5, directions: cleanDirections(value.history?.directions), legacyNotice: false };
}

function migrateV2(value) {
  const directions = {};
  for (const [key, set] of Object.entries(value.sets ?? {})) {
    if (set.initial) directions[key] = { attempted: set.initial.attempted, correct: set.initial.correct };
  }
  return { version: 5, directions: cleanDirections(directions), legacyNotice: false };
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(PROGRESS_KEY));
    if (validProgress(value)) return value;
    if (value?.version === 4) return migrateV4(value);
    if (value?.version === 3) return migrateV3(value);
    if (value?.version === 2) return migrateV2(value);
    return emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearProgress(storage = globalThis.localStorage) {
  storage.removeItem(PROGRESS_KEY);
}

export function recordGrades(progress, grades) {
  const next = structuredClone(progress);
  for (const grade of grades) {
    const key = conversionKey(grade.question);
    const stat = next.directions[key] ?? { attempted: 0, correct: 0 };
    stat.attempted += 1;
    if (grade.correct) stat.correct += 1;
    next.directions[key] = stat;
  }
  return next;
}

export function directionSummary(progress, key) {
  const stat = progress.directions[key] ?? { attempted: 0, correct: 0 };
  return { ...stat, rate: stat.attempted ? Math.round((stat.correct / stat.attempted) * 100) : null };
}

export function analyticsSummary(progress) {
  const directions = Object.values(progress.directions);
  const attempted = directions.reduce((total, stat) => total + stat.attempted, 0);
  const correct = directions.reduce((total, stat) => total + stat.correct, 0);
  return { attempted, correct, rate: attempted ? Math.round((correct / attempted) * 100) : null };
}
