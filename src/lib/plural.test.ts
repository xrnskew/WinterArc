import { describe, expect, it } from 'vitest';
import { plural } from './plural';

const days = (n: number) => plural(n, 'день', 'дня', 'дней');

describe('plural', () => {
  it('склоняет по последней цифре', () => {
    expect(days(1)).toBe('день');
    expect(days(2)).toBe('дня');
    expect(days(5)).toBe('дней');
    expect(days(0)).toBe('дней');
  });

  it('11–14 всегда «дней»', () => {
    expect(days(11)).toBe('дней');
    expect(days(12)).toBe('дней');
    expect(days(114)).toBe('дней');
  });

  it('работает с большими числами', () => {
    expect(days(21)).toBe('день');
    expect(days(92)).toBe('дня');
    expect(days(101)).toBe('день');
  });
});
