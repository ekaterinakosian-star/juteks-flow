import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppGate } from "@/components/AppGate";
import { saveNote, TRIP_PURPOSES, type PaymentMethod, type TripPurpose } from "@/lib/storage";
import { numberToRubles } from "@/lib/numberToWords";

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

function NewNote() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [date, setDate] = useState(today);
  const [departTime, setDepartTime] = useState("");
  const [arriveTime, setArriveTime] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");

  // Step 2
  const [purpose, setPurpose] = useState<TripPurpose | "">("");
  const [counterparty, setCounterparty] = useState("");
  const [isBusinessTrip, setIsBusinessTrip] = useState(false);
  const [bizStart, setBizStart] = useState("");
  const [bizEnd, setBizEnd] = useState("");

  // Step 3
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  const amountNum = useMemo(() => {
    const n = Number(amount.replace(/\s/g, "").replace(",", "."));
    return isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const amountWords = useMemo(() => (amountNum > 0 ? numberToRubles(amountNum) : ""), [amountNum]);

  const needsCounterparty = purpose === "Встреча с клиентом" || purpose === "Поездка к контрагенту";

  const step1Valid = !!date && !!from.trim() && !!to.trim() && amountNum > 0;
  const step2Valid =
    !!purpose &&
    (!needsCounterparty || counterparty.trim().length > 0) &&
    (!isBusinessTrip || (!!bizStart && !!bizEnd));

  const submit = () => {
    if (!step1Valid || !step2Valid) return;
    saveNote({
      id: crypto.randomUUID(),
      date,
      departTime: departTime || undefined,
      arriveTime: arriveTime || undefined,
      from: from.trim(),
      to: to.trim(),
      purpose: purpose as string,
      amount: amountNum,
      paymentMethod: payment,
      counterparty: needsCounterparty ? counterparty.trim() : undefined,
      isBusinessTrip,
      businessTripStart: isBusinessTrip ? bizStart : undefined,
      businessTripEnd: isBusinessTrip ? bizEnd : undefined,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => navigate({ to: "/history" }), 500);
  };

  return (
    <div>
      <h1 className="text-[34px] font-medium leading-tight tracking-tight">Новая записка</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Заполните три коротких шага.
      </p>

      <ProgressDots step={step} />

      <div className="mt-6">
        {step === 1 && (
          <StepCard title="Шаг 1 · Данные поездки">
            <Row label="Дата поездки">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} h-[52px]`} />
            </Row>
            <div className="grid gap-5 sm:grid-cols-2">
              <Row label="Время отправления">
                <input type="time" value={departTime} onChange={(e) => setDepartTime(e.target.value)} className={`${field} h-[52px]`} />
              </Row>
              <Row label="Время прибытия">
                <input type="time" value={arriveTime} onChange={(e) => setArriveTime(e.target.value)} className={`${field} h-[52px]`} />
              </Row>
            </div>
            <Row label="Откуда">
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Адрес отправления" className={`${field} h-[52px]`} />
            </Row>
            <Row label="Куда">
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Адрес назначения" className={`${field} h-[52px]`} />
            </Row>
            <Row label="Сумма расходов, ₽">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`${field} h-[52px]`}
              />
              <p className="mt-2 min-h-[18px] text-[13px] italic text-muted-foreground">
                {amountWords}
              </p>
            </Row>
            <Row label="Способ оплаты">
              <div className="flex gap-2">
                <PaymentPill active={payment === "card"} onClick={() => setPayment("card")}>
                  💳 Банковская карта
                </PaymentPill>
                <PaymentPill active={payment === "cash"} onClick={() => setPayment("cash")}>
                  💵 Наличные
                </PaymentPill>
              </div>
            </Row>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="Шаг 2 · Цель поездки">
            <Row label="Цель поездки">
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as TripPurpose)}
                className={`${field} h-[52px] bg-card`}
              >
                <option value="">Выберите цель…</option>
                {TRIP_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Row>

            {needsCounterparty && (
              <Row label="Компания и ФИО представителя">
                <input
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
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
              <Toggle checked={isBusinessTrip} onChange={setIsBusinessTrip} />
            </div>

            {isBusinessTrip && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Row label="Дата начала">
                  <input type="date" value={bizStart} onChange={(e) => setBizStart(e.target.value)} className={`${field} h-[52px]`} />
                </Row>
                <Row label="Дата окончания">
                  <input type="date" value={bizEnd} onChange={(e) => setBizEnd(e.target.value)} className={`${field} h-[52px]`} />
                </Row>
              </div>
            )}
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="Шаг 3 · Подтверждение">
            <SummaryRow k="Дата" v={date} />
            {(departTime || arriveTime) && (
              <SummaryRow k="Время" v={`${departTime || "—"} → ${arriveTime || "—"}`} />
            )}
            <SummaryRow k="Маршрут" v={`${from} → ${to}`} />
            <SummaryRow k="Сумма" v={`${amountNum.toLocaleString("ru-RU")} ₽`} />
            <SummaryRow k="Прописью" v={amountWords} muted />
            <SummaryRow k="Оплата" v={payment === "card" ? "Банковская карта" : "Наличные"} />
            <SummaryRow k="Цель" v={purpose || "—"} />
            {needsCounterparty && counterparty && <SummaryRow k="Контрагент" v={counterparty} />}
            {isBusinessTrip && <SummaryRow k="Командировка" v={`${bizStart} — ${bizEnd}`} />}

            <Row label="Комментарий (необязательно)">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="—"
                className={`${field} resize-none py-3`}
              />
            </Row>
          </StepCard>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            className="h-[56px] flex-1 rounded-xl border border-border bg-card text-[16px] font-medium text-foreground transition active:scale-[0.99]"
          >
            Назад
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            disabled={step === 1 ? !step1Valid : !step2Valid}
            onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
            className="h-[56px] flex-1 rounded-xl text-[16px] font-medium text-primary-foreground transition active:scale-[0.99] disabled:opacity-40"
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
            className="h-[56px] flex-1 rounded-xl text-[16px] font-medium text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saved ? "Сохранено" : "Сохранить записку"}
          </button>
        )}
      </div>
    </div>
  );
}

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

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-6 sm:p-8" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <p className="mb-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
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
        style={{
          left: checked ? "22px" : "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function SummaryRow({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[13px] text-muted-foreground">{k}</span>
      <span
        className={`text-right text-[15px] ${muted ? "italic text-muted-foreground" : "text-foreground"}`}
      >
        {v}
      </span>
    </div>
  );
}
