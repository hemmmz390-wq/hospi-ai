/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import { Toaster } from "./components/common/Toaster";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { GuestEntry } from "./features/entry/GuestEntry";
import { DemoAccess } from "./features/entry/DemoAccess";
import { NotFound } from "./features/entry/NotFound";
import { EnterAs } from "./features/entry/EnterAs";

// Tiga bagian besar dimuat terpisah: tamu yang memindai QR tidak perlu
// mengunduh dashboard staf, dan sebaliknya.
const Landing = lazy(() => import("./features/landing/Landing"));
const GuestApp = lazy(() => import("./features/guest/GuestApp"));
const StaffApp = lazy(() => import("./features/staff/StaffApp"));
const PresentMode = lazy(() => import("./features/present/PresentMode"));

/** QR lama menunjuk ke "/?room=812". Arahkan ke halaman masuk tamu. */
function Home() {
  const { search } = useLocation();
  const room = new URLSearchParams(search).get("room");
  if (room) return <Navigate to={`/stay?room=${encodeURIComponent(room)}`} replace />;
  return <Landing />;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { hasCheckedIn, sessionKind } = useApp();
  if (!hasCheckedIn) return <Navigate to="/stay" replace />;
  if (sessionKind !== "guest") return <Navigate to="/staff" replace />;
  return <>{children}</>;
}

function RequireStaff({ children }: { children: React.ReactNode }) {
  const { hasCheckedIn, sessionKind } = useApp();
  if (!hasCheckedIn || sessionKind !== "staff") return <Navigate to="/demo" replace />;
  return <>{children}</>;
}

function PageFallback() {
  return <div className="min-h-dvh bg-canvas" aria-busy="true" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AppProvider>
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/stay" element={<GuestEntry />} />
                  <Route path="/demo" element={<DemoAccess />} />
                  <Route path="/enter" element={<EnterAs />} />
                  <Route path="/present" element={<PresentMode />} />
                  <Route
                    path="/guest/*"
                    element={
                      <RequireGuest>
                        <GuestApp />
                      </RequireGuest>
                    }
                  />
                  <Route
                    path="/staff/*"
                    element={
                      <RequireStaff>
                        <StaffApp />
                      </RequireStaff>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
            </BrowserRouter>
          </AppProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
