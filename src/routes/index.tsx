import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppGate } from "@/components/AppGate";
import { saveNote } from "@/lib/storage";

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

function NewNote() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const field =
    "w-full rounded-xl border border-border bg-card px-4 text-[15px] outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!from.trim() || !to.trim()) return setError("Укажите маршрут");
    if (!purpose.trim()) return setError("Укажите цель поездки");
    const num = Number(amount.replace(",", "."));
    if (!num || num <= 0) return setError("Укажите сумму");

    saveNote({
      id: crypto.randomUUID(),
      date,
      from: from.trim(),
      to: to.trim(),
      purpose: purpose.trim(),
      amount: num,
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
        Зафиксируйте поездку на такси по корпоративным делам.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 rounded-3xl bg-card p-6 sm:p-8"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        <div className="space-y-5">
          <Row label="Дата">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} h-[52px]`} />
          </Row>

          <div className="grid gap-5 sm:grid-cols-2">
            <Row label="Откуда">
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Офис, ул. ..." className={`${field} h-[52px]`} />
            </Row>
            <Row label="Куда">
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Клиент / адрес" className={`${field} h-[52px]`} />
            </Row>
          </div>

          <Row label="Цель поездки">
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Встреча с подрядчиком" className={`${field} h-[52px]`} />
          </Row>

          <Row label="Сумма, ₽">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`${field} h-[52px]`}
            />
          </Row>

          <Row label="Комментарий (необязательно)">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="—"
              className={`${field} resize-none py-3`}
            />
          </Row>

          {error && (
            <p className="text-[13px]" style={{ color: "var(--color-primary)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saved}
            className="h-[52px] w-full rounded-xl text-[15px] font-medium text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saved ? "Сохранено" : "Сохранить записку"}
          </button>
        </div>
      </form>
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
