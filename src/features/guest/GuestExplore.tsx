import React, { useMemo, useState } from "react";
import { Car, Clock, Footprints, Landmark, MapPin, ShoppingBag, Ticket, Trees, Users, Utensils, Waves, ConciergeBell, CheckCircle2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Attraction, AttractionCategory, UpsellOffer } from "../../types";
import { ATTRACTIONS, dayPartOf, fitsNow, mapsUrl, rankAttractions } from "../../data/attractions";
import { UPSELL_OFFERS } from "../../data/upsellOffers";
import { Badge, Button, Card, EmptyState, Overlay, buttonClasses } from "../../components/ui";
import { cn } from "../../lib/cn";
import { ExcursionSheet } from "./sheets/ExcursionSheet";

type Filter = "all" | AttractionCategory;

export const CATEGORY_META: Record<AttractionCategory, { icon: React.ComponentType<{ className?: string }>; label: TranslationKey }> = {
  culture: { icon: Landmark, label: "ex.cat.culture" },
  nature: { icon: Trees, label: "ex.cat.nature" },
  beach: { icon: Waves, label: "ex.cat.beach" },
  food: { icon: Utensils, label: "ex.cat.food" },
  shopping: { icon: ShoppingBag, label: "ex.cat.shopping" },
};

const FILTERS: Filter[] = ["all", "culture", "nature", "beach", "food", "shopping"];

function PlaceCard({ place, now, onBook, onTour }: { place: Attraction; now: boolean; onBook: () => void; onTour: (o: UpsellOffer) => void }) {
  const { t, formatCurrency } = useI18n();
  const meta = CATEGORY_META[place.category];
  const tour = place.tourOfferId ? UPSELL_OFFERS.find((o) => o.id === place.tourOfferId) : undefined;
  return (
    <Card as="li" className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunken">
          <meta.icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold leading-snug">{place.name}</h3>
            {now && <Badge tone="ok" dot>{t("ex.nowBadge")}</Badge>}
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-muted">
            {t(meta.label)} · {t("ex.drive", { n: place.driveMin })}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[0.9375rem] leading-relaxed">{t(`ex.place.${place.id}` as TranslationKey)}</p>

      <ul className="mt-3 space-y-1.5 text-[0.8125rem]">
        <li className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted" />
          <span className="tabular-nums">{place.hours}</span>
        </li>
        <li className="flex items-center gap-2">
          <Ticket className="h-4 w-4 shrink-0 text-muted" />
          {place.fee === 0 ? t("ex.free") : t("ex.fee", { fee: formatCurrency(place.fee) })}
        </li>
        <li className={cn("flex items-center gap-2", place.effort === "hard" && "text-warn")}>
          <Footprints className="h-4 w-4 shrink-0 text-muted" />
          {t(`ex.effort.${place.effort}` as TranslationKey)}
        </li>
        {place.familyFriendly && (
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-muted" />
            {t("ex.family")}
          </li>
        )}
      </ul>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" className="h-12 flex-1" icon={<Car className="h-[18px] w-[18px]" />} onClick={onBook}>
          {t("ex.bookCar")}
        </Button>
        <a
          href={mapsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("ex.mapAria", { place: place.name })}
          className={buttonClasses("secondary", "md", false, "h-12 gap-1.5 px-4")}
        >
          <MapPin className="h-[18px] w-[18px]" />
          {t("ex.map")}
        </a>
      </div>
      {tour && (
        <button type="button" onClick={() => onTour(tour)} className="mt-3 flex w-full items-start gap-2 text-left text-[0.8125rem] font-medium text-muted underline-offset-2 hover:text-fg hover:underline">
          <ConciergeBell className="mt-0.5 h-4 w-4 shrink-0" />
          {t("ex.tour", { title: tour.title, price: formatCurrency(tour.price) })}
        </button>
      )}
    </Card>
  );
}

function TourSheet({ offer, onClose }: { offer: UpsellOffer | null; onClose: () => void }) {
  const { acceptOffer } = useApp();
  const { t, formatCurrency } = useI18n();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  if (!offer) return null;
  const close = () => {
    setState("idle");
    onClose();
  };
  return (
    <Overlay
      open
      onClose={close}
      title={offer.title}
      description={state === "done" ? undefined : `${offer.durationLabel}`}
      footer={
        state === "done" ? (
          <Button variant="primary" onClick={close}>
            {t("a.done")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            block
            disabled={state === "sending"}
            onClick={async () => {
              setState("sending");
              await acceptOffer(offer);
              setState("done");
            }}
          >
            {state === "sending" ? t("a.sending") : t("ex.tourSheet.confirm")}
          </Button>
        )
      }
    >
      {state === "done" ? (
        <div className="flex flex-col items-center py-4 text-center animate-enter">
          <CheckCircle2 className="h-10 w-10 text-ok" />
          <p className="mt-3 text-base font-semibold">{t("toast.offerBooked")}</p>
        </div>
      ) : (
        <div className="space-y-3 text-[0.9375rem]">
          <p>{offer.description}</p>
          <p className="text-muted">{t("ex.tourSheet.body", { price: formatCurrency(offer.price) })}</p>
        </div>
      )}
    </Overlay>
  );
}

/** Halaman rekomendasi wisata. Pesan mobil → tiket Front Office; paket tur → alur penawaran yang sudah ada. */
export function GuestExplore() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [easyOnly, setEasyOnly] = useState(false);
  const [booking, setBooking] = useState<Attraction | null>(null);
  const [tour, setTour] = useState<UpsellOffer | null>(null);
  const part = dayPartOf();

  const list = useMemo(
    () => rankAttractions(ATTRACTIONS.filter((a) => (filter === "all" || a.category === filter) && (!easyOnly || a.effort === "easy")), part),
    [filter, easyOnly, part]
  );

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">{t("ex.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("ex.subtitle")}</p>
      </section>

      <section aria-label={t("ex.filter")} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                filter === f ? "border-fg bg-fg text-inverse" : "border-line bg-surface hover:border-line-strong"
              )}
            >
              {f === "all" ? t("ex.cat.all") : t(CATEGORY_META[f].label)}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={easyOnly} onChange={(e) => setEasyOnly(e.target.checked)} className="h-5 w-5 accent-[var(--fg)]" />
          <Footprints className="h-4 w-4 text-muted" />
          {t("ex.easyOnly")}
        </label>
      </section>

      <p className="text-[0.9375rem] font-semibold">{t(`ex.now.${part}` as TranslationKey)}</p>

      {list.length === 0 ? (
        <Card>
          <EmptyState compact icon={<MapPin className="h-5 w-5" />} title={t("ex.none")} />
        </Card>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <PlaceCard key={a.id} place={a} now={fitsNow(a, part)} onBook={() => setBooking(a)} onTour={setTour} />
          ))}
        </ul>
      )}

      <p className="text-xs text-subtle">{t("ex.pricesNote")}</p>

      <ExcursionSheet place={booking} onClose={() => setBooking(null)} />
      <TourSheet offer={tour} onClose={() => setTour(null)} />
    </div>
  );
}
