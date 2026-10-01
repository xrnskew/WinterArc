import { describe, expect, it } from 'vitest';
import { addAbstainEvent } from './abstain';
import { arcDayMarks, dayScore, habitWeekScore, toIndex, weekScore } from './discipline';
import { getActiveArc } from './arc';
import { setLog } from './progress';
import { makeData, makeHabit } from './testData';

const check = makeHabit('check', { kind: 'check' });
const reading = makeHabit('reading', { kind: 'count', unit: 'страниц', dailyTarget: 20 });
const gym = makeHabit('gym', { kind: 'check', schedule: { type: 'timesPerWeek', times: 4 } });
const smoking = makeHabit('smoking', { kind: 'abstain' });
const habits = [check, reading, gym, smoking];

describe('индекс дисциплины', () => {
  it('индекс дня — среднее по запланированным, гибкие не входят', () => {
    let data = makeData(habits);
    data = setLog(data, 'check', '2026-10-01', 1);
    data = setLog(data, 'reading', '2026-10-01', 10);
    data = setLog(data, 'gym', '2026-10-01', 1);
    // check 1, reading 0.5, smoking 1 (чистый) → 2.5 / 3
    expect(dayScore(habits, data, '2026-10-01')).toBeCloseTo(2.5 / 3);
    expect(toIndex(dayScore(habits, data, '2026-10-01'))).toBe(83);
  });

  it('срыв даёт отказу 0 за день', () => {
    let data = makeData([smoking]);
    data = addAbstainEvent(data, {
      id: 'e',
      habitId: 'smoking',
      date: '2026-10-02',
      type: 'relapse',
      reason: '',
      createdAt: '2026-10-02T20:00:00.000Z',
    });
    expect(dayScore([smoking], data, '2026-10-02')).toBe(0);
  });

  it('до создания привычки дней нет', () => {
    expect(dayScore([check], makeData([check]), '2026-09-30')).toBeNull();
  });

  it('гибкая привычка в текущей неделе: цель пропорциональна прошедшим дням', () => {
    // Неделя 5–11 октября, сегодня среда (3 дня из 7), цель 4 раза → ожидаем ~1.7.
    let data = makeData([gym]);
    data = setLog(data, 'gym', '2026-10-05', 1);
    data = setLog(data, 'gym', '2026-10-06', 1);
    expect(habitWeekScore(gym, data, '2026-10-05', '2026-10-07')).toBe(1);
    // К воскресенью 2 из 4 — половина.
    expect(habitWeekScore(gym, data, '2026-10-05', '2026-10-11')).toBe(0.5);
  });

  it('индекс недели — у каждой привычки равный вес', () => {
    let data = makeData([check, gym]);
    for (const day of [
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ]) {
      data = setLog(data, 'check', day, 1);
    }
    // check — 1, gym — 0 из 4 → 0.5
    expect(weekScore([check, gym], data, '2026-10-05', '2026-10-11')).toBe(0.5);
  });

  it('зарубки: индекс прошлых дней, срывы, будущее без оценки', () => {
    let data = makeData([check, smoking]);
    data = setLog(data, 'check', '2026-10-01', 1);
    data = addAbstainEvent(data, {
      id: 'e',
      habitId: 'smoking',
      date: '2026-10-02',
      type: 'relapse',
      reason: '',
      createdAt: '2026-10-02T20:00:00.000Z',
    });
    const marks = arcDayMarks(data, getActiveArc(data)!, '2026-10-03');
    expect(marks[0]).toMatchObject({ status: 'past', score: 1, relapse: false });
    expect(marks[1]).toMatchObject({ status: 'past', score: 0, relapse: true });
    expect(marks[2].status).toBe('today');
    expect(marks[3]).toMatchObject({ status: 'future', score: null, relapse: false });
  });
});
