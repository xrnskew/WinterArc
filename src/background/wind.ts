import { between } from '../lib/random';

/**
 * Ветер для метели.
 *
 * Скорость ветра = ровный фоновый ветерок + редкие порывы.
 * Единица — высота экрана в секунду по горизонтали (плюс — вправо).
 * Шейдеру передаём не скорость, а накопленный снос (offset):
 * так хлопья не прыгают, когда скорость меняется.
 */

export interface WindState {
  /** Текущая скорость ветра. */
  speed: number;
  /** Сколько ветер снёс снег с начала (сумма speed × dt). */
  offset: number;
}

export interface Wind {
  /** Продвинуть время на dt секунд и получить новое состояние. */
  step(dt: number): WindState;
  /** Сменить силу ветра (ползунок метели) без рывка. */
  setStrength(strength: number): void;
}

interface Gust {
  startsAt: number;
  attack: number; // нарастание, с
  hold: number; // пик, с
  release: number; // затихание, с
  peak: number; // скорость на пике (при силе ветра 1)
}

/** Плавная ступенька 0 → 1 (как smoothstep в GLSL). */
function smooth(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

/** Насколько порыв «включён» в момент time: 0…1. */
export function gustEnvelope(gust: Gust, time: number): number {
  const t = time - gust.startsAt;
  if (t <= 0) return 0;
  if (t < gust.attack) return smooth(t / gust.attack);
  if (t < gust.attack + gust.hold) return 1;
  return 1 - smooth((t - gust.attack - gust.hold) / gust.release);
}

function gustEnd(gust: Gust): number {
  return gust.startsAt + gust.attack + gust.hold + gust.release;
}

export function createWind(strength: number, random: () => number = Math.random): Wind {
  let time = 0;
  let offset = 0;
  let currentStrength = strength;

  const planGust = (after: number): Gust => ({
    startsAt: after + between(random, 5, 14),
    attack: between(random, 1, 2),
    hold: between(random, 0.6, 2.4),
    release: between(random, 2.5, 4.5),
    peak: between(random, 0.22, 0.42),
  });

  let gust = planGust(0);

  return {
    step(dt) {
      time += dt;

      // Фоновый ветерок: сумма медленных синусов, всегда немного вправо.
      const breeze =
        0.05 +
        0.025 * Math.sin(time * 0.13) +
        0.015 * Math.sin(time * 0.31 + 1.7) +
        0.008 * Math.sin(time * 0.71 + 0.4);

      const gustSpeed = gust.peak * gustEnvelope(gust, time);
      if (time > gustEnd(gust)) gust = planGust(time);

      const speed = currentStrength * (breeze + gustSpeed);
      offset += speed * dt;
      return { speed, offset };
    },

    setStrength(next) {
      currentStrength = next;
    },
  };
}
