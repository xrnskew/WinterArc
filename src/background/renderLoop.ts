/**
 * Цикл отрисовки для фона.
 * - ограничивает FPS (метели хватает 30 кадров);
 * - анимация зависит от времени (dt), а не от числа кадров;
 * - ставит паузу, пока вкладка неактивна;
 * - в первые секунды проверяет, тянет ли устройство.
 */

export interface RenderLoopOptions {
  maxFps: number;
  /** Отрисовать кадр. dt — секунды с прошлого кадра (не больше 0.1). */
  onFrame: (dt: number) => void;
  /** Вызывается один раз, если в первые 3 с устройство не держит хотя бы 20 FPS. */
  onSlow?: () => void;
}

const PROBE_WARMUP_MS = 500; // первые кадры всегда медленнее — их не считаем
const PROBE_DURATION_MS = 3000;
const SLOW_FRAME_MS = 50; // в среднем дольше 50 мс на кадр = меньше 20 FPS
const MAX_DT_SECONDS = 0.1;

/** Запускает цикл. Возвращает функцию остановки. */
export function startRenderLoop({ maxFps, onFrame, onSlow }: RenderLoopOptions): () => void {
  // 2 мс допуска: requestAnimationFrame приходит не идеально ровно.
  const minFrameMs = 1000 / maxFps - 2;

  let rafId = 0;
  let lastFrameAt = performance.now();
  let visibleSince = lastFrameAt;
  let probeFrames = 0;
  let probeTotalMs = 0;
  let probeDone = !onSlow;

  const measure = (now: number, frameMs: number) => {
    const visibleFor = now - visibleSince;
    if (probeDone || visibleFor < PROBE_WARMUP_MS) return;
    probeFrames += 1;
    probeTotalMs += frameMs;
    if (visibleFor < PROBE_WARMUP_MS + PROBE_DURATION_MS) return;
    probeDone = true;
    if (probeTotalMs / probeFrames > SLOW_FRAME_MS) onSlow?.();
  };

  const tick = (now: number) => {
    rafId = requestAnimationFrame(tick);
    const frameMs = now - lastFrameAt;
    if (frameMs < minFrameMs) return;
    lastFrameAt = now;
    measure(now, frameMs);
    onFrame(Math.min(frameMs / 1000, MAX_DT_SECONDS));
  };

  const onVisibilityChange = () => {
    cancelAnimationFrame(rafId);
    if (document.hidden) return;
    // После паузы начинаем с чистого листа: без огромного dt и без ложной «медленности».
    lastFrameAt = performance.now();
    visibleSince = lastFrameAt;
    probeFrames = 0;
    probeTotalMs = 0;
    rafId = requestAnimationFrame(tick);
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  if (!document.hidden) rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
