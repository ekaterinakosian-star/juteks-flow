import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Plus, X, Download, Send, Loader2 } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { DocumentPreview, type PreviewTrip } from "@/components/DocumentPreview";
import {
  getLastName,
  getProfile,
  getSettings,
  saveNote,
  TRIP_PURPOSES,
  type PaymentMethod,
  type Profile,
  type TripPurpose,
} from "@/lib/storage";
import { numberToRubles } from "@/lib/numberToWords";
import { buildFilename, elementToPdfBlob, printElement } from "@/lib/pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Новая записка — JUTEKS такси" },
      { name: "description", content: "Учёт расходов на такси сотрудников ООО «Ютекс Ру»." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <AppGate>
      <NewNote />
    </AppGate>
  );
}

const field =
  "w-full rounded-xl border border-border bg-card px-4 text-[15px] outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5";

interface Trip {
  id: string;
  date: string;
  departTime: string;
  arriveTime: string;
  from: string;
  to: string;
  amount: string;
  payment: PaymentMethod;
  purpose: TripPurpose | "";
  counterparty: string;
  isBusinessTrip: boolean;
  bizStart: string;
  bizEnd: string;
}

const makeTrip = (date: string): Trip => ({
  id: crypto.randomUUID(),
  date,
  departTime: "",
  arriveTime: "",
  from: "",
  to: "",
  amount: "",
  payment: "card",
  purpose: "",
  counterparty: "",
  isBusinessTrip: false,
  bizStart: "",
  bizEnd: "",
});

const parseAmount = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return isFinite(n) && n > 0 ? n : 0;
};

const needsCp = (p: Trip["purpose"]) =>
  p === "Встреча с клиентом" || p === "Поездка к контрагенту";

const isRouteValid = (t: Trip) =>
  !!t.date && !!t.from.trim() && !!t.to.trim() && parseAmount(t.amount) > 0;

const isPurposeValid = (t: Trip) =>
  !!t.purpose &&
  (!needsCp(t.purpose) || t.counterparty.trim().length > 0) &&
  (!t.isBusinessTrip || (!!t.bizStart && !!t.bizEnd));

const isTripFullyValid = (t: Trip) => isRouteValid(t) && isPurposeValid(t);

function NewNote() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [trips, setTrips] = useState<Trip[]>([makeTrip(today)]);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  const profile = useMemo(() => getProfile(), []);
  const groupIdRef = useRef<string>(crypto.randomUUID());

  const update = (id: string, patch: Partial<Trip>) =>
    setTrips((arr) => arr.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addTrip = () => setTrips((arr) => [...arr, makeTrip(today)]);
  const removeTrip = (id: string) => setTrips((arr) => arr.filter((t) => t.id !== id));

  const step1Valid = isRouteValid(trips[0]);
  const step2Valid =
    isPurposeValid(trips[0]) && trips.slice(1).every((t) => isTripFullyValid(t));

  const previewTrips: PreviewTrip[] = trips.map((t) => ({
    id: t.id,
    date: t.date,
    departTime: t.departTime,
    arriveTime: t.arriveTime,
    from: t.from,
    to: t.to,
    amount: parseAmount(t.amount),
    payment: t.payment,
    purpose: t.purpose || "",
    counterparty: t.counterparty,
    isBusinessTrip: t.isBusinessTrip,
    bizStart: t.bizStart,
    bizEnd: t.bizEnd,
  }));

  const persistTrips = (status: "draft" | "sent" | "downloaded") => {
    const createdAt = new Date().toISOString();
    const groupId = groupIdRef.current;
    trips.forEach((t) => {
      saveNote({
        id: crypto.randomUUID(),
        groupId,
        status,
        date: t.date,
        departTime: t.departTime || undefined,
        arriveTime: t.arriveTime || undefined,
        from: t.from.trim(),
        to: t.to.trim(),
        purpose: t.purpose as string,
        amount: parseAmount(t.amount),
        paymentMethod: t.payment,
        counterparty: needsCp(t.purpose) ? t.counterparty.trim() : undefined,
        isBusinessTrip: t.isBusinessTrip,
        businessTripStart: t.isBusinessTrip ? t.bizStart : undefined,
        businessTripEnd: t.isBusinessTrip ? t.bizEnd : undefined,
        comment: comment.trim() || undefined,
        createdAt,
      });
    });
  };

  const submit = () => {
    if (!step1Valid || !step2Valid) return;
    persistTrips("draft");
    setSaved(true);
    setTimeout(() => navigate({ to: "/history" }), 1100);
  };

  if (saved) {
    return <SuccessSplash />;
  }

  return (
    <div>
      <h1 className="text-[34px] font-medium leading-tight tracking-tight">Новая записка</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Заполните три коротких шага.</p>

      <ProgressDots step={step} />

      <div className="mt-6 space-y-4">
        {step === 1 && (
          <StepCard title="Шаг 1 · Данные поездки">
            <RouteFields trip={trips[0]} update={(p) => update(trips[0].id, p)} />
          </StepCard>
        )}

        {step === 2 && (
          <>
            <StepCard title="Шаг 2 · Цель поездки">
              <PurposeFields trip={trips[0]} update={(p) => update(trips[0].id, p)} />
            </StepCard>

            {trips.slice(1).map((t, i) => (
              <div key={t.id} className="animate-fade-up">
                <StepCard
                  title={`Поездка ${i + 2}`}
                  onRemove={() => removeTrip(t.id)}
                >
                  <RouteFields trip={t} update={(p) => update(t.id, p)} />
                  <div className="my-2 h-px bg-border/60" />
                  <PurposeFields trip={t} update={(p) => update(t.id, p)} />
                </StepCard>
              </div>
            ))}

            <div
              className="sticky z-20"
              style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
            >
              <button
                type="button"
                onClick={addTrip}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed text-[15px] font-medium backdrop-blur-xl transition active:scale-[0.995]"
                style={{
                  color: "var(--color-primary)",
                  borderColor:
                    "color-mix(in oklch, var(--color-primary) 50%, transparent)",
                  backgroundColor:
                    "color-mix(in oklch, var(--color-card) 85%, transparent)",
                }}
              >
                <Plus size={18} strokeWidth={2} />
                Добавить поездку
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <DocumentPreview trips={previewTrips} profile={profile} />
        )}
      </div>

      {step === 3 && (
        <PdfActions
          trips={trips}
          profile={profile}
          onSent={() => {
            persistTrips("sent");
            setSaved(true);
            setTimeout(() => navigate({ to: "/history" }), 1100);
          }}
          onDownloaded={() => {
            persistTrips("downloaded");
          }}
        />
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            className="min-h-[52px] h-[56px] flex-1 rounded-xl border border-border bg-card text-[16px] font-medium text-foreground transition active:scale-[0.99]"
          >
            Назад
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            disabled={step === 1 ? !step1Valid : !step2Valid}
            onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
            className="min-h-[52px] h-[56px] flex-1 rounded-xl text-[16px] font-medium text-primary-foreground transition active:scale-[0.99] disabled:opacity-40"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Далее
          </button>
        )}
        {step === 3 && (
          <button
            type="button"
            disabled={saved || !step1Valid || !step2Valid}
            onClick={submit}
            className="min-h-[52px] h-[56px] flex-1 rounded-xl text-[16px] font-medium text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Сохранить записку
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessSplash() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div
        className="success-check-circle flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: "#10b981" }}
      >
        <svg viewBox="0 0 52 52" className="h-14 w-14">
          <path
            className="success-check-path"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27 L23 36 L40 18"
          />
        </svg>
      </div>
      <h2 className="mt-6 text-[24px] font-medium tracking-tight">Записка сохранена</h2>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Открываем историю…</p>
    </div>
  );
}

// ---------- PDF Actions ----------

interface TripLike {
  date: string;
  departTime: string;
  arriveTime: string;
  from: string;
  to: string;
  amount: string;
  payment: PaymentMethod;
  purpose: TripPurpose | "";
  counterparty: string;
  isBusinessTrip: boolean;
  bizStart: string;
  bizEnd: string;
}

function PdfActions({
  trips,
  profile,
  onSent,
  onDownloaded,
}: {
  trips: TripLike[];
  profile: Profile | null;
  onSent?: () => void;
  onDownloaded?: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const webhookUrl = useMemo(() => getSettings().webhookUrl, []);
  const lastName = getLastName(profile?.fullName || "");
  const filename = buildFilename({ lastName, tripDates: trips.map((t) => t.date) });
  const filenameNoExt = filename.replace(/\.pdf$/i, "");

  const downloadPdf = () => {
    printElement(filenameNoExt);
    onDownloaded?.();
  };

  const sendToOneDrive = async () => {
    if (!webhookUrl) return;
    const el = document.getElementById("document-preview");
    if (!el) return;
    setSending(true);
    setBanner(null);
    try {
      const blob = await elementToPdfBlob(el);
      const file = new File([blob], filename, { type: "application/pdf" });
      const metadata = {
        fio: profile?.fullName || "",
        dolzhnost: profile?.position || "",
        filial: profile?.branch || "",
        email: profile?.email || "",
        document_date: new Date().toISOString().slice(0, 10),
        filename,
        trips: trips.map((t) => ({
          date: t.date,
          depart_time: t.departTime,
          arrive_time: t.arriveTime,
          from: t.from,
          to: t.to,
          amount: Number(t.amount.replace(/\s/g, "").replace(",", ".")) || 0,
          payment_method: t.payment,
          purpose: t.purpose,
          counterparty: t.counterparty || null,
          is_business_trip: t.isBusinessTrip,
          business_trip_start: t.bizStart || null,
          business_trip_end: t.bizEnd || null,
        })),
      };
      const fd = new FormData();
      fd.append("file", file, filename);
      fd.append("metadata", JSON.stringify(metadata));
      const res = await fetch(webhookUrl, { method: "POST", body: fd });
      if (!res.ok) throw new Error(String(res.status));
      setBanner({
        kind: "ok",
        text: "Документ отправлен. Проверьте папку OneDrive с вашим ФИО в канале Teams.",
      });
      onSent?.();
    } catch {
      setBanner({
        kind: "err",
        text: "Ошибка отправки. Скачайте PDF вручную и загрузите в Teams.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {banner && (
        <div
          className="rounded-xl px-4 py-3 text-[14px]"
          style={{
            backgroundColor:
              banner.kind === "ok"
                ? "color-mix(in oklch, #10b981 12%, white)"
                : "color-mix(in oklch, var(--color-primary) 12%, white)",
            color:
              banner.kind === "ok"
                ? "#065f46"
                : "var(--color-primary)",
            border: `1px solid ${banner.kind === "ok" ? "#10b98155" : "color-mix(in oklch, var(--color-primary) 30%, transparent)"}`,
          }}
        >
          {banner.text}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={downloadPdf}
          className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card text-[15px] font-medium text-foreground transition active:scale-[0.99]"
        >
          <Download size={18} strokeWidth={1.75} />
          Скачать PDF
        </button>

        <div className="group relative flex-1">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Функция в разработке"
            className="flex h-[52px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-muted text-[15px] font-medium text-muted-foreground"
          >
            <Send size={18} strokeWidth={1.75} />
            Отправить в OneDrive
          </button>
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 -top-2 z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-active:opacity-100"
          >
            Функция в разработке
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Field blocks ----------

function RouteFields({ trip, update }: { trip: Trip; update: (p: Partial<Trip>) => void }) {
  const amountNum = parseAmount(trip.amount);
  const amountWords = amountNum > 0 ? numberToRubles(amountNum) : "";
  return (
    <div className="space-y-5">
      <Row label="Дата поездки">
        <input type="date" value={trip.date} onChange={(e) => update({ date: e.target.value })} className={`${field} h-[52px]`} />
      </Row>
      <div className="grid gap-5 sm:grid-cols-2">
        <Row label="Время отправления">
          <input type="time" value={trip.departTime} onChange={(e) => update({ departTime: e.target.value })} className={`${field} h-[52px]`} />
        </Row>
        <Row label="Время прибытия">
          <input type="time" value={trip.arriveTime} onChange={(e) => update({ arriveTime: e.target.value })} className={`${field} h-[52px]`} />
        </Row>
      </div>
      <Row label="Откуда">
        <input value={trip.from} onChange={(e) => update({ from: e.target.value })} placeholder="Адрес отправления" className={`${field} h-[52px]`} />
      </Row>
      <Row label="Куда">
        <input value={trip.to} onChange={(e) => update({ to: e.target.value })} placeholder="Адрес назначения" className={`${field} h-[52px]`} />
      </Row>
      <Row label="Сумма расходов, ₽">
        <input inputMode="decimal" value={trip.amount} onChange={(e) => update({ amount: e.target.value })} placeholder="0" className={`${field} h-[52px]`} />
        <p className="mt-2 min-h-[18px] text-[13px] italic text-muted-foreground">{amountWords}</p>
      </Row>
      <Row label="Способ оплаты">
        <div className="flex gap-2">
          <PaymentPill active={trip.payment === "card"} onClick={() => update({ payment: "card" })}>💳 Банковская карта</PaymentPill>
          <PaymentPill active={trip.payment === "cash"} onClick={() => update({ payment: "cash" })}>💵 Наличные</PaymentPill>
        </div>
      </Row>
    </div>
  );
}

function PurposeFields({ trip, update }: { trip: Trip; update: (p: Partial<Trip>) => void }) {
  return (
    <div className="space-y-5">
      <Row label="Цель поездки">
        <select
          value={trip.purpose}
          onChange={(e) => update({ purpose: e.target.value as TripPurpose })}
          className={`${field} h-[52px] bg-card`}
        >
          <option value="">Выберите цель…</option>
          {TRIP_PURPOSES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Row>

      {needsCp(trip.purpose) && (
        <Row label="Компания и ФИО представителя">
          <input
            value={trip.counterparty}
            onChange={(e) => update({ counterparty: e.target.value })}
            placeholder="ООО «Пример» — Иванов И. И."
            className={`${field} h-[52px]`}
          />
        </Row>
      )}

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
        <div>
          <p className="text-[15px] font-medium">Командировка / Служебная поездка</p>
          <p className="text-[12px] text-muted-foreground">Укажите даты командировки</p>
        </div>
        <Toggle checked={trip.isBusinessTrip} onChange={(v) => update({ isBusinessTrip: v })} />
      </div>

      {trip.isBusinessTrip && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Row label="Дата начала">
            <input type="date" value={trip.bizStart} onChange={(e) => update({ bizStart: e.target.value })} className={`${field} h-[52px]`} />
          </Row>
          <Row label="Дата окончания">
            <input type="date" value={trip.bizEnd} onChange={(e) => update({ bizEnd: e.target.value })} className={`${field} h-[52px]`} />
          </Row>
        </div>
      )}
    </div>
  );
}

// (DocumentPreview moved to src/components/DocumentPreview.tsx)

// ---------- UI primitives ----------

function ProgressDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mt-6 flex items-center gap-2">
      {[1, 2, 3].map((n) => {
        const active = n === step;
        const done = n < step;
        return (
          <span
            key={n}
            className="h-2 rounded-full transition-all"
            style={{
              width: active ? 28 : 8,
              backgroundColor: active
                ? "var(--color-primary)"
                : done
                  ? "color-mix(in oklch, var(--color-primary) 40%, transparent)"
                  : "var(--color-border)",
            }}
          />
        );
      })}
      <span className="ml-2 text-[12px] text-muted-foreground">Шаг {step} из 3</span>
    </div>
  );
}

function StepCard({
  title,
  children,
  onRemove,
}: {
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <div className="relative rounded-3xl bg-card p-6 sm:p-8" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Удалить поездку"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PaymentPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[48px] flex-1 rounded-full border text-[14px] font-medium transition active:scale-[0.98]"
      style={{
        backgroundColor: active ? "var(--color-primary)" : "var(--color-card)",
        color: active ? "var(--color-primary-foreground)" : "var(--color-foreground)",
        borderColor: active ? "var(--color-primary)" : "var(--color-border)",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-[31px] w-[51px] rounded-full transition"
      style={{
        backgroundColor: checked ? "var(--color-primary)" : "color-mix(in oklch, var(--color-foreground) 15%, transparent)",
      }}
    >
      <span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white transition-all"
        style={{ left: checked ? "22px" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      />
    </button>
  );
}
