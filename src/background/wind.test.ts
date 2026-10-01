import { describe, expect, it } from 'vitest';
import { createRandom } from '../lib/random';
import { createWind, gustEnvelope } from './wind';

const FRAME = 1 / 30;

function simulate(seconds: number, strength = 1, seed = 42) {
  const wind = createWind(strength, createRandom(seed));
  const states = [];
  for (let t = 0; t < seconds; t += FRAME) states.push(wind.step(FRAME));
  return states;
}

describe('ветер', () => {
  it('за минуту случается хотя бы один порыв', () => {
    const speeds = simulate(60).map((s) => s.speed);
    const calm = Math.min(...speeds);
    const peak = Math.max(...speeds);
    expect(peak).toBeGreaterThan(calm * 3);
  });

  it('скорость ограничена: снег не улетает с экрана за кадр', () => {
    const speeds = simulate(300, 1.5).map((s) => s.speed);
    expect(Math.max(...speeds)).toBeLessThan(1);
    expect(Math.min(...speeds)).toBeGreaterThanOrEqual(0);
  });

  it('снос копится плавно, без скачков', () => {
    const states = simulate(120);
    for (let i = 1; i < states.length; i++) {
      const jump = states[i].offset - states[i - 1].offset;
      expect(jump).toBeGreaterThanOrEqual(0);
      expect(jump).toBeLessThan(0.05);
    }
  });

  it('при нулевой силе — штиль', () => {
    const states = simulate(30, 0);
    expect(states.every((s) => s.speed === 0)).toBe(true);
  });

  it('порыв нарастает, держится и затихает', () => {
    const gust = { startsAt: 10, attack: 1, hold: 2, release: 3, peak: 0.3 };
    expect(gustEnvelope(gust, 9)).toBe(0);
    expect(gustEnvelope(gust, 10.5)).toBeGreaterThan(0);
    expect(gustEnvelope(gust, 10.5)).toBeLessThan(1);
    expect(gustEnvelope(gust, 12)).toBe(1);
    expect(gustEnvelope(gust, 16)).toBe(0);
  });
});
