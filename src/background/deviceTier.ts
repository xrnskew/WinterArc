/**
 * Слабое ли устройство: решаем, рисовать шейдер или CSS-снежинки.
 * Логика (pickDeviceTier) отделена от чтения браузера (readDeviceSignals),
 * чтобы её можно было проверить тестом.
 */

export type DeviceTier = 'full' | 'lite';

export interface DeviceSignals {
  /** Есть ли WebGL. */
  webgl: boolean;
  /** Ядер процессора (null — браузер не сообщает). */
  cores: number | null;
  /** Память в ГБ (только Chrome; null — неизвестно). */
  memoryGb: number | null;
  /** Включена экономия трафика. */
  saveData: boolean;
}

export function pickDeviceTier(signals: DeviceSignals): DeviceTier {
  if (!signals.webgl) return 'lite';
  if (signals.saveData) return 'lite';
  if (signals.cores !== null && signals.cores <= 2) return 'lite';
  if (signals.memoryGb !== null && signals.memoryGb <= 2) return 'lite';
  return 'full';
}

/** Нестандартные поля navigator, которых нет в типах TypeScript. */
interface NavigatorExtras {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function hasWebGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as Navigator & NavigatorExtras;
  return {
    webgl: hasWebGl(),
    cores: nav.hardwareConcurrency || null,
    memoryGb: nav.deviceMemory ?? null,
    saveData: nav.connection?.saveData ?? false,
  };
}
