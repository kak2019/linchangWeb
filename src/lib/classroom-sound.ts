export type SoundSettings = { threshold: number; holdSeconds: number };
export type SoundGate = { overSince: number | null; quietSince: number | null; alarming: boolean };
export const initialSoundGate = (): SoundGate => ({ overSince: null, quietSince: null, alarming: false });
export const SOUND_FLOOR = -90;

export function soundPower(samples: Float32Array<ArrayBuffer>) {
  let mean = 0, sum = 0;
  for (const value of samples) mean += value;
  mean /= samples.length || 1;
  for (const value of samples) sum += (value - mean) ** 2;
  return sum / (samples.length || 1);
}

/** Digital RMS level referenced to full scale, never a sound-pressure reading. */
export function powerToDbfs(power: number) {
  return Math.round(Math.max(SOUND_FLOOR, Math.min(0, 10 * Math.log10(Math.max(1e-9, power)))) * 10) / 10;
}

export function soundPosition(db: number) {
  return Math.max(0, Math.min(100, (db - SOUND_FLOOR) / -SOUND_FLOOR * 100));
}

export function advanceSoundGate(gate: SoundGate, db: number, now: number, settings: SoundSettings) {
  const next = { ...gate };
  if (next.alarming) {
    if (db < settings.threshold - 3) {
      next.quietSince ??= now;
      if (now - next.quietSince >= 2000) return initialSoundGate();
    } else next.quietSince = null;
    return next;
  }
  if (db >= settings.threshold) {
    next.overSince ??= now;
    if (now - next.overSince >= settings.holdSeconds * 1000) next.alarming = true;
  } else next.overSince = null;
  return next;
}

export function suggestedSoundThreshold(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const background = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .9))] ?? -55;
  return Math.max(-75, Math.min(-8, Math.round(background + 12)));
}

export function microphoneError(error: unknown) {
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "麦克风未获授权。请在浏览器地址栏或系统设置中允许麦克风；内置浏览器无法授权时，可用 Safari 或 Chrome 打开。";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "没有找到所选麦克风。请检查设备连接，或选择系统默认麦克风后重试。";
  if (name === "NotReadableError" || name === "AbortError") return "麦克风暂时无法使用。请检查系统权限、设备连接，以及是否被其他应用独占。";
  return "暂时无法开启麦克风，请检查浏览器权限和设备后重试。";
}
