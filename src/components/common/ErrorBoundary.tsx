import React from "react";
import { dictionary } from "../../i18n/dictionary";
import { LOCALES, Locale } from "../../i18n/types";

/**
 * Jaring pengaman terakhir. Tanpa ini, satu galat render membuat seluruh layar
 * putih kosong — tamu tidak tahu harus apa, staf kehilangan antreannya.
 * Data tetap aman di penyimpanan lokal, jadi memuat ulang biasanya cukup.
 */
function currentLocale(): Locale {
  try {
    const saved = localStorage.getItem("hospi_locale_v1");
    if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale;
  } catch {
    /* abaikan */
  }
  const nav = (typeof navigator !== "undefined" ? navigator.language : "en").split("-")[0];
  return ((LOCALES as readonly string[]).includes(nav) ? nav : "en") as Locale;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[HOSPI AI] render error:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const l = currentLocale();
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
        <p className="text-lg font-semibold">{dictionary["err.title"][l]}</p>
        <p className="mt-2 max-w-sm text-sm text-muted">{dictionary["err.body"][l]}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-6 h-10 rounded-lg bg-fg px-4 text-sm font-medium text-inverse">
          {dictionary["err.reload"][l]}
        </button>
      </div>
    );
  }
}
