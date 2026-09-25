import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { FoodMenuItem } from "../../types";

/** Keranjang makanan tamu. Disimpan per kamar agar tidak hilang saat pindah tab. */
interface CartValue {
  lines: { item: FoodMenuItem; quantity: number }[];
  count: number;
  total: number;
  qtyOf: (id: string) => number;
  add: (id: string, n?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { guest, foodMenu } = useApp();
  const key = `hospi_cart_v1_${guest.roomNumber}`;
  const [qty, setQty] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(qty));
    } catch {
      /* abaikan */
    }
  }, [key, qty]);

  const add = useCallback((id: string, n = 1) => setQty((p) => ({ ...p, [id]: Math.min(20, (p[id] || 0) + n) })), []);
  const remove = useCallback(
    (id: string) =>
      setQty((p) => {
        const next = { ...p, [id]: (p[id] || 0) - 1 };
        if (next[id] <= 0) delete next[id];
        return next;
      }),
    []
  );
  const clear = useCallback(() => setQty({}), []);

  const value = useMemo<CartValue>(() => {
    const lines = Object.entries(qty)
      .map(([id, quantity]) => ({ item: foodMenu.find((m) => m.id === id)!, quantity }))
      .filter((l) => l.item && l.quantity > 0);
    return {
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      total: lines.reduce((n, l) => n + l.quantity * l.item.price, 0),
      qtyOf: (id) => qty[id] || 0,
      add,
      remove,
      clear,
    };
  }, [qty, foodMenu, add, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
