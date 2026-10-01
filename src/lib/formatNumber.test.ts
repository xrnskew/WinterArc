import { describe, expect, it } from 'vitest';
import { formatNumber, formatRounded, formatSigned } from './formatNumber';

// В русской записи тысячи разделяет неразрывный пробел — для сравнения меняем его на обычный.
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('числа по-русски', () => {
  it('тысячи через пробел, дробь через запятую', () => {
    expect(plain(formatNumber(12400))).toBe('12 400');
    expect(formatNumber(72.5)).toBe('72,5');
    expect(formatNumber(1 / 3)).toBe('0,33');
  });

  it('минус — настоящий, ноль без знака', () => {
    expect(formatNumber(-0.5)).toBe('−0,5');
    expect(formatNumber(-0.001)).toBe('0');
  });

  it('вычисленные числа округляются по величине', () => {
    expect(plain(formatRounded(1234.567))).toBe('1 235');
    expect(formatRounded(12.345)).toBe('12,3');
    expect(formatRounded(0.4321)).toBe('0,43');
  });

  it('со знаком', () => {
    expect(plain(formatSigned(1000))).toBe('+1 000');
    expect(formatSigned(-0.4)).toBe('−0,4');
    expect(formatSigned(0)).toBe('0');
  });
});
