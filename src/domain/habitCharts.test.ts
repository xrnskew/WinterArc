import { describe, expect, it } from 'vitest';
import { addAbstainEvent } from './abstain';
import { chartFor, DAILY_WINDOW } from './habitCharts';
import { setLog } from './progress';
import { ARC_START, makeData, makeHabit } from './testData';

describe('данные графиков', () => {
  it('количество: столбцы по дням за последние 4 недели и линия цели', () => {
    const reading = makeHabit('reading', { kind: 'count', unit: 'страниц', dailyTarget: 20 });
    let data = makeData([reading]);
    data = setLog(data, 'reading', '2026-11-20', 25);
    const chart = chartFor(reading, data, ARC_START, '2026-11-20');
    expect(chart.kind).toBe('daily');
    expect(chart.points).toHaveLength(DAILY_WINDOW);
    expect(chart.points.at(-1)).toEqual({ date: '2026-11-20', value: 25, done: true });
    expect(chart.target).toBe(20);
    expect(chart.unit).toBe('страниц');
  });

  it('в начале арки дней меньше, чем окно', () => {
    const reading = makeHabit('reading', { kind: 'count', unit: 'страниц', dailyTarget: 20 });
    expect(chartFor(reading, makeData([reading]), ARC_START, '2026-10-03').points).toHaveLength(3);
  });

  it('да/нет: процент по неделям, неполные недели считаются по своим дням', () => {
    const check = makeHabit('check', { kind: 'check' });
    let data = makeData([check]);
    for (const day of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
      data = setLog(data, 'check', day, 1);
    }
    data = setLog(data, 'check', '2026-10-05', 1);
    const chart = chartFor(check, data, ARC_START, '2026-10-06');
    expect(chart.kind).toBe('weeklyRate');
    expect(chart.points).toEqual([
      { date: '2026-09-28', value: 100, done: true }, // чт–вс: 4 из 4
      { date: '2026-10-05', value: 50, done: false }, // пн–вт: 1 из 2
    ]);
  });

  it('N раз в неделю: количество по неделям с целью', () => {
    const gym = makeHabit('gym', { kind: 'check', schedule: { type: 'timesPerWeek', times: 3 } });
    const data = setLog(makeData([gym]), 'gym', '2026-10-06', 1);
    const chart = chartFor(gym, data, ARC_START, '2026-10-08');
    expect(chart).toMatchObject({ kind: 'weekly', target: 3, unit: 'раз' });
    expect(chart.points.at(-1)).toEqual({ date: '2026-10-05', value: 1, done: false });
  });

  it('отказ: серия растёт и падает до нуля при срыве', () => {
    const smoking = makeHabit('smoking', { kind: 'abstain' });
    const data = addAbstainEvent(makeData([smoking]), {
      id: 'e',
      habitId: 'smoking',
      date: '2026-10-03',
      type: 'relapse',
      reason: '',
      createdAt: '2026-10-03T20:00:00.000Z',
    });
    const chart = chartFor(smoking, data, ARC_START, '2026-10-05');
    expect(chart.points.map((p) => p.value)).toEqual([1, 2, 0, 1, 2]);
  });
});
