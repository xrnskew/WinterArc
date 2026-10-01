import { describe, expect, it } from 'vitest';
import { addEntry, addGoal, goalFromDraft, newGoalDraft, type GoalDraft } from '../../domain/goals';
import { CREATED, makeData } from '../../domain/testData';
import type { NumericGoal } from '../../domain/types';
import { decimalsOf, forecastText, goalPercent, progressLabel, progressSeries } from './goalText';

const plain = (text: string) => text.replace(/\s/g, ' ');

const savings: GoalDraft = {
  ...newGoalDraft('2026-12-31'),
  title: 'Подушка',
  kind: 'numeric',
  unit: '₽',
  startValue: 0,
  targetValue: 50000,
};

function goalWith(draft: GoalDraft, entries: [string, number][]): NumericGoal {
  const goal = goalFromDraft(draft, () => 'goal', null, CREATED);
  let data = addGoal(makeData([]), goal);
  entries.forEach(([date, value], i) => {
    data = addEntry(data, 'goal', `e${i}`, { date, value, note: '' }, CREATED);
  });
  return data.goals[0] as NumericGoal;
}

describe('подписи целей', () => {
  it('прогресс по-разному для пополнений и замеров', () => {
    expect(plain(progressLabel(goalWith(savings, [['2026-10-02', 12400]])))).toBe(
      '12 400 из 50 000 ₽',
    );
    const weight = goalWith(
      { ...savings, unit: 'кг', startValue: 80, targetValue: 75, entryMode: 'set' },
      [['2026-10-05', 78.5]],
    );
    expect(progressLabel(weight)).toBe('сейчас 78,5 кг, цель 75 кг');
    expect(goalPercent(weight)).toBe(30);
  });

  it('прогноз: темп и успеваешь ли к дедлайну', () => {
    const goal = goalWith(savings, [['2026-10-02', 7000]]);
    const text = forecastText(goal, '2026-10-08');
    expect(text.headline).toBe('При таком темпе — к 20 ноября.');
    expect(text.details.map(plain)).toEqual([
      'Темп: +7 000 ₽ в неделю.',
      'К дедлайну 31 декабря успеваешь.',
    ]);
  });

  it('прогноз: не успеваешь — сколько нужно', () => {
    const goal = goalWith(savings, [['2026-10-02', 700]]);
    const text = forecastText(goal, '2026-12-25');
    // Осталось 49 300 на 7 дней — меньше двух недель, поэтому «в день».
    expect(text.details.map(plain)).toContain('Чтобы успеть к 31 декабря, нужно +7 043 ₽ в день.');
  });

  it('ряд для графика: пополнения копятся, у замеров пропуски', () => {
    expect(progressSeries(goalWith(savings, [['2026-10-02', 100]]), '2026-10-03')).toEqual([
      0, 100, 100,
    ]);
    const weight = goalWith({ ...savings, startValue: 80, targetValue: 75, entryMode: 'set' }, [
      ['2026-10-03', 79],
    ]);
    expect(progressSeries(weight, '2026-10-03')).toEqual([80, null, 79]);
  });

  it('знаки после запятой', () => {
    expect([decimalsOf(78), decimalsOf(78.5), decimalsOf(78.25), decimalsOf(1 / 3)]).toEqual([
      0, 1, 2, 2,
    ]);
  });
});
