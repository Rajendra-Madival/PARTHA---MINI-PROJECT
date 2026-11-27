export function isLowPowerMode(): boolean {
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };

  if (nav.connection?.saveData === true) {
    return true;
  }

  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) {
    return true;
  }

  if (
    typeof nav.hardwareConcurrency === 'number' &&
    nav.hardwareConcurrency > 0 &&
    nav.hardwareConcurrency <= 2
  ) {
    return true;
  }

  return false;
}

let cachedWebGLSupport: boolean | null = null;

export function canUseWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!('WebGLRenderingContext' in window)) {
    return false;
  }

  if (cachedWebGLSupport !== null) {
    return cachedWebGLSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'default' }) ??
      canvas.getContext('webgl', { powerPreference: 'default' }) ??
      canvas.getContext('experimental-webgl');

    cachedWebGLSupport = gl !== null;
    return cachedWebGLSupport;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}

export function shouldEnableHero3D(): boolean {
  return canUseWebGL() && !isLowPowerMode();
}

export function resetWebGLSupportCacheForTest(): void {
  cachedWebGLSupport = null;
}
