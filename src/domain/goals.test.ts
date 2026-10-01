import { describe, expect, it } from 'vitest';
import {
  activeGoals,
  addEntry,
  addGoal,
  addStep,
  archiveGoal,
  draftFromGoal,
  goalFromDraft,
  goalProgress,
  isGoalOverdue,
  neededPace,
  newGoalDraft,
  numericCurrent,
  numericForecast,
  reachedGoals,
  removeEntry,
  removeStep,
  toggleStep,
  updateGoal,
  validateEntry,
  validateGoalDraft,
  type GoalDraft,
} from './goals';
import { CREATED, makeData } from './testData';
import type { AppData, Goal, NumericGoal } from './types';

let counter = 0;
const id = () => `g${++counter}`;
const LATER = '2026-10-20T10:00:00.000Z';

const stepsDraft: GoalDraft = {
  ...newGoalDraft('2026-12-31'),
  title: 'Сдать на права',
  steps: ['Теория', '  ', 'Площадка', 'Город'],
};

const savingsDraft: GoalDraft = {
  ...newGoalDraft('2026-12-31'),
  title: 'Подушка',
  kind: 'numeric',
  unit: '₽',
  startValue: 0,
  targetValue: 50000,
  entryMode: 'add',
};

const weightDraft: GoalDraft = {
  ...savingsDraft,
  title: 'Вес',
  unit: 'кг',
  startValue: 80,
  targetValue: 75,
  entryMode: 'set',
};

/** Данные с одной целью из черновика. */
function withGoal(draft: GoalDraft): { data: AppData; goal: Goal } {
  const goal = goalFromDraft(draft, id, 'arc', CREATED);
  return { data: addGoal(makeData([]), goal), goal };
}

const numeric = (data: AppData, goalId: string) =>
  data.goals.find((goal) => goal.id === goalId) as NumericGoal;

describe('форма цели', () => {
  it('пустые шаги отбрасываются, у каждого шага свой id', () => {
    const goal = goalFromDraft(stepsDraft, id, 'arc', CREATED);
    expect(goal.kind === 'steps' && goal.steps.map((step) => step.title)).toEqual([
      'Теория',
      'Площадка',
      'Город',
    ]);
    expect(goal.kind === 'steps' && new Set(goal.steps.map((s) => s.id)).size).toBe(3);
    expect(goal.arcId).toBe('arc');
  });

  it('проверка: название, шаги, старт и цель', () => {
    expect(validateGoalDraft({ ...stepsDraft, title: ' ' }).title).toBeDefined();
    expect(validateGoalDraft({ ...stepsDraft, steps: ['', ' '] }).steps).toBeDefined();
    expect(validateGoalDraft({ ...savingsDraft, targetValue: NaN }).values).toBeDefined();
    expect(validateGoalDraft({ ...savingsDraft, targetValue: 0 }).values).toBeDefined();
    // Пополнения не могут вести вниз, а замеры — могут (вес).
    expect(validateGoalDraft({ ...savingsDraft, targetValue: -100 }).values).toBeDefined();
    expect(validateGoalDraft(weightDraft)).toEqual({});
  });

  it('черновик из цели и обратно', () => {
    const { goal } = withGoal(weightDraft);
    expect(draftFromGoal(goal)).toMatchObject({ unit: 'кг', startValue: 80, targetValue: 75 });
  });
});

describe('цель по шагам', () => {
  it('прогресс и достижение: последний шаг ставит completedAt, снятие — убирает', () => {
    let { data, goal } = withGoal({ ...stepsDraft, steps: ['Теория', 'Город'] });
    const [first, second] = goal.kind === 'steps' ? goal.steps : [];

    data = toggleStep(data, goal.id, first.id, LATER);
    expect(goalProgress(data.goals[0])).toEqual({ current: 1, target: 2, ratio: 0.5 });
    expect(data.goals[0].completedAt).toBeNull();

    data = toggleStep(data, goal.id, second.id, LATER);
    expect(data.goals[0].completedAt).toBe(LATER);
    expect(reachedGoals(data)).toHaveLength(1);
    expect(activeGoals(data)).toHaveLength(0);

    data = toggleStep(data, goal.id, second.id, LATER);
    expect(data.goals[0].completedAt).toBeNull();
  });

  it('новый шаг возвращает достигнутую цель в работу, удаление — наоборот', () => {
    let { data, goal } = withGoal({ ...stepsDraft, steps: ['Теория'] });
    const step = goal.kind === 'steps' ? goal.steps[0] : null;
    data = toggleStep(data, goal.id, step!.id, LATER);
    data = addStep(data, goal.id, 'new', '  Город ', LATER);
    expect(data.goals[0].completedAt).toBeNull();
    expect(goalProgress(data.goals[0]).target).toBe(2);
    data = removeStep(data, goal.id, 'new', LATER);
    expect(data.goals[0].completedAt).toBe(LATER);
  });
});

describe('числовая цель', () => {
  it('пополнения складываются, цель достигается и откатывается', () => {
    let { data, goal } = withGoal(savingsDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-02', value: 20000, note: '' }, LATER);
    expect(goalProgress(numeric(data, goal.id)).ratio).toBe(0.4);
    data = addEntry(data, goal.id, 'e2', { date: '2026-10-05', value: 30000, note: '' }, LATER);
    expect(numeric(data, goal.id).completedAt).toBe(LATER);
    data = removeEntry(data, goal.id, 'e2', LATER);
    expect(numeric(data, goal.id).completedAt).toBeNull();
  });

  it('замеры: текущее — последний по дате, цель вниз считается правильно', () => {
    let { data, goal } = withGoal(weightDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-15', value: 78, note: '' }, LATER);
    // Внесён позже, но датой раньше — не последний.
    data = addEntry(data, goal.id, 'e2', { date: '2026-10-08', value: 79, note: '' }, LATER);
    const weight = numeric(data, goal.id);
    expect(numericCurrent(weight)).toBe(78);
    expect(goalProgress(weight).ratio).toBe(0.4);
  });

  it('дробные пополнения доходят до цели без ошибки округления', () => {
    let { data, goal } = withGoal({ ...savingsDraft, targetValue: 0.3 });
    data = addEntry(data, goal.id, 'a', { date: '2026-10-02', value: 0.1, note: '' }, LATER);
    data = addEntry(data, goal.id, 'b', { date: '2026-10-02', value: 0.2, note: '' }, LATER);
    expect(numeric(data, goal.id).completedAt).toBe(LATER);
  });

  it('правка цели может сделать её достигнутой', () => {
    let { data, goal } = withGoal(savingsDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-02', value: 20000, note: '' }, LATER);
    data = updateGoal(data, goal.id, { ...savingsDraft, targetValue: 20000 }, LATER);
    expect(numeric(data, goal.id).completedAt).toBe(LATER);
    expect(numeric(data, goal.id).kind).toBe('numeric');
  });

  it('запись: число, пополнение больше нуля, не из будущего', () => {
    const { goal } = withGoal(savingsDraft);
    const savings = goal as NumericGoal;
    const ok = { date: '2026-10-05', value: 100, note: '' };
    expect(validateEntry(savings, ok, '2026-10-05')).toBeNull();
    expect(validateEntry(savings, { ...ok, value: NaN }, '2026-10-05')).not.toBeNull();
    expect(validateEntry(savings, { ...ok, value: 0 }, '2026-10-05')).not.toBeNull();
    expect(validateEntry(savings, { ...ok, date: '2026-10-06' }, '2026-10-05')).not.toBeNull();
  });
});

describe('прогноз', () => {
  it('без записей и в первую неделю прогноза нет', () => {
    let { data, goal } = withGoal(savingsDraft);
    expect(numericForecast(numeric(data, goal.id), '2026-10-05')).toEqual({ status: 'noEntries' });
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-02', value: 7000, note: '' }, LATER);
    expect(numericForecast(numeric(data, goal.id), '2026-10-05')).toEqual({
      status: 'tooEarly',
      readyOn: '2026-10-08',
    });
  });

  it('пополнения: темп от начала цели до сегодня', () => {
    let { data, goal } = withGoal(savingsDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-02', value: 7000, note: '' }, LATER);
    // 1–8 октября: 7 дней, 1000 ₽ в день. Остаток 43 000 → 43 дня от 8 октября.
    expect(numericForecast(numeric(data, goal.id), '2026-10-08')).toEqual({
      status: 'eta',
      date: '2026-11-20',
      perWeek: 7000,
    });
  });

  it('замеры: темп от старта до последнего замера', () => {
    let { data, goal } = withGoal(weightDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-15', value: 79, note: '' }, LATER);
    // Минус 1 кг за 14 дней, осталось 4 кг → 56 дней от 15 октября.
    const forecast = numericForecast(numeric(data, goal.id), '2026-10-20');
    expect(forecast).toMatchObject({ status: 'eta', date: '2026-12-10' });
    expect(forecast.status === 'eta' && forecast.perWeek).toBeCloseTo(-0.5);
  });

  it('темп не в ту сторону — прогноза нет', () => {
    let { data, goal } = withGoal(weightDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-15', value: 81, note: '' }, LATER);
    expect(numericForecast(numeric(data, goal.id), '2026-10-20').status).toBe('stalled');
  });

  it('нужный темп до дедлайна и просрочка', () => {
    let { data, goal } = withGoal(savingsDraft);
    data = addEntry(data, goal.id, 'e1', { date: '2026-10-02', value: 18000, note: '' }, LATER);
    // 30 ноября – 31 декабря: 32 дня, осталось 32 000 → 1000 в день.
    expect(neededPace(numeric(data, goal.id), '2026-11-30')).toEqual({
      daysLeft: 32,
      perDay: 1000,
      perWeek: 7000,
    });
    expect(neededPace(numeric(data, goal.id), '2027-01-01')).toBeNull();
    expect(isGoalOverdue(data.goals[0], '2026-12-31')).toBe(false);
    expect(isGoalOverdue(data.goals[0], '2027-01-01')).toBe(true);
  });
});

describe('список целей', () => {
  it('по дедлайну, без дедлайна — в конце, архив скрыт', () => {
    let data = makeData([]);
    const late = goalFromDraft({ ...stepsDraft, title: 'Поздняя' }, id, null, CREATED);
    const none = goalFromDraft(
      { ...stepsDraft, title: 'Без срока', deadline: null },
      id,
      null,
      CREATED,
    );
    const soon = goalFromDraft(
      { ...stepsDraft, title: 'Скоро', deadline: '2026-11-01' },
      id,
      null,
      CREATED,
    );
    const hidden = goalFromDraft({ ...stepsDraft, title: 'Архив' }, id, null, CREATED);
    for (const goal of [none, late, soon, hidden]) data = addGoal(data, goal);
    data = archiveGoal(data, hidden.id, LATER);
    expect(activeGoals(data).map((goal) => goal.title)).toEqual(['Скоро', 'Поздняя', 'Без срока']);
  });
});
