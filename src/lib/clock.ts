import { useSyncExternalStore } from "react";

/**
 * Satu jam bersama untuk seluruh aplikasi. Semua timer SLA membaca jam ini,
 * jadi hanya ada satu interval — bukan satu per kartu tiket — dan hanya
 * komponen yang memakai `useNow` yang dirender ulang tiap detik.
 */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
