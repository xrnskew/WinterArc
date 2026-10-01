import { useEffect, useMemo, useState } from 'react';
import type { PerformanceMode, SnowIntensity } from '../domain/types';
import type { ThemeTokens } from '../design/tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CssSnow } from './CssSnow';
import { pickDeviceTier, readDeviceSignals, type DeviceTier } from './deviceTier';
import { ShaderSnow } from './ShaderSnow';
import { SNOW_PRESETS } from './snowPresets';

interface SnowBackgroundProps {
  intensity: SnowIntensity;
  performance: PerformanceMode;
  theme: ThemeTokens;
}

/**
 * Фон-метель. Выбирает, чем рисовать:
 * - выкл → только тёмный фон страницы;
 * - слабое устройство или шейдер сломался/тормозит → CSS-снежинки;
 * - иначе → WebGL-шейдер.
 * При «Уменьшить движение» снег застывает в любом варианте.
 */
export function SnowBackground({ intensity, performance, theme }: SnowBackgroundProps) {
  const still = useReducedMotion();
  const detectedTier = useMemo<DeviceTier>(() => pickDeviceTier(readDeviceSignals()), []);
  const [shaderBroken, setShaderBroken] = useState(false);
  const [shaderSlow, setShaderSlow] = useState(false);

  // Если шейдер сломался — только CSS. Иначе явный выбор в настройках
  // важнее автоопределения и замера FPS.
  let tier: DeviceTier = performance === 'auto' ? detectedTier : performance;
  if (performance === 'auto' && shaderSlow) tier = 'lite';
  if (shaderBroken) tier = 'lite';

  // Стеклу нужно знать режим: на слабых устройствах оно без размытия (global.css).
  useEffect(() => {
    document.documentElement.dataset.perf = tier;
  }, [tier]);

  if (intensity === 'off') return null;
  const preset = SNOW_PRESETS[intensity];

  if (tier === 'lite') {
    return <CssSnow count={preset.cssFlakes} still={still} snowflake={theme.color.snowflake} />;
  }

  return (
    <ShaderSnow
      preset={preset}
      still={still}
      background={theme.color.night}
      snowflake={theme.color.snowflake}
      onFail={(reason) => (reason === 'error' ? setShaderBroken(true) : setShaderSlow(true))}
    />
  );
}
