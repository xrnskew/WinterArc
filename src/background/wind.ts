/**
 * Ветер для метели.
 *
 * Скорость ветра = слабый ровный ветерок + два слоя плавного шума:
 * медленный (меняется за ~23 с) и «порывы» (за ~7 с). Шум не скачет:
 * между случайными значениями — мягкий переход, поэтому порывы нарастают
 * и затухают постепенно, без рывков.
 *
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
  /** Сменить силу ветра (ползунок метели) — плавно, за пару секунд. */
  setStrength(strength: number): void;
}

/** Скорость при силе 1: ровный ветерок + медленный шум + порывы. До 0,045 высоты экрана в секунду —
 * вдвое медленнее падения ближних хлопьев: снег плывёт почти отвесно, ветер лишь клонит его. */
const BREEZE = 0.006;
const SLOW_AMPLITUDE = 0.012;
const SLOW_PERIOD = 23; // с
const GUST_AMPLITUDE = 0.027;
const GUST_PERIOD = 7; // с
/** За сколько секунд сила ветра почти догоняет новую после смены ползунка. */
const STRENGTH_EASE = 2;

/** Плавная ступенька 0 → 1 (как smoothstep в GLSL): в начале и в конце без рывка. */
export function smooth(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

/**
 * Плавный шум 0…1: через каждые period секунд — новое случайное значение,
 * между ними — мягкий переход.
 */
export function createNoise(period: number, random: () => number): (time: number) => number {
  let from = random();
  let to = random();
  let knotTime = 0; // когда было значение from
  return (time) => {
    while (time - knotTime >= period) {
      knotTime += period;
      from = to;
      to = random();
    }
    return from + (to - from) * smooth((time - knotTime) / period);
  };
}

export function createWind(strength: number, random: () => number = Math.random): Wind {
  let time = 0;
  let offset = 0;
  let currentStrength = strength;
  let targetStrength = strength;
  const slow = createNoise(SLOW_PERIOD, random);
  const gusts = createNoise(GUST_PERIOD, random);

  return {
    step(dt) {
      time += dt;
      // Сила ветра догоняет новую постепенно: смена «Метель» → «Буран» без рывка.
      currentStrength += (targetStrength - currentStrength) * Math.min(dt / STRENGTH_EASE, 1);

      const speed =
        currentStrength * (BREEZE + SLOW_AMPLITUDE * slow(time) + GUST_AMPLITUDE * gusts(time));
      offset += speed * dt;
      return { speed, offset };
    },

    setStrength(next) {
      targetStrength = next;
    },
  };
}
