/**
 * Шейдеры метели. Вершинный рисует один треугольник на весь экран,
 * фрагментный для каждого пикселя решает, сколько в нём снега.
 *
 * Как устроен снег: экран делится на ячейки, в каждой ячейке — не больше
 * одной снежинки. Сетка «едет» вниз (падение) и вбок (ветер). Слоёв
 * несколько: у ближних ячейки крупные (большие редкие хлопья, падают
 * быстро, их сильнее сносит), у дальних — мелкие (крошечные, размытые,
 * медленные, тусклые).
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
uniform float uLayers;     // сколько слоёв рисовать (1…7)
uniform float uDensity;    // доля ячеек со снежинкой
uniform float uDriftAlpha; // яркость позёмки
uniform vec3 uBackground;
uniform vec3 uSnow;

const int MAX_LAYERS = 7;

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

// Один слой хлопьев. depth: 0 — ближний слой, 1 — самый дальний.
float snowLayer(vec2 uv, float depth, float seed) {
  float cells = mix(4.5, 30.0, depth);    // ячеек на высоту экрана
  float fall = mix(0.30, 0.07, depth);    // скорость падения, высот экрана в секунду
  float windShare = mix(1.0, 0.4, depth); // параллакс: дальние сносит меньше

  // Сдвигаем сетку: снег падает вниз и уходит по ветру.
  vec2 p = uv * cells;
  p.y += uFall * fall * cells;
  p.x -= uWindOffset * windShare * cells;

  vec2 cell = floor(p);
  vec2 local = fract(p) - 0.5;

  if (hash12(cell + seed) > uDensity) return 0.0; // пустая ячейка

  vec2 rnd = hash22(cell * 1.37 + seed * 3.1);
  float size = 0.5 + hash12(cell * 0.71 + seed * 5.3);

  // Положение в ячейке и лёгкое покачивание.
  vec2 center = (rnd - 0.5) * 0.4;
  center.x += 0.08 * sin(uTime * (0.4 + rnd.y) + rnd.x * 40.0);
  vec2 d = local - center;

  // В порыв ближние хлопья смазываются вдоль направления полёта.
  vec2 velocity = vec2(uWindSpeed * windShare, -fall * uFallSpeed);
  vec2 dir = normalize(velocity);
  float stretch = 1.0 + (1.0 - depth) * 1.8 * abs(uWindSpeed);
  float along = dot(d, dir) / stretch;
  float across = dot(d, vec2(-dir.y, dir.x));
  float dist = length(vec2(along, across));

  // Размер в долях ячейки; ближние чёткие, дальние размытые.
  // Смазанный хлопок мягче по краям и тусклее — свет «размазан» по следу.
  float pixel = cells / uResolution.y; // один пиксель в долях ячейки
  float radius = max(mix(0.032, 0.04, depth) * size, pixel * 0.7);
  float blur = mix(0.15, 1.0, depth) + (stretch - 1.0) * 0.8;
  float softness = max(blur * radius, pixel * 1.2);
  float flake = 1.0 - smoothstep(radius - softness * 0.5, radius + softness * 0.5, dist);

  float brightness = mix(0.95, 0.35, depth) * (0.7 + 0.3 * rnd.y) / sqrt(stretch);
  return flake * brightness;
}

// Позёмка: вытянутые по горизонтали струи у нижнего края.
float groundDrift(vec2 uv) {
  float mask = 1.0 - smoothstep(0.0, 0.15, uv.y);
  mask *= mask;
  vec2 q = vec2(uv.x * 1.6 - uWindOffset * 2.4 - uTime * 0.04, uv.y * 26.0);
  float n = valueNoise(q) * 0.6 + valueNoise(q * vec2(2.3, 1.9) + 7.0) * 0.4;
  float streaks = smoothstep(0.45, 0.95, n);
  float gust = clamp(uWindSpeed * 4.0, 0.0, 1.0);
  return mask * streaks * uDriftAlpha * (0.6 + 0.4 * gust);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.y;

  float alpha = 0.0;
  for (int i = 0; i < MAX_LAYERS; i++) {
    if (float(i) >= uLayers) break;
    float depth = uLayers > 1.0 ? float(i) / (uLayers - 1.0) : 0.0;
    float flake = snowLayer(uv, depth, float(i) * 17.31 + 3.0);
    alpha += flake * (1.0 - alpha);
  }
  alpha += groundDrift(uv) * (1.0 - alpha);

  gl_FragColor = vec4(mix(uBackground, uSnow, alpha), 1.0);
}
`;
