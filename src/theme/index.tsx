import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type TextSize = "normal" | "large" | "xlarge";

/**
 * Kunci v2: pilihan tema yang tersimpan sebelum mode terang dijadikan
 * bawaan (v1) sengaja diabaikan, supaya semua pengunjung mulai terang.
 */
const STORAGE_KEY = "hospi_theme_v2";
const LEGACY_KEYS = ["hospi_theme_v1"];
const TEXT_KEY = "hospi_textsize_v1";

/** Ukuran huruf dasar. Semua teks & jarak di aplikasi memakai rem, jadi ikut membesar. */
export const TEXT_SCALE: Record<TextSize, string> = { normal: "100%", large: "112.5%", xlarge: "125%" };

function readTextSize(): TextSize {
  try {
    const v = localStorage.getItem(TEXT_KEY);
    return v === "large" || v === "xlarge" ? v : "normal";
  } catch {
    return "normal";
  }
}

function readStoredMode(): ThemeMode | null {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : null;
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeContextValue {
  /** Pilihan tamu: terang, gelap, atau ikut sistem. */
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** Tema yang benar-benar tampil sekarang, setelah "system" diterjemahkan. */
  resolved: "light" | "dark";
  /** Ukuran teks untuk pengguna yang butuh huruf lebih besar. */
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode() || "light"); // Pengunjung baru selalu mulai di mode terang.
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);
  const [textSize, setTextSizeState] = useState<TextSize>(readTextSize);

  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SCALE[textSize];
  }, [textSize]);

  const setTextSize = useCallback((s: TextSize) => {
    setTextSizeState(s);
    try {
      localStorage.setItem(TEXT_KEY, s);
    } catch {
      /* abaikan */
    }
  }, []);

  // Ikuti perubahan setelan sistem selama mode masih "system".
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Satu-satunya tempat kelas `.dark` dipasang/dilepas.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0e0e0d" : "#f7f7f5");
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* mode privat: cukup simpan di memori */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved, textSize, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
}
