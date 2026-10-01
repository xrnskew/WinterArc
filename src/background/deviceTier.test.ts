import { describe, expect, it } from 'vitest';
import { pickDeviceTier, type DeviceSignals } from './deviceTier';

const strongPhone: DeviceSignals = { webgl: true, cores: 8, memoryGb: 6, saveData: false };

describe('pickDeviceTier', () => {
  it('нормальное устройство рисует шейдер', () => {
    expect(pickDeviceTier(strongPhone)).toBe('full');
  });

  it('без WebGL — CSS-снег', () => {
    expect(pickDeviceTier({ ...strongPhone, webgl: false })).toBe('lite');
  });

  it('мало ядер или памяти — CSS-снег', () => {
    expect(pickDeviceTier({ ...strongPhone, cores: 2 })).toBe('lite');
    expect(pickDeviceTier({ ...strongPhone, memoryGb: 2 })).toBe('lite');
  });

  it('экономия трафика — CSS-снег', () => {
    expect(pickDeviceTier({ ...strongPhone, saveData: true })).toBe('lite');
  });

  it('если браузер молчит про память и ядра — не наказываем', () => {
    expect(pickDeviceTier({ ...strongPhone, cores: null, memoryGb: null })).toBe('full');
  });
});
