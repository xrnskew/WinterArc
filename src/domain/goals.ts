import { addDays, daysBetween, isDateKey, toDateKey } from './dates';
import type { AppData, DateKey, Goal, Id, NumericGoal, StepsGoal, Timestamp } from './types';

/**
 * Цели: черновик (форма) → цель, шаги и записи, прогресс, темп и прогноз.
 *
 * Цель достигнута, когда прогресс дошёл до 100%: completedAt ставится
 * и снимается сам после каждого изменения (см. withCompletion).
 */

export type GoalKind = Goal['kind'];
export type EntryMode = NumericGoal['entryMode'];

export const GOAL_KIND_LABELS: Record<GoalKind, string> = {
  steps: 'По шагам',
  numeric: 'Числовая',
};

export const ENTRY_MODE_LABELS: Record<EntryMode, string> = {
  add: 'Пополнения',
  set: 'Замеры',
};

// ── Черновик цели (форма) ────────────────────────────────

/**
 * Всё, что вводится в форме цели. Поля обоих видов лежат рядом:
 * при переключении вида введённое не теряется.
 * Пустое поле числа — NaN, его ловит проверка.
 */
export interface GoalDraft {
  title: string;
  kind: GoalKind;
  deadline: DateKey | null;
  /** steps: названия шагов. Используются только при создании цели. */
  steps: string[];
  /** numeric */
  unit: string;
  startValue: number;
  targetValue: number;
  entryMode: EntryMode;
}

export const GOAL_TITLE_MAX = 80;
export const STEP_TITLE_MAX = 80;

/** Пустая форма; дедлайн по умолчанию — конец арки. */
export function newGoalDraft(deadline: DateKey | null): GoalDraft {
  return {
    title: '',
    kind: 'steps',
    deadline,
    steps: ['', '', ''],
    unit: '',
    startValue: 0,
    targetValue: NaN,
    entryMode: 'add',
  };
}

export interface GoalDraftErrors {
  title?: string;
  steps?: string;
  values?: string;
  deadline?: string;
}

/** Проверяет форму цели. Пустой объект — ошибок нет. */
export function validateGoalDraft(draft: GoalDraft): GoalDraftErrors {
  const errors: GoalDraftErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = 'Назови цель.';
  else if (title.length > GOAL_TITLE_MAX) errors.title = `Не длиннее ${GOAL_TITLE_MAX} символов.`;

  if (draft.kind === 'steps' && cleanSteps(draft.steps).length === 0) {
    errors.steps = 'Добавь хотя бы один шаг.';
  }

  if (draft.kind === 'numeric') {
    const { startValue, targetValue } = draft;
    if (!Number.isFinite(startValue) || !Number.isFinite(targetValue)) {
      errors.values = 'Укажи, откуда начинаешь и куда идёшь.';
    } else if (startValue === targetValue) {
      errors.values = 'Цель должна отличаться от старта.';
    } else if (draft.entryMode === 'add' && targetValue < startValue) {
      errors.values = 'Пополнения только прибавляют: цель должна быть больше старта.';
    }
  }

  if (draft.deadline !== null && !isDateKey(draft.deadline)) {
    errors.deadline = 'Выбери дату или «Без срока».';
  }
  return errors;
}

/** Непустые названия шагов без лишних пробелов. */
function cleanSteps(steps: string[]): string[] {
  return steps.map((step) => step.trim()).filter(Boolean);
}

/** Черновик → цель нужного вида. arcId — арка, во время которой цель создана. */
export function goalFromDraft(
  draft: GoalDraft,
  newId: () => Id,
  arcId: Id | null,
  now: Timestamp,
): Goal {
  const base = {
    id: newId(),
    title: draft.title.trim(),
    deadline: draft.deadline,
    arcId,
    createdAt: now,
    completedAt: null,
    archivedAt: null,
  };

  if (draft.kind === 'steps') {
    return {
      ...base,
      kind: 'steps',
      steps: cleanSteps(draft.steps).map((title) => ({ id: newId(), title, doneAt: null })),
    };
  }
  return {
    ...base,
    kind: 'numeric',
    unit: draft.unit.trim(),
    startValue: draft.startValue,
    targetValue: draft.targetValue,
    entryMode: draft.entryMode,
    entries: [],
  };
}

/** Обратно: цель → черновик (для формы правки). */
export function draftFromGoal(goal: Goal): GoalDraft {
  const draft = { ...newGoalDraft(goal.deadline), title: goal.title, kind: goal.kind };
  if (goal.kind === 'steps') return { ...draft, steps: goal.steps.map((step) => step.title) };
  return {
    ...draft,
    unit: goal.unit,
    startValue: goal.startValue,
    targetValue: goal.targetValue,
    entryMode: goal.entryMode,
  };
}

// ── Изменения в данных ───────────────────────────────────

export function getGoal(data: AppData, goalId: Id): Goal | undefined {
  return data.goals.find((goal) => goal.id === goalId);
}

/** Меняет одну цель и сразу пересчитывает, достигнута ли она. */
function changeGoal(
  data: AppData,
  goalId: Id,
  now: Timestamp,
  update: (goal: Goal) => Goal,
): AppData {
  return {
    ...data,
    goals: data.goals.map((goal) =>
      goal.id === goalId ? withCompletion(update(goal), now) : goal,
    ),
  };
}

export function addGoal(data: AppData, goal: Goal): AppData {
  return { ...data, goals: [...data.goals, goal] };
}

/**
 * Правка из формы: название, дедлайн, а у числовой — единица, старт и цель.
 * Вид цели и режим записей не меняются: записи уже сделаны в их смысле.
 * Шаги правятся отдельно, прямо на странице цели.
 */
export function updateGoal(data: AppData, goalId: Id, draft: GoalDraft, now: Timestamp): AppData {
  return changeGoal(data, goalId, now, (goal) => {
    const common = { ...goal, title: draft.title.trim(), deadline: draft.deadline };
    if (common.kind === 'steps') return common;
    return {
      ...common,
      unit: draft.unit.trim(),
      startValue: draft.startValue,
      targetValue: draft.targetValue,
    };
  });
}

export function archiveGoal(data: AppData, goalId: Id, now: Timestamp): AppData {
  return {
    ...data,
    goals: data.goals.map((goal) => (goal.id === goalId ? { ...goal, archivedAt: now } : goal)),
  };
}

/** Меняет шаги цели по шагам; у числовой цели ничего не делает. */
function changeSteps(
  data: AppData,
  goalId: Id,
  now: Timestamp,
  update: (steps: StepsGoal['steps']) => StepsGoal['steps'],
): AppData {
  return changeGoal(data, goalId, now, (goal) =>
    goal.kind === 'steps' ? { ...goal, steps: update(goal.steps) } : goal,
  );
}

export function addStep(data: AppData, goalId: Id, stepId: Id, title: string, now: Timestamp) {
  return changeSteps(data, goalId, now, (steps) => [
    ...steps,
    { id: stepId, title: title.trim(), doneAt: null },
  ]);
}

/** Отметить шаг сделанным или снять отметку. */
export function toggleStep(data: AppData, goalId: Id, stepId: Id, now: Timestamp) {
  return changeSteps(data, goalId, now, (steps) =>
    steps.map((step) =>
      step.id === stepId ? { ...step, doneAt: step.doneAt === null ? now : null } : step,
    ),
  );
}

export function removeStep(data: AppData, goalId: Id, stepId: Id, now: Timestamp) {
  return changeSteps(data, goalId, now, (steps) => steps.filter((step) => step.id !== stepId));
}

// ── Записи числовой цели ─────────────────────────────────

export type GoalEntry = NumericGoal['entries'][number];

export interface EntryDraft {
  date: DateKey;
  /** Пустое поле — NaN. */
  value: number;
  note: string;
}

/** Проверяет новую запись. Ошибка — строкой, null — всё хорошо. */
export function validateEntry(goal: NumericGoal, entry: EntryDraft, today: DateKey): string | null {
  if (!Number.isFinite(entry.value)) return 'Введи число.';
  if (goal.entryMode === 'add' && entry.value <= 0) return 'Пополнение — больше нуля.';
  if (!isDateKey(entry.date)) return 'Выбери дату.';
  if (daysBetween(today, entry.date) > 0) return 'Запись не может быть из будущего.';
  return null;
}

export function addEntry(
  data: AppData,
  goalId: Id,
  entryId: Id,
  entry: EntryDraft,
  now: Timestamp,
): AppData {
  return changeGoal(data, goalId, now, (goal) =>
    goal.kind === 'numeric'
      ? { ...goal, entries: [...goal.entries, { id: entryId, ...entry, note: entry.note.trim() }] }
      : goal,
  );
}

export function removeEntry(data: AppData, goalId: Id, entryId: Id, now: Timestamp): AppData {
  return changeGoal(data, goalId, now, (goal) =>
    goal.kind === 'numeric'
      ? { ...goal, entries: goal.entries.filter((entry) => entry.id !== entryId) }
      : goal,
  );
}

/** Записи по дате, от старых к новым. В один день — в порядке добавления. */
export function sortedEntries(goal: NumericGoal): GoalEntry[] {
  // sort в JS устойчивый: записи одного дня сохраняют порядок добавления.
  return [...goal.entries].sort((a, b) => daysBetween(b.date, a.date));
}

// ── Прогресс ─────────────────────────────────────────────

export interface GoalProgress {
  /** Шагов сделано или текущее значение. */
  current: number;
  /** Всего шагов или целевое значение. */
  target: number;
  /** Пройденная доля пути 0…1. */
  ratio: number;
}

/** Погрешность дробей: 0,1 + 0,2 = 0,30000000000000004. */
const EPSILON = 1e-9;

/** Текущее значение числовой цели: старт + пополнения или последний замер. */
export function numericCurrent(goal: NumericGoal): number {
  if (goal.entryMode === 'add') {
    return goal.entries.reduce((sum, entry) => sum + entry.value, goal.startValue);
  }
  return sortedEntries(goal).at(-1)?.value ?? goal.startValue;
}

export function goalProgress(goal: Goal): GoalProgress {
  if (goal.kind === 'steps') {
    const done = goal.steps.filter((step) => step.doneAt !== null).length;
    const total = goal.steps.length;
    return { current: done, target: total, ratio: total === 0 ? 0 : done / total };
  }

  const current = numericCurrent(goal);
  // Работает и для цели «вниз» (вес 80 → 75): числитель и знаменатель оба отрицательные.
  const ratio = (current - goal.startValue) / (goal.targetValue - goal.startValue);
  return { current, target: goal.targetValue, ratio: Math.min(Math.max(ratio, 0), 1) };
}

export function isGoalReached(goal: Goal): boolean {
  return goalProgress(goal).ratio >= 1 - EPSILON;
}

/** Ставит completedAt, когда цель достигнута, и снимает, если прогресс откатился. */
export function withCompletion(goal: Goal, now: Timestamp): Goal {
  const reached = isGoalReached(goal);
  if (reached && goal.completedAt === null) return { ...goal, completedAt: now };
  if (!reached && goal.completedAt !== null) return { ...goal, completedAt: null };
  return goal;
}

// ── Темп и прогноз (числовые цели) ───────────────────────

/** Темп считаем, когда данных хотя бы за неделю: по одному дню прогноз врёт. */
export const MIN_PACE_DAYS = 7;

export type GoalForecast =
  | { status: 'reached' }
  /** Записей ещё нет. */
  | { status: 'noEntries' }
  /** Данных меньше недели — прогноз появится readyOn. */
  | { status: 'tooEarly'; readyOn: DateKey }
  /** Темп нулевой или идёт в обратную сторону. */
  | { status: 'stalled'; perWeek: number }
  /** При таком темпе цель будет достигнута к date. */
  | { status: 'eta'; date: DateKey; perWeek: number };

/** День, с которого идёт цель. */
export function goalStartDate(goal: Goal): DateKey {
  return toDateKey(new Date(goal.createdAt));
}

/**
 * Прогноз «при таком темпе к …».
 *
 * Пополнения: темп = всё пополненное / дни от начала цели до сегодня.
 * Замеры: темп = (последний замер − старт) / дни от начала цели до этого замера.
 * Дальше — сколько дней нужно на остаток при том же темпе.
 */
export function numericForecast(goal: NumericGoal, today: DateKey): GoalForecast {
  if (isGoalReached(goal)) return { status: 'reached' };
  const entries = sortedEntries(goal);
  if (entries.length === 0) return { status: 'noEntries' };

  // Если записи внесены задним числом раньше создания цели — считаем от первой записи.
  const first = entries[0].date;
  const from = daysBetween(first, goalStartDate(goal)) > 0 ? first : goalStartDate(goal);
  const last = entries.at(-1)!;
  // До какого дня меряем темп и от какого дня считаем остаток.
  const until = goal.entryMode === 'add' ? today : last.date;

  const days = daysBetween(from, until);
  if (days < MIN_PACE_DAYS) return { status: 'tooEarly', readyOn: addDays(from, MIN_PACE_DAYS) };

  const current = numericCurrent(goal);
  const perDay = (current - goal.startValue) / days;
  const perWeek = perDay * 7;
  const direction = Math.sign(goal.targetValue - goal.startValue);
  if (perDay * direction <= 0) return { status: 'stalled', perWeek };

  // EPSILON — чтобы 56,000000001 дня от погрешности дробей не стали 57.
  const daysNeeded = Math.ceil((goal.targetValue - current) / perDay - EPSILON);
  const date = addDays(until, daysNeeded);
  // Замер был давно, и по темпу цель уже должна быть достигнута — значит, к сегодняшнему дню.
  return { status: 'eta', date: daysBetween(today, date) < 0 ? today : date, perWeek };
}

export interface DeadlinePace {
  /** Дней до дедлайна, включая сегодня и сам день дедлайна. */
  daysLeft: number;
  /** Сколько нужно в день и в неделю, чтобы успеть. */
  perDay: number;
  perWeek: number;
}

/** Какой нужен темп, чтобы успеть к дедлайну. null — дедлайна нет, он прошёл или цель уже достигнута. */
export function neededPace(goal: NumericGoal, today: DateKey): DeadlinePace | null {
  if (goal.deadline === null || isGoalReached(goal)) return null;
  const daysLeft = daysBetween(today, goal.deadline) + 1;
  if (daysLeft <= 0) return null;
  const perDay = (goal.targetValue - numericCurrent(goal)) / daysLeft;
  return { daysLeft, perDay, perWeek: perDay * 7 };
}

// ── Списки ───────────────────────────────────────────────

/** Сначала с ближайшим дедлайном, без дедлайна — в конце; дальше по дате создания. */
function byDeadline(a: Goal, b: Goal): number {
  if (a.deadline !== b.deadline) {
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return daysBetween(b.deadline, a.deadline);
  }
  return a.createdAt.localeCompare(b.createdAt);
}

/** Цели в работе: не в архиве и ещё не достигнуты. */
export function activeGoals(data: AppData): Goal[] {
  return data.goals
    .filter((goal) => goal.archivedAt === null && goal.completedAt === null)
    .sort(byDeadline);
}

/** Достигнутые цели, последние — сверху. */
export function reachedGoals(data: AppData): Goal[] {
  return data.goals
    .filter((goal) => goal.archivedAt === null && goal.completedAt !== null)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
}

/** Дедлайн цели прошёл, а она не достигнута. */
export function isGoalOverdue(goal: Goal, today: DateKey): boolean {
  return (
    goal.completedAt === null && goal.deadline !== null && daysBetween(today, goal.deadline) < 0
  );
}
