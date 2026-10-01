import { describe, expect, it } from 'vitest';
import { getActiveArc } from './arc';
import { getDayEntry, setDayNote, setRating } from './days';
import { addHabit, archiveHabit, arcHabits, draftFromHabit, updateHabit } from './habits';
import { makeData, makeHabit } from './testData';

describe('оценки и заметка дня', () => {
  it('оценка ограничена 1–10, null убирает', () => {
    let data = makeData([]);
    const scale = data.ratingScales[0].id;
    data = setRating(data, '2026-10-01', scale, 14);
    expect(getDayEntry(data, '2026-10-01').ratings[scale]).toBe(10);
    data = setRating(data, '2026-10-01', scale, null);
    expect(data.days['2026-10-01']).toBeUndefined();
  });

  it('пустой день не хранится, заметка сохраняется', () => {
    let data = setDayNote(makeData([]), '2026-10-01', 'Тяжёлый день');
    expect(getDayEntry(data, '2026-10-01').note).toBe('Тяжёлый день');
    data = setDayNote(data, '2026-10-01', '  ');
    expect(data.days).toEqual({});
  });
});

describe('изменения привычек', () => {
  const water = makeHabit('water', { kind: 'count', unit: 'стаканов', dailyTarget: 8 });

  it('новая привычка встаёт в конец текущей арки', () => {
    const data = addHabit(makeData([makeHabit('a', {})]), water);
    expect(getActiveArc(data)?.habitIds).toEqual(['a', 'water']);
  });

  it('правка не меняет тип, id и дату создания', () => {
    const data = updateHabit(makeData([water]), 'water', {
      ...draftFromHabit(water),
      name: 'Вода и чай',
      kind: 'check',
      dailyTarget: 10,
    });
    expect(data.habits[0]).toMatchObject({
      id: 'water',
      kind: 'count',
      name: 'Вода и чай',
      dailyTarget: 10,
      createdAt: water.createdAt,
    });
  });

  it('архив убирает из списка арки, но не из данных', () => {
    const data = archiveHabit(makeData([water]), 'water', '2026-10-05T10:00:00.000Z');
    expect(arcHabits(data, getActiveArc(data)!)).toEqual([]);
    expect(data.habits).toHaveLength(1);
  });
});
