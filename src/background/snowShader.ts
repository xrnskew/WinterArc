/**
 * Шейдеры метели. Вершинный рисует один треугольник на весь экран,
 * фрагментный для каждого пикселя решает, сколько в нём снега.
 *
 * Как устроен снег. Три слоя глубины: дальний (мелкие, тусклые, размытые,
 * медленные хлопья), средний и ближний (крупнее, чётче, чуть быстрее).
 * Каждый слой — сетка ячеек, в ячейке не больше одной снежинки.
 * Чтобы сетки не было видно:
 * — каждый столбец ячеек — отдельная «струя» со своей скоростью и сдвигом;
 * — снежинка стоит в любом месте ячейки и покачивается по своей синусоиде;
 * — размер и яркость у каждой свои;
 * — при большей интенсивности в слое несколько прослоек с разным размером ячеек.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;  // размер холста в пикселях
uniform float uTime;       // секунды — для покачивания хлопьев
uniform float uFall;       // накопленное падение (секунды × множитель скорости)
uniform float uFallSpeed;  // текущий множитель скорости падения
uniform float uWindOffset; // накопленный снос ветром, в высотах экрана
uniform float uWindSpeed;  // текущая скорость ветра, высот экрана в секунду
uniform float uCopies;     // прослоек в каждом слое глубины (1…3)
uniform float uDensity;    // доля ячеек со снежинкой
uniform float uDriftAlpha; // яркость позёмки
uniform vec3 uBackground;
uniform vec3 uSnow;

const int DEPTHS = 3;     // дальний, средний, ближний
const int MAX_COPIES = 3;
const float TAU = 6.2831853;

// Псевдослучайные числа без синуса (Dave Hoskins, «Hash without Sine»).
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Плавный шум для позёмки.
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Одна прослойка хлопьев.
// depth: 0 — дальний слой, 1 — ближний. scale — множитель размера ячеек прослойки.
float snowLayer(vec2 uv, float depth, float seed, float scale) {
  float cells = mix(22.0, 5.5, depth) * scale; // ячеек на высоту экрана: дальние мельче
  float fall = mix(0.035, 0.10, depth);        // высот экрана в секунду: плывут, а не летят
  float windShare = mix(0.45, 1.0, depth);     // параллакс: дальние сносит меньше

  vec2 p = uv * cells;
  p.x -= uWindOffset * windShare * cells;      // ветер сносит весь слой
  p.x += seed * 0.37;                          // сетки прослоек не совпадают

  // Столбец — отдельная струя: своя скорость падения и свой сдвиг по высоте,
  // поэтому снежинки соседних столбцов не выстраиваются в ряды.
  float column = floor(p.x);
  float columnSpeed = 0.8 + 0.4 * hash12(vec2(column, seed));
  p.y += uFall * fall * columnSpeed * cells + hash12(vec2(seed, column)) * 13.0;

  vec2 cell = floor(p);
  vec2 local = fract(p) - 0.5;

  // Пустая ячейка. Ближних хлопьев реже: крупные не должны загораживать экран.
  if (hash12(cell + seed * 13.1) > uDensity * mix(1.0, 0.55, depth)) return 0.0;

  vec2 r1 = hash22(cell * 1.37 + seed * 3.1);
  vec2 r2 = hash22(cell * 2.11 + seed * 7.7);

  // Своё у каждой снежинки: размер (мелких больше, чем крупных) и яркость.
  float size = 0.55 + 0.9 * r2.x * r2.x;       // 0,55…1,45
  float shade = 0.55 + 0.45 * r2.y;            // 0,55…1

  // Своё покачивание: синусоида с собственными амплитудой, частотой и фазой
  // плюс слабая вторая гармоника — движение не выглядит механическим.
  float swayAmp = mix(0.04, 0.13, r1.y);       // в долях ячейки
  float swayFreq = mix(0.9, 2.2, r1.x);        // рад/с: период 3–7 с
  float phase = (r1.x + r2.y) * TAU;
  vec2 center = (r1 - 0.5) * 0.5;              // место в ячейке: ±0,25
  center.x += swayAmp * (sin(uTime * swayFreq + phase)
                       + 0.35 * sin(uTime * swayFreq * 2.3 + phase * 1.7));
  center.y += swayAmp * 0.35 * sin(uTime * swayFreq * 0.7 + phase * 0.5);
  // Запас: 0,25 + 0,175 (покачивание) + 0,065 (радиус) < 0,5 — снежинка не выходит из ячейки.
  vec2 d = local - center;

  // В сильный ветер ближние хлопья чуть смазываются вдоль полёта; в штиль — нет.
  vec2 velocity = vec2(uWindSpeed * windShare, -fall * columnSpeed * uFallSpeed);
  vec2 dir = normalize(velocity);
  float stretch = 1.0 + depth * clamp(abs(uWindSpeed) * 4.0, 0.0, 0.8);
  float along = dot(d, dir) / stretch;
  float across = dot(d, vec2(-dir.y, dir.x));
  float dist = length(vec2(along, across));

  // Размер в долях ячейки; ближние чёткие, дальние размытые.
  float pixel = cells / uResolution.y;         // один пиксель в долях ячейки
  float radius = max(mix(0.05, 0.045, depth) * size, pixel * 0.6);
  float blur = mix(1.1, 0.25, depth) + (stretch - 1.0) * 0.6;
  float softness = max(blur * radius, pixel * 1.2);
  float flake = 1.0 - smoothstep(radius - softness * 0.5, radius + softness * 0.5, dist);

  // Дальние тусклые, ближние яркие; смазанный хлопок тусклее — свет «размазан» по следу.
  float brightness = mix(0.32, 0.95, depth) * shade / sqrt(stretch);
  return flake * brightness;
}

// Позёмка: вытянутые по горизонтали струи у нижнего края.
float groundDrift(vec2 uv) {
  float mask = 1.0 - smoothstep(0.0, 0.15, uv.y);
  mask *= mask;
  vec2 q = vec2(uv.x * 1.6 - uWindOffset * 2.4 - uTime * 0.03, uv.y * 26.0);
  float n = valueNoise(q) * 0.6 + valueNoise(q * vec2(2.3, 1.9) + 7.0) * 0.4;
  float streaks = smoothstep(0.45, 0.95, n);
  float gust = clamp(uWindSpeed * 8.0, 0.0, 1.0);
  return mask * streaks * uDriftAlpha * (0.6 + 0.4 * gust);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.y;

  float alpha = 0.0;
  for (int i = 0; i < DEPTHS; i++) {
    float depth = float(i) / float(DEPTHS - 1);
    for (int j = 0; j < MAX_COPIES; j++) {
      if (float(j) >= uCopies) break;
      float seed = float(i) * 17.31 + float(j) * 5.17 + 3.0;
      // Прослойки одного слоя чуть различаются размером ячеек.
      float flake = snowLayer(uv, depth, seed, 1.0 + float(j) * 0.17);
      alpha += flake * (1.0 - alpha);
    }
  }
  alpha += groundDrift(uv) * (1.0 - alpha);

  gl_FragColor = vec4(mix(uBackground, uSnow, alpha), 1.0);
}
`;
