import { describe, expect, it } from 'vitest';
import { saveCopyBeforeReplace, BEFORE_REPLACE_KEY } from '../storage/localStore';
import { getActiveArc } from './arc';
import { addWidget, defaultDashboard, resetDashboard } from './dashboard';
import {
  activeScales,
  addScale,
  archiveScale,
  restoreScale,
  updateScale,
  validateScaleName,
} from './days';
import { archiveHabit, archivedHabits, arcHabits, moveHabit, restoreHabit } from './habits';
import { makeData, makeHabit } from './testData';

const NOW = '2026-10-10T10:00:00.000Z';
const names = (data: ReturnType<typeof makeData>) =>
  arcHabits(data, getActiveArc(data)!).map((habit) => habit.id);

describe('порядок и архив привычек', () => {
  const base = makeData([makeHabit('a', {}), makeHabit('b', {}), makeHabit('c', {})]);

  it('вверх и вниз среди видимых; у краёв — без изменений', () => {
    expect(names(moveHabit(base, 'b', -1))).toEqual(['b', 'a', 'c']);
    expect(names(moveHabit(base, 'b', 1))).toEqual(['a', 'c', 'b']);
    expect(names(moveHabit(base, 'a', -1))).toEqual(['a', 'b', 'c']);
  });

  it('архивная не мешает перестановке и возвращается в конец', () => {
    let data = archiveHabit(base, 'b', NOW);
    expect(names(moveHabit(data, 'c', -1))).toEqual(['c', 'a']);
    expect(archivedHabits(data).map((habit) => habit.id)).toEqual(['b']);
    data = restoreHabit(moveHabit(data, 'c', -1), 'b');
    expect(names(data)).toEqual(['c', 'a', 'b']);
    expect(archivedHabits(data)).toEqual([]);
  });
});

describe('шкалы оценок', () => {
  it('добавить, переименовать, убрать и вернуть', () => {
    let data = addScale(makeData([]), 'sleep', '  Сон ', 'moon');
    expect(activeScales(data).at(-1)).toMatchObject({ id: 'sleep', name: 'Сон', icon: 'moon' });
    data = updateScale(data, 'sleep', 'Качество сна', 'bed');
    expect(activeScales(data).at(-1)).toMatchObject({ name: 'Качество сна', icon: 'bed' });
    data = archiveScale(data, 'sleep', NOW);
    expect(activeScales(data).some((scale) => scale.id === 'sleep')).toBe(false);
    data = restoreScale(data, 'sleep');
    expect(activeScales(data).some((scale) => scale.id === 'sleep')).toBe(true);
  });

  it('название обязательно и не слишком длинное', () => {
    expect(validateScaleName(' ')).not.toBeNull();
    expect(validateScaleName('Сон')).toBeNull();
    expect(validateScaleName('x'.repeat(30))).not.toBeNull();
  });
});

describe('виджеты и замена данных', () => {
  it('набор виджетов по умолчанию возвращается', () => {
    let counter = 0;
    const id = () => `w${++counter}`;
    let data = { ...makeData([]), dashboard: defaultDashboard(id) };
    data = addWidget(data, { id: 'x', type: 'tasks', size: 'full' });
    expect(resetDashboard(data, id).dashboard.map((widget) => widget.type)).toEqual([
      'discipline',
      'week',
      'today',
      'why',
    ]);
  });

  it('перед заменой данных сохраняется копия', () => {
    const saved = new Map<string, string>();
    const storage = {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => void saved.set(key, value),
    };
    const data = makeData([]);
    expect(saveCopyBeforeReplace(storage, data)).toBe(true);
    expect(JSON.parse(saved.get(BEFORE_REPLACE_KEY)!).arcs).toHaveLength(1);
  });
});
