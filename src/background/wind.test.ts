import { describe, expect, it } from 'vitest';
import { createRandom } from '../lib/random';
import { createNoise, createWind } from './wind';

const FRAME = 1 / 30;

function simulate(seconds: number, strength = 1, seed = 42) {
  const wind = createWind(strength, createRandom(seed));
  const states = [];
  for (let t = 0; t < seconds; t += FRAME) states.push(wind.step(FRAME));
  return states;
}

describe('ветер', () => {
  it('за минуту ветер то усиливается, то стихает', () => {
    const speeds = simulate(60).map((s) => s.speed);
    expect(Math.max(...speeds)).toBeGreaterThan(Math.min(...speeds) * 1.8);
  });

  it('спокойный: снег плывёт, а не улетает вбок', () => {
    const speeds = simulate(300, 1).map((s) => s.speed);
    // Не быстрее 0,045 высоты экрана в секунду — вдвое медленнее падения ближних хлопьев.
    expect(Math.max(...speeds)).toBeLessThanOrEqual(0.045);
    expect(Math.min(...speeds)).toBeGreaterThan(0);
  });

  it('порывы плавные: за кадр скорость почти не меняется', () => {
    const speeds = simulate(300, 1.8).map((s) => s.speed);
    for (let i = 1; i < speeds.length; i++) {
      expect(Math.abs(speeds[i] - speeds[i - 1])).toBeLessThan(0.002);
    }
  });

  it('снос копится плавно, без скачков', () => {
    const states = simulate(120);
    for (let i = 1; i < states.length; i++) {
      const jump = states[i].offset - states[i - 1].offset;
      expect(jump).toBeGreaterThanOrEqual(0);
      expect(jump).toBeLessThan(0.01);
    }
  });

  it('при нулевой силе — штиль', () => {
    const states = simulate(30, 0);
    expect(states.every((s) => s.speed === 0)).toBe(true);
  });

  it('смена силы ветра — постепенно, а не скачком', () => {
    const wind = createWind(0, createRandom(1));
    wind.step(FRAME);
    wind.setStrength(1.8);
    const first = wind.step(FRAME).speed;
    let later = 0;
    for (let t = 0; t < 4; t += FRAME) later = wind.step(FRAME).speed;
    expect(first).toBeLessThan(later * 0.1);
  });
});

describe('плавный шум', () => {
  it('в пределах 0…1 и без скачков между узлами', () => {
    const noise = createNoise(7, createRandom(3));
    let previous = noise(0);
    for (let t = FRAME; t < 120; t += FRAME) {
      const value = noise(t);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(Math.abs(value - previous)).toBeLessThan(0.02);
      previous = value;
    }
  });
});
