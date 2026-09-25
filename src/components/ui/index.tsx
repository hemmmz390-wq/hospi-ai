import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { useI18n } from "../../i18n";
import type { Tone } from "../../lib/ticketView";

// ============================================================
// Button
// ============================================================

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,opacity] duration-150 disabled:opacity-45 disabled:pointer-events-none select-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-fg text-inverse hover:opacity-90 active:opacity-80",
  secondary: "bg-surface text-fg border border-line hover:bg-sunken active:bg-hover",
  ghost: "text-fg hover:bg-sunken active:bg-hover",
  danger: "bg-crit text-white hover:opacity-90 active:opacity-80",
  "danger-outline": "border border-crit/40 text-crit bg-surface hover:bg-crit-soft",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.8125rem]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-4 text-[0.9375rem]",
};

/** Kelas tombol untuk elemen lain (mis. <Link>), supaya tidak ada tombol di dalam tautan. */
export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", block?: boolean, className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], block && "w-full", className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", block, icon, className, children, type = "button", ...rest }, ref) => (
    <button ref={ref} type={type} className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], block && "w-full", className)} {...rest}>
      {icon}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(
  ({ label, variant = "ghost", size = "md", className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);
IconButton.displayName = "IconButton";

// ============================================================
// Badge
// ============================================================

const toneClass: Record<Tone, string> = {
  neutral: "bg-sunken text-fg",
  strong: "bg-fg text-inverse",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  crit: "bg-crit-soft text-crit",
  muted: "text-muted border border-line",
};

const dotClass: Record<Tone, string> = {
  neutral: "bg-muted",
  strong: "bg-inverse",
  ok: "bg-ok",
  warn: "bg-warn",
  crit: "bg-crit",
  muted: "bg-subtle",
};

export function Badge({ tone = "neutral", dot, children, className }: { tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium", toneClass[tone], className)}>
      {dot && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dotClass[tone])} />}
      {children}
    </span>
  );
}

// ============================================================
// Card & section heading
// ============================================================

export function Card({ className, children, as: As = "div", ...rest }: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return (
    <As className={cn("rounded-xl border border-line bg-surface", className)} {...rest}>
      {children}
    </As>
  );
}

export function SectionTitle({ title, action, hint, id }: { title: React.ReactNode; action?: React.ReactNode; hint?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[0.9375rem] font-semibold leading-tight">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-[0.8125rem] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================================================
// Form fields
// ============================================================

const fieldBase =
  "w-full rounded-lg border border-line bg-surface text-fg placeholder:text-subtle transition-colors focus:border-fg focus:outline-none disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-10 px-3 text-sm", className)} {...rest} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-[84px] resize-none px-3 py-2.5 text-sm leading-relaxed", className)} {...rest} />
));
Textarea.displayName = "Textarea";

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-10 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat px-3 pr-9 text-sm", className)} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b6b68' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }} {...rest}>
      {children}
    </select>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[0.8125rem] font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-[0.8125rem] text-crit">{error}</p> : hint ? <p className="text-[0.8125rem] text-muted">{hint}</p> : null}
    </div>
  );
}

// ============================================================
// Segmented control (tab kecil)
// ============================================================

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: { value: NoInfer<T>; label: React.ReactNode; count?: number }[];
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full overflow-x-auto no-scrollbar rounded-lg bg-sunken p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[0.8125rem]",
              active ? "bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted hover:text-fg"
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn("tabular-nums", active ? "text-muted" : "text-subtle")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================

export function EmptyState({ icon, title, body, action, compact }: { icon?: React.ReactNode; title: React.ReactNode; body?: React.ReactNode; action?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-4 py-8" : "px-6 py-14")}>
      {icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-muted">{icon}</div>}
      <p className="text-sm font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-[0.8125rem] text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// Avatar (inisial)
// ============================================================

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => Array.from(p)[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-sunken font-semibold text-muted", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  );
}

// ============================================================
// Stepper status
// ============================================================

export function Stepper({ steps, current, tone = "neutral", compact }: { steps: string[]; current: number; tone?: Tone; compact?: boolean }) {
  return (
    <ol className="flex w-full items-start" aria-label={steps[current]}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const color = tone === "warn" && active ? "bg-warn" : tone === "ok" && (done || active) ? "bg-ok" : "bg-fg";
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col items-start" aria-current={active ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  compact ? "h-4 w-4" : "h-5 w-5",
                  done || active ? cn(color, "text-inverse") : "border border-line-strong bg-surface"
                )}
              >
                {done && <Check className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} strokeWidth={3} />}
                {active && !done && <span className="h-1.5 w-1.5 rounded-full bg-inverse" />}
              </span>
              {i < steps.length - 1 && <span className={cn("mx-1 h-px flex-1 transition-colors duration-300", done ? color : "bg-line")} />}
            </div>
            <span className={cn("mt-1.5 truncate pr-2", compact ? "text-[0.6875rem]" : "text-xs", active ? "font-medium text-fg" : "text-muted")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================
// Overlay: dialog, bottom sheet, dan side drawer
// ============================================================

function useFocusTrap(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      el ? Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')) : [];
    const first = focusables().find((f) => !f.hasAttribute("data-autofocus-skip"));
    (el?.querySelector<HTMLElement>("[data-autofocus]") || first || el)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
    // onClose sengaja tidak jadi dependensi: fungsi baru tiap render tidak boleh
    // memindahkan fokus kembali ke elemen pertama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

export function Overlay({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "sheet",
  size = "md",
  tone,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** sheet: bawah di ponsel, dialog di tengah di layar lebar. drawer: panel kanan. */
  variant?: "sheet" | "drawer" | "dialog";
  size?: "sm" | "md" | "lg";
  tone?: "crit";
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(open, ref, onClose);
  if (!open) return null;

  const width = size === "sm" ? "sm:max-w-sm" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md";

  const panel =
    variant === "drawer"
      ? cn("fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 flex w-full flex-col bg-surface sm:w-[min(560px,100vw)] sm:border-l sm:border-line animate-drawer")
      : variant === "dialog"
        ? cn("relative m-4 flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-xl bg-surface shadow-pop animate-enter", width)
        : cn(
            "fixed inset-x-0 bottom-0 flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-pop animate-sheet",
            "sm:relative sm:inset-auto sm:m-4 sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl sm:animate-enter",
            width
          );

  return createPortal(
    <div className={cn("fixed inset-0 z-[60] flex", variant === "drawer" ? "" : "items-end justify-center sm:items-center")}>
      <div aria-hidden className="absolute inset-0 bg-black/40 animate-fade" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(panel, "z-10 outline-none", tone === "crit" && "border-t-4 border-crit sm:border-t-4")}
      >
        {variant === "sheet" && <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line-strong sm:hidden" />}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-3.5 pt-3.5 sm:pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold leading-snug">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-[0.8125rem] text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label={t("a.close")} size="sm" onClick={onClose} data-autofocus-skip className="-mr-1.5 -mt-0.5">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// ============================================================
// Popover sederhana (menu, notifikasi)
// ============================================================

export function Popover({
  trigger,
  children,
  align = "end",
  width = 320,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void; ref: React.Ref<HTMLButtonElement>; "aria-expanded": boolean; "aria-haspopup": "dialog" }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  width?: number;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; w: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const w = Math.min(width, window.innerWidth - 16);
      let left = align === "end" ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      setPos({ top: r.bottom + 6, left, w });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <>
      {trigger({ open, toggle: () => setOpen((o) => !o), ref: btnRef, "aria-expanded": open, "aria-haspopup": "dialog" })}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            className="fixed z-[70] max-h-[min(70dvh,560px)] overflow-y-auto scroll-thin rounded-xl border border-line bg-surface shadow-pop animate-enter"
            style={{ top: pos.top, left: pos.left, width: pos.w }}
          >
            {children(close)}
          </div>,
          document.body
        )}
    </>
  );
}

// ============================================================
// Skeleton
// ============================================================

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-sunken", className)} />;
}

// ============================================================
// Kbd
// ============================================================

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-sunken px-1 font-sans text-[0.6875rem] text-muted">{children}</kbd>;
}
