import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Languages, Mic, Route, Timer, ShieldCheck, BarChart3, Plug, Star, Siren, Users, EyeOff, FileClock, KeyRound } from "lucide-react";
import { useI18n, TranslationKey } from "../../i18n";
import { BrandMark, LanguageMenu } from "../../components/common/Shared";
import { Badge, buttonClasses } from "../../components/ui";
import { cn } from "../../lib/cn";

/** Tampilan tamu tiruan untuk bagian demo — komponen sungguhan, bukan tangkapan layar. */
function PhoneMock() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-[280px] rounded-[28px] border border-line bg-surface p-2 shadow-pop" aria-hidden>
      <div className="rounded-[22px] bg-canvas px-3.5 pb-4 pt-5">
        <p className="text-[0.6875rem] font-semibold">{t("entry.hotel")}</p>
        <p className="text-[0.625rem] text-muted">{t("g.roomShort", { room: "508" })}</p>
        <p className="mt-4 text-[0.9375rem] font-semibold leading-tight">{t("g.greetName", { greeting: t("g.greeting.evening"), name: "Alex" })}</p>
        <div className="mt-4 space-y-2.5">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-fg px-3 py-2 text-[0.75rem] text-inverse">{t("lp.mock.guest")}</div>
          <p className="max-w-[92%] text-[0.75rem] leading-relaxed">{t("lp.mock.reply")}</p>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="flex items-center justify-between text-[0.6875rem]">
              <span className="font-medium">{t("cat.ac")}</span>
              <span className="tabular-nums text-muted">HOS-1048</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-fg" />
              <span className="h-px flex-1 bg-fg" />
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-fg"><span className="h-1 w-1 rounded-full bg-inverse" /></span>
              <span className="h-px flex-1 bg-line" />
              <span className="h-3 w-3 rounded-full border border-line-strong bg-surface" />
            </div>
            <div className="mt-1 flex justify-between text-[0.5625rem] text-muted">
              <span>{t("g.step.received")}</span>
              <span className="font-medium text-fg">{t("g.step.inProgress")}</span>
              <span>{t("g.step.completed")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueMock() {
  const { t } = useI18n();
  const rows: { id: string; room: string; req: string; dept: TranslationKey; pri?: TranslationKey; status: TranslationKey; sla: string; tone?: "crit" | "warn" }[] = [
    { id: "HOS-1048", room: "508", req: "AC not cooling", dept: "dp.Maintenance", pri: "pri.HIGH", status: "st.in_progress", sla: "14:52" },
    { id: "HOS-1042", room: "702", req: "Extra bath towels", dept: "dp.Housekeeping", status: "st.new", sla: "03:10", tone: "warn" },
    { id: "ORD-2045", room: "105", req: "In-room dining (3)", dept: "dp.FoodBeverage", status: "st.preparing", sla: "18:04" },
    { id: "HOS-1032", room: "304", req: "Key card not working", dept: "dp.FrontOffice", pri: "pri.HIGH", status: "st.new", sla: "−03:12", tone: "crit" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-pop" aria-hidden>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-[0.75rem] font-semibold">{t("fo.liveQueue")}</p>
        <span className="text-[0.6875rem] text-muted">{t("lp.mock.updated")}</span>
      </div>
      <table className="w-full text-left text-[0.6875rem]">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pl-4 pr-2 font-medium">{t("q.ticket")}</th>
            <th className="px-2 py-2 font-medium">{t("q.room")}</th>
            <th className="px-2 py-2 font-medium">{t("q.request")}</th>
            <th className="hidden px-2 py-2 font-medium sm:table-cell">{t("q.department")}</th>
            <th className="px-2 py-2 font-medium">{t("q.status")}</th>
            <th className="py-2 pl-2 pr-4 text-right font-medium">{t("q.sla")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="py-2.5 pl-4 pr-2 font-medium tabular-nums">{r.id}</td>
              <td className="px-2 py-2.5 tabular-nums">{r.room}</td>
              <td className="max-w-[140px] truncate px-2 py-2.5">{r.req}</td>
              <td className="hidden px-2 py-2.5 text-muted sm:table-cell">{t(r.dept)}</td>
              <td className="px-2 py-2.5">
                <Badge tone={r.status === "st.new" ? "strong" : "neutral"} dot className="h-5 text-[0.625rem]">
                  {t(r.status)}
                </Badge>
              </td>
              <td className={cn("py-2.5 pl-2 pr-4 text-right font-medium tabular-nums", r.tone === "crit" ? "text-crit" : r.tone === "warn" ? "text-warn" : "")}>{r.sla}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Kartu kecil: permintaan tamu yang sudah sampai di antrean tim yang tepat. */
function RoutedCard() {
  const { t } = useI18n();
  return (
    <div className="w-[250px] rounded-xl border border-line bg-surface p-3.5 shadow-pop" aria-hidden>
      <div className="flex items-center justify-between text-[0.6875rem] text-muted">
        <span>{t("dp.Maintenance")}</span>
        <span className="tabular-nums">HOS-1048</span>
      </div>
      <p className="mt-1.5 text-[0.8125rem] font-semibold">AC not cooling · 508</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="flex gap-1.5">
          <Badge tone="strong" className="h-5 text-[0.625rem]">{t("pri.HIGH")}</Badge>
          <Badge tone="neutral" dot className="h-5 text-[0.625rem]">{t("st.new")}</Badge>
        </span>
        <span className="text-[0.8125rem] font-semibold tabular-nums">19:58</span>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div>
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-[0.9375rem] font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function SectionHead({ eyebrow, title, body, id }: { eyebrow: string; title: string; body?: string; id?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[0.8125rem] font-medium text-muted">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2.125rem]">
        {title}
      </h2>
      {body && <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{body}</p>}
    </div>
  );
}

export default function Landing() {
  const { t } = useI18n();
  const steps: { n: string; title: TranslationKey; body: TranslationKey }[] = [
    { n: "01", title: "lp.how.1", body: "lp.how.1b" },
    { n: "02", title: "lp.how.2", body: "lp.how.2b" },
    { n: "03", title: "lp.how.3", body: "lp.how.3b" },
    { n: "04", title: "lp.how.4", body: "lp.how.4b" },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark />
          <nav aria-label={t("lp.nav")} className="hidden items-center gap-6 text-[0.8125rem] text-muted md:flex">
            <a href="#how" className="hover:text-fg">{t("lp.nav.how")}</a>
            <a href="#guests" className="hover:text-fg">{t("lp.nav.guests")}</a>
            <a href="#operations" className="hover:text-fg">{t("lp.nav.operations")}</a>
            <a href="#privacy" className="hover:text-fg">{t("lp.nav.privacy")}</a>
          </nav>
          <div className="flex items-center gap-1">
            <LanguageMenu compact />
            <Link to="/demo" className={buttonClasses("primary", "sm")}>
              {t("lp.cta.demo")}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="text-[0.8125rem] font-medium text-muted">HOSPI AI</p>
              <h1 className="mt-3 text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.25rem]">{t("lp.hero.title")}</h1>
              <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-muted">{t("lp.hero.body")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/demo" className={buttonClasses("primary", "lg")}>
                  {t("lp.cta.demo")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how" className={buttonClasses("secondary", "lg")}>
                  {t("lp.cta.how")}
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-muted">
                {(["lp.hero.p1", "lp.hero.p2", "lp.hero.p3"] as TranslationKey[]).map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-fg" />
                    {t(k)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <PhoneMock />
              <div className="mt-4 flex justify-center sm:absolute sm:-right-2 sm:bottom-10 sm:mt-0 lg:-right-10">
                <RoutedCard />
              </div>
            </div>
          </div>
        </section>

        {/* Demo produk: tamu dan operasional berdampingan */}
        <section aria-labelledby="demo-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <div className="max-w-2xl">
              <p className="text-[0.8125rem] font-medium text-muted">{t("lp.demo.eyebrow")}</p>
              <h2 id="demo-title" className="mt-2 text-2xl font-semibold tracking-tight">{t("lp.demo.title")}</h2>
            </div>
            <div className="mt-8 grid items-center gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div>
                <p className="mb-3 text-center text-xs font-medium text-muted lg:text-left">{t("lp.demo.guestSide")}</p>
                <PhoneMock />
              </div>
              <div className="min-w-0">
                <p className="mb-3 text-xs font-medium text-muted">{t("lp.demo.staffSide")}</p>
                <QueueMock />
                <p className="mt-3 text-xs text-subtle">{t("lp.demo.caption")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Foto */}
        <section aria-hidden className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative h-56 overflow-hidden rounded-2xl sm:h-72">
            <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=70" alt="" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 max-w-lg text-[0.9375rem] font-medium text-white sm:bottom-7 sm:left-7">{t("lp.photo")}</p>
          </div>
        </section>

        {/* Masalah */}
        <section aria-labelledby="problem" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead id="problem" eyebrow={t("lp.problem.eyebrow")} title={t("lp.problem.title")} />
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {([
              ["lp.problem.1", "lp.problem.1b"],
              ["lp.problem.2", "lp.problem.2b"],
              ["lp.problem.3", "lp.problem.3b"],
            ] as [TranslationKey, TranslationKey][]).map(([a, b], i) => (
              <div key={a} className="border-t border-line pt-5">
                <p className="text-xs font-medium tabular-nums text-subtle">0{i + 1}</p>
                <p className="mt-2 text-[0.9375rem] font-semibold">{t(a)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t(b)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara kerja */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHead id="how-title" eyebrow={t("lp.how.eyebrow")} title={t("lp.how.title")} />
            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n} className="bg-surface p-6">
                  <p className="text-sm font-semibold tabular-nums text-subtle">{s.n}</p>
                  <p className="mt-6 text-[1.0625rem] font-semibold">{t(s.title)}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t(s.body)}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Star className="h-4 w-4" />
              {t("lp.how.after")}
            </p>
          </div>
        </section>

        {/* Pengalaman tamu */}
        <section id="guests" aria-labelledby="guests-title" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
          <div>
            <div>
              <SectionHead id="guests-title" eyebrow={t("lp.guest.eyebrow")} title={t("lp.guest.title")} body={t("lp.guest.body")} />
              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <Feature icon={Languages} title={t("lp.guest.f1")} body={t("lp.guest.f1b")} />
                <Feature icon={Mic} title={t("lp.guest.f2")} body={t("lp.guest.f2b")} />
                <Feature icon={Timer} title={t("lp.guest.f3")} body={t("lp.guest.f3b")} />
                <Feature icon={Siren} title={t("lp.guest.f4")} body={t("lp.guest.f4b")} />
              </div>
            </div>
          </div>
        </section>

        {/* Operasional */}
        <section id="operations" aria-labelledby="ops-title" className="scroll-mt-16 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHead id="ops-title" eyebrow={t("lp.ops.eyebrow")} title={t("lp.ops.title")} body={t("lp.ops.body")} />
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Feature icon={Route} title={t("lp.ops.f1")} body={t("lp.ops.f1b")} />
              <Feature icon={Timer} title={t("lp.ops.f2")} body={t("lp.ops.f2b")} />
              <Feature icon={Users} title={t("lp.ops.f3")} body={t("lp.ops.f3b")} />
              <Feature icon={BarChart3} title={t("lp.ops.f4")} body={t("lp.ops.f4b")} />
            </div>
          </div>
        </section>

        {/* AI, integrasi, privasi */}
        <section aria-labelledby="ai-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHead id="ai-title" eyebrow={t("lp.ai.eyebrow")} title={t("lp.ai.title")} body={t("lp.ai.body")} />
              <ul className="mt-6 space-y-2.5 text-sm">
                {(["lp.ai.1", "lp.ai.2", "lp.ai.3", "lp.ai.4"] as TranslationKey[]).map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    {t(k)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHead eyebrow={t("lp.int.eyebrow")} title={t("lp.int.title")} body={t("lp.int.body")} />
              <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
                {([
                  ["PMS", "lp.int.pms"],
                  ["POS", "lp.int.pos"],
                  ["AI", "lp.int.ai"],
                  [t("lp.int.notifications"), "lp.int.notif"],
                ] as [string, TranslationKey][]).map(([name, k]) => (
                  <li key={name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <Plug className="h-4 w-4 text-muted" />
                      {name}
                    </span>
                    <span className="text-right text-[0.8125rem] text-muted">{t(k)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="privacy" aria-labelledby="privacy-title" className="scroll-mt-16 border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHead id="privacy-title" eyebrow={t("lp.pv.eyebrow")} title={t("lp.pv.title")} body={t("lp.pv.body")} />
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Feature icon={KeyRound} title={t("lp.pv.1")} body={t("lp.pv.1b")} />
              <Feature icon={EyeOff} title={t("lp.pv.2")} body={t("lp.pv.2b")} />
              <Feature icon={FileClock} title={t("lp.pv.3")} body={t("lp.pv.3b")} />
              <Feature icon={ShieldCheck} title={t("lp.pv.4")} body={t("lp.pv.4b")} />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl bg-fg px-6 py-12 text-inverse sm:px-12">
            <h2 className="max-w-xl text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2.125rem]">{t("lp.cta.title")}</h2>
            <p className="mt-3 max-w-xl text-[0.9375rem] opacity-75">{t("lp.cta.body")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/demo" className="inline-flex h-11 items-center gap-2 rounded-lg bg-inverse px-4 text-[0.9375rem] font-medium text-fg hover:opacity-90">
                {t("lp.cta.demo")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/stay" className="inline-flex h-11 items-center rounded-lg border border-inverse/30 px-4 text-[0.9375rem] font-medium hover:bg-inverse/10">
                {t("lp.cta.guest")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:px-6">
          <BrandMark size={20} />
          <p>{t("lp.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
