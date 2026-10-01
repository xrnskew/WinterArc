import { useEffect, useRef } from 'react';
import { createSnowScene, type SnowScene } from './snowScene';
import type { SnowPreset } from './snowPresets';

interface ShaderSnowProps {
  preset: SnowPreset;
  /** Не анимировать: один застывший кадр. */
  still: boolean;
  background: string;
  snowflake: string;
  /**
   * Нужен запасной вариант: error — шейдер не запустился или потерял контекст,
   * slow — устройство не держит 20 FPS.
   */
  onFail: (reason: 'error' | 'slow') => void;
}

/** Холст с WebGL-метелью на весь экран. Вся логика — в snowScene.ts. */
export function ShaderSnow({ preset, still, background, snowflake, onFail }: ShaderSnowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SnowScene | null>(null);
  // Последние значения пропсов — чтобы колбэки сцены видели их без пересоздания сцены.
  const latest = useRef({ preset, onFail });

  useEffect(() => {
    latest.current = { preset, onFail };
  });

  // Создаём сцену. Пересоздаём, только если сменились цвета темы или режим движения.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: SnowScene;
    try {
      scene = createSnowScene({
        canvas,
        preset: latest.current.preset,
        background,
        snowflake,
        onContextLost: () => latest.current.onFail('error'),
      });
    } catch {
      latest.current.onFail('error');
      return;
    }

    if (still) scene.freeze();
    else scene.play(() => latest.current.onFail('slow'));

    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [background, snowflake, still]);

  // Ползунок интенсивности: меняем параметры на лету, снег не прыгает.
  useEffect(() => {
    sceneRef.current?.setPreset(preset);
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
    />
  );
}
