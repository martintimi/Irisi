// Soft, zero-asset Web Audio API luxury chime for live in-app notifications.
// Unlocks AudioContext on the user's first tap/click so background Realtime alerts can chime cleanly.

let sharedAudioCtx: AudioContext | null = null;
let lastChimeAt = 0;
let unlockBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

function bindGestureUnlock(): void {
  if (typeof window === 'undefined' || unlockBound) return;
  unlockBound = true;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

if (typeof window !== 'undefined') {
  bindGestureUnlock();
}

function scheduleChimeNotes(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  const now = Date.now();
  if (now - lastChimeAt < 2500) return;

  lastChimeAt = now;
  const t0 = ctx.currentTime;

  const notes = [
    { freq: 1318.51, start: 0, dur: 0.24, peak: 0.055 },    // E6
    { freq: 1975.53, start: 0.095, dur: 0.34, peak: 0.045 }, // B6
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.freq, t0 + n.start);

    gain.gain.setValueAtTime(0.0001, t0 + n.start);
    gain.gain.exponentialRampToValueAtTime(n.peak, t0 + n.start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.start + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0 + n.start);
    osc.stop(t0 + n.start + n.dur + 0.02);
  }
}

/**
 * Plays a gentle, refined two-note crystal chime (E6 -> B6) — subtle & never jarring.
 * Debounced to max once per 2.5 seconds so burst updates never overlap noisily.
 */
export function playLuxuryNotificationChime(): void {
  if (typeof window === 'undefined') return;
  bindGestureUnlock();

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'running') {
      scheduleChimeNotes(ctx);
    } else if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => scheduleChimeNotes(ctx))
        .catch(() => {});
    }
  } catch {
    // Browser autoplay policies may block sound before interaction — fail silently
  }
}
