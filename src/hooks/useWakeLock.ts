import { useEffect, useRef } from "react";

export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let released = false;

    navigator.wakeLock.request("screen").then((lock) => {
      if (released) {
        lock.release();
      } else {
        lockRef.current = lock;
      }
    }).catch(() => {});

    return () => {
      released = true;
      lockRef.current?.release();
      lockRef.current = null;
    };
  }, [enabled]);
}
