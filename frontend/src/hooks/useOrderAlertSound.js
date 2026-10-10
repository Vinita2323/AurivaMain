import { useCallback, useEffect, useRef, useState } from 'react';

const MUTE_KEY = 'auriva_order_alert_muted';
const UNLOCK_KEY = 'auriva_order_alert_audio_unlocked';

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Looping dual-tone alert using Web Audio API (no external asset required).
 * Respects browser autoplay: unlocks after first user gesture.
 */
export default function useOrderAlertSound() {
  const [muted, setMutedState] = useState(readMuted);
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
      return false;
    }
  });

  const ctxRef = useRef(null);
  const nodesRef = useRef([]);
  const playingOrderIdRef = useRef(null);
  const intervalRef = useRef(null);

  const ensureContext = useCallback(async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') {
      try {
        await ctxRef.current.resume();
      } catch {
        return null;
      }
    }
    return ctxRef.current;
  }, []);

  const stopToneBurst = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {
        /* ignore */
      }
    });
    nodesRef.current = [];
  }, []);

  const playToneBurst = useCallback(async () => {
    if (muted) return;
    const ctx = await ensureContext();
    if (!ctx) return;

    stopToneBurst();
    const now = ctx.currentTime;
    const freqs = [880, 1174.7]; // A5 + D6 — short alert chirp

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
      nodesRef.current.push(osc, gain);
    });
  }, [ensureContext, muted, stopToneBurst]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopToneBurst();
    playingOrderIdRef.current = null;
  }, [stopToneBurst]);

  const start = useCallback(
    (orderId) => {
      if (!orderId || muted) {
        stop();
        return;
      }
      // Avoid restarting ringtone for the same order
      if (playingOrderIdRef.current === String(orderId) && intervalRef.current) {
        return;
      }
      stop();
      playingOrderIdRef.current = String(orderId);
      playToneBurst().catch(() => {});
      intervalRef.current = setInterval(() => {
        playToneBurst().catch(() => {});
      }, 2200);
    },
    [muted, playToneBurst, stop]
  );

  const setMuted = useCallback(
    (next) => {
      const value = Boolean(next);
      setMutedState(value);
      try {
        localStorage.setItem(MUTE_KEY, value ? '1' : '0');
      } catch {
        /* ignore */
      }
      if (value) stop();
    },
    [stop]
  );

  const toggleMute = useCallback(() => {
    setMuted(!muted);
  }, [muted, setMuted]);

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    if (unlocked) return undefined;

    const unlock = async () => {
      const ctx = await ensureContext();
      if (!ctx) return;
      try {
        sessionStorage.setItem(UNLOCK_KEY, '1');
      } catch {
        /* ignore */
      }
      setUnlocked(true);
    };

    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, unlock, { once: true, passive: true }));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, unlock));
    };
  }, [ensureContext, unlocked]);

  useEffect(() => () => stop(), [stop]);

  // If muted while playing, stop immediately
  useEffect(() => {
    if (muted) stop();
  }, [muted, stop]);

  return {
    muted,
    setMuted,
    toggleMute,
    unlocked,
    start,
    stop
  };
}
