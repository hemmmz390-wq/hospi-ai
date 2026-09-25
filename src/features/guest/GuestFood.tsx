import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, UtensilsCrossed, CheckCircle2, ImageOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { MENU_CATEGORIES, MenuCategory } from "../../data/menu";
import { FoodMenuItem, isTicketClosed, ServiceTicket } from "../../types";
import { Button, Card, Field, Overlay, Segmented, Textarea } from "../../components/ui";
import { cn } from "../../lib/cn";
import { useCart } from "./cart";
import { RequestCard, RequestDetailSheet, RequestProgress } from "./components";
import { useGuestTickets } from "./guestUtils";

function FoodImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-sunken text-subtle" role="img" aria-label={alt}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

export function QtyControl({ item }: { item: FoodMenuItem }) {
  const { t } = useI18n();
  const cart = useCart();
  const q = cart.qtyOf(item.id);
  if (q === 0) {
    return (
      <Button size="sm" variant="secondary" onClick={() => cart.add(item.id)} icon={<Plus className="h-3.5 w-3.5" />} aria-label={t("g.food.addItem", { name: item.name })}>
        {t("g.food.add")}
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line">
      <button type="button" onClick={() => cart.remove(item.id)} aria-label={t("a.decrease")} className="flex h-8 w-8 items-center justify-center rounded-l-lg hover:bg-sunken">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {q}
      </span>
      <button type="button" onClick={() => cart.add(item.id)} aria-label={t("a.increase")} className="flex h-8 w-8 items-center justify-center rounded-r-lg hover:bg-sunken">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const DIET_KEY: Record<string, TranslationKey> = {
  Vegetarian: "diet.vegetarian",
  Vegan: "diet.vegan",
  "Gluten-Free": "diet.glutenFree",
  Halal: "diet.halal",
  Pescatarian: "diet.pescatarian",
};

function MenuItemCard({ item }: { item: FoodMenuItem }) {
  const { t, formatCurrency } = useI18n();
  return (
    <Card as="li" className="flex gap-3 overflow-hidden p-3">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-sunken">
        <FoodImage src={item.image} alt={item.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm font-semibold leading-snug">{item.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-snug text-muted">{item.description}</p>
        {item.dietary && item.dietary.length > 0 && (
          <p className="mt-1 text-[0.6875rem] text-subtle">{item.dietary.map((d) => (DIET_KEY[d] ? t(DIET_KEY[d]) : d)).join(" · ")}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.price)}</span>
          <QtyControl item={item} />
        </div>
      </div>
    </Card>
  );
}

function CartSheet({ open, onClose, onPlaced }: { open: boolean; onClose: () => void; onPlaced: (t: ServiceTicket) => void }) {
  const { quickOrderFood, foodMenu, guest, assignTableNumber } = useApp();
  const { t, formatCurrency } = useI18n();
  const cart = useCart();
  const [notes, setNotes] = useState("");
  const [destination, setDestination] = useState<"room" | "table">("room");
  const [placing, setPlacing] = useState(false);

  if (!open) return null;

  // Tawaran yang wajar: pencuci mulut, hanya bila belum ada di keranjang.
  const hasDessert = cart.lines.some((l) => (l.item.category as MenuCategory) === "dessert");
  const hasMain = cart.lines.some((l) => ["main", "breakfast", "snacks"].includes(l.item.category));
  const dessertIdeas = !hasDessert && hasMain ? foodMenu.filter((m) => m.category === "dessert").slice(0, 2) : [];

  const place = async () => {
    setPlacing(true);
    const table = destination === "table" ? assignTableNumber() : undefined;
    const ticket = await quickOrderFood(cart.lines, notes.trim() || undefined, destination, table);
    setPlacing(false);
    if (ticket) {
      cart.clear();
      setNotes("");
      onPlaced(ticket);
    }
  };

  return (
    <Overlay
      open
      onClose={onClose}
      title={t("g.food.cart")}
      description={t("g.food.itemsCount", { n: cart.count })}
      footer={
        <div className="w-full space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">{t("g.food.total")}</span>
            <span className="text-lg font-semibold tabular-nums">{formatCurrency(cart.total)}</span>
          </div>
          <Button variant="primary" size="lg" block disabled={cart.count === 0 || placing} onClick={place}>
            {placing ? t("a.sending") : t("g.food.placeOrder")}
          </Button>
        </div>
      }
    >
      {cart.count === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("g.food.cartEmpty")}</p>
      ) : (
        <div className="space-y-5">
          <ul className="divide-y divide-line">
            {cart.lines.map(({ item, quantity }) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-[0.8125rem] tabular-nums text-muted">{formatCurrency(item.price * quantity)}</p>
                </div>
                <QtyControl item={item} />
              </li>
            ))}
          </ul>

          {dessertIdeas.length > 0 && (
            <div className="rounded-lg bg-sunken p-3">
              <p className="text-[0.8125rem] font-medium">{t("g.food.dessertPrompt")}</p>
              <ul className="mt-2 space-y-2">
                {dessertIdeas.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[0.8125rem]">
                      {d.name} · <span className="tabular-nums text-muted">{formatCurrency(d.price)}</span>
                    </span>
                    <QtyControl item={d} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Field label={t("g.food.notes")} htmlFor="order-notes">
            <Textarea id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("g.food.notesPlaceholder")} className="min-h-[64px]" />
          </Field>

          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-medium">{t("g.food.deliverTo")}</legend>
            <Segmented
              label={t("g.food.deliverTo")}
              value={destination}
              onChange={setDestination}
              options={[
                { value: "room", label: t("g.food.toRoom", { room: guest.roomNumber }) },
                { value: "table", label: t("g.food.dineIn") },
              ]}
            />
          </fieldset>

          <div className="rounded-lg border border-line p-3 text-[0.8125rem]">
            <p className="font-medium">{t("g.food.payment")}</p>
            <p className="mt-0.5 text-muted">{t("g.food.chargeToRoom", { room: guest.roomNumber })}</p>
            <p className="mt-1.5 text-xs text-subtle">{t("g.food.billingSimulated")}</p>
          </div>
        </div>
      )}
    </Overlay>
  );
}

export function GuestFood() {
  const { foodMenu } = useApp();
  const { t, formatCurrency } = useI18n();
  const navigate = useNavigate();
  const cart = useCart();
  const { mine } = useGuestTickets();
  const [category, setCategory] = useState<MenuCategory>(() => (new Date().getHours() < 11 ? "breakfast" : "main"));
  const [cartOpen, setCartOpen] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const orders = useMemo(() => mine.filter((x) => x.order && !isTicketClosed(x.status)), [mine]);
  const items = foodMenu.filter((m) => m.category === category);
  const placedTicket = placed ? mine.find((x) => x.id === placed) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t("g.food.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("g.food.subtitle")}</p>
      </div>

      {orders.length > 0 && (
        <section aria-labelledby="orders-title">
          <h2 id="orders-title" className="mb-2 text-[0.9375rem] font-semibold">
            {t("g.food.yourOrders")}
          </h2>
          <div className="space-y-2">
            {orders.map((o) => (
              <RequestCard key={o.id} ticket={o} onOpen={() => setDetail(o.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-14 z-20 -mx-4 bg-canvas/95 px-4 py-2 backdrop-blur">
        <Segmented
          label={t("g.food.categories")}
          value={category}
          onChange={setCategory}
          className="w-full"
          options={MENU_CATEGORIES.map((c) => ({ value: c, label: t(`menu.cat.${c}` as TranslationKey) }))}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </ul>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4 pb-3">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex h-12 w-full max-w-2xl items-center justify-between rounded-xl bg-fg px-4 text-inverse shadow-pop animate-enter"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag className="h-4 w-4" />
              {t("g.food.viewCart")} · {t("g.food.itemsCount", { n: cart.count })}
            </span>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(cart.total)}</span>
          </button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onPlaced={(ticket) => {
          setCartOpen(false);
          setPlaced(ticket.id);
        }}
      />

      {placedTicket && (
        <Overlay
          open
          onClose={() => setPlaced(null)}
          title={t("g.food.orderPlaced")}
          description={placedTicket.order?.id}
          footer={
            <>
              <Button variant="ghost" onClick={() => setPlaced(null)}>
                {t("a.done")}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setPlaced(null);
                  navigate("/guest/requests");
                }}
              >
                {t("g.trackRequest")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
              <p className="text-sm">{t("g.food.placedBody", { room: placedTicket.room })}</p>
            </div>
            <RequestProgress ticket={placedTicket} />
          </div>
        </Overlay>
      )}

      <RequestDetailSheet ticketId={detail} onClose={() => setDetail(null)} />

      {items.length === 0 && (
        <Card>
          <div className="flex flex-col items-center py-10 text-center text-sm text-muted">
            <UtensilsCrossed className="mb-2 h-5 w-5" />
            {t("g.food.emptyCategory")}
          </div>
        </Card>
      )}

      <div className={cn(cart.count > 0 ? "h-14" : "h-0")} aria-hidden />
    </div>
  );
}
