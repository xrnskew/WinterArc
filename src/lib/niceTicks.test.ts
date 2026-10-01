import { describe, expect, it } from 'vitest';
import { niceTicks } from './niceTicks';

describe('niceTicks', () => {
  it('круглые деления', () => {
    expect(niceTicks(36)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(6)).toEqual([0, 2, 4, 6]);
    expect(niceTicks(100)).toEqual([0, 50, 100]);
    expect(niceTicks(240)).toEqual([0, 100, 200, 300]);
  });

  it('маленькие значения — целые шаги', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
  });
});
