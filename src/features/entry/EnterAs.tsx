import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Role } from "../../types";

const STAFF_ROLES: Exclude<Role, "tourist">[] = ["front_office", "housekeeping", "maintenance", "duty_manager", "food_beverage"];

/**
 * Masuk langsung lewat tautan: /enter?as=guest&room=508 atau
 * /enter?as=maintenance. Dipakai tombol "Ganti tampilan" dan mode presentasi,
 * supaya berpindah peran tidak perlu keluar lalu memilih ulang.
 */
export function EnterAs() {
  const { checkInToRoom, signInAsStaff } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const done = useRef(false);
  const as = params.get("as") || "";
  const room = params.get("room") || "508";

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (as === "guest") {
      if (checkInToRoom(room)) navigate("/guest", { replace: true });
      else navigate(`/stay?room=${encodeURIComponent(room)}`, { replace: true });
      return;
    }
    if ((STAFF_ROLES as string[]).includes(as)) {
      signInAsStaff(as as Exclude<Role, "tourist">);
      navigate("/staff", { replace: true });
    }
  }, [as, room, checkInToRoom, signInAsStaff, navigate]);

  if (as !== "guest" && !(STAFF_ROLES as string[]).includes(as)) return <Navigate to="/demo" replace />;
  return <div className="min-h-dvh bg-canvas" aria-busy="true" />;
}

/** true bila aplikasi berjalan di dalam mode presentasi (iframe). */
export const isEmbedded = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};
