import { parseColor } from '../design/color';
import { startRenderLoop } from './renderLoop';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './snowShader';
import type { SnowPreset } from './snowPresets';
import { bindFullscreenTriangle, createContext, createProgram } from './webgl';
import { createWind } from './wind';

/**
 * Сцена метели: WebGL, ветер, время и цикл отрисовки.
 * Не зависит от React — компонент ShaderSnow только создаёт её и управляет.
 */

export interface SnowScene {
  /** Сменить интенсивность без рывка снега. */
  setPreset(preset: SnowPreset): void;
  /** Запустить анимацию. onSlow — если устройство не тянет. */
  play(onSlow?: () => void): void;
  /** Остановить и показать один застывший кадр (prefers-reduced-motion). */
  freeze(): void;
  dispose(): void;
}

export interface SnowSceneOptions {
  canvas: HTMLCanvasElement;
  preset: SnowPreset;
  background: string;
  snowflake: string;
  /** Видеокарта отобрала контекст — дальше рисовать нельзя. */
  onContextLost: () => void;
}

const MAX_FPS = 30;
/** Для застывшего кадра «прокручиваем» время, чтобы хлопья уже были рассыпаны. */
const FROZEN_TIME = 12;

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uFall',
  'uFallSpeed',
  'uWindOffset',
  'uWindSpeed',
  'uLayers',
  'uDensity',
  'uDriftAlpha',
  'uBackground',
  'uSnow',
] as const;

function toVec3(color: string): [number, number, number] {
  const [r, g, b] = parseColor(color).rgb;
  return [r / 255, g / 255, b / 255];
}

export function createSnowScene(options: SnowSceneOptions): SnowScene {
  const { canvas } = options;
  const gl = createContext(canvas);
  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  gl.useProgram(program);
  bindFullscreenTriangle(gl, program);

  const uniform = Object.fromEntries(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;

  gl.uniform3fv(uniform.uBackground, toVec3(options.background));
  gl.uniform3fv(uniform.uSnow, toVec3(options.snowflake));

  let preset = options.preset;
  const wind = createWind(preset.wind);
  const state = { time: 0, fall: 0, windOffset: 0, windSpeed: 0 };
  let stopLoop: (() => void) | null = null;

  const resize = () => {
    const width = Math.max(1, Math.round(canvas.clientWidth * preset.renderScale));
    const height = Math.max(1, Math.round(canvas.clientHeight * preset.renderScale));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const draw = () => {
    resize();
    gl.uniform2f(uniform.uResolution, canvas.width, canvas.height);
    gl.uniform1f(uniform.uTime, state.time);
    gl.uniform1f(uniform.uFall, state.fall);
    gl.uniform1f(uniform.uFallSpeed, preset.fallSpeed);
    gl.uniform1f(uniform.uWindOffset, state.windOffset);
    gl.uniform1f(uniform.uWindSpeed, state.windSpeed);
    gl.uniform1f(uniform.uLayers, preset.layers);
    gl.uniform1f(uniform.uDensity, preset.density);
    gl.uniform1f(uniform.uDriftAlpha, preset.driftAlpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const advance = (dt: number) => {
    state.time += dt;
    state.fall += dt * preset.fallSpeed;
    const windNow = wind.step(dt);
    state.windOffset = windNow.offset;
    state.windSpeed = windNow.speed;
  };

  const stop = () => {
    stopLoop?.();
    stopLoop = null;
  };

  // Пока анимация стоит (застывший кадр), перерисовываем при смене размера окна.
  const onWindowResize = () => {
    if (!stopLoop) draw();
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    stop();
    options.onContextLost();
  };

  window.addEventListener('resize', onWindowResize);
  canvas.addEventListener('webglcontextlost', onContextLost);

  return {
    setPreset(next) {
      preset = next;
      wind.setStrength(next.wind);
      if (!stopLoop) draw();
    },

    play(onSlow) {
      stop();
      stopLoop = startRenderLoop({
        maxFps: MAX_FPS,
        onFrame: (dt) => {
          advance(dt);
          draw();
        },
        onSlow,
      });
    },

    freeze() {
      stop();
      if (state.time < FROZEN_TIME) advance(FROZEN_TIME - state.time);
      draw();
    },

    dispose() {
      stop();
      window.removeEventListener('resize', onWindowResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      // Контекст не «убиваем»: React в режиме разработки создаёт сцену дважды
      // на том же canvas, и второй раз получил бы мёртвый контекст.
      gl.deleteProgram(program);
    },
  };
}
