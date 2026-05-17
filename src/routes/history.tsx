import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { deleteNote, getNotes, type TaxiNote } from "@/lib/storage";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "История поездок — JUTEKS такси" },
      { name: "description", content: "История корпоративных поездок на такси." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <AppGate>
      <History />
    </AppGate>
  );
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function History() {
  const [notes, setNotes] = useState<TaxiNote[]>([]);

  useEffect(() => {
    setNotes(getNotes());
  }, []);

  const total = notes.reduce((s, n) => s + n.amount, 0);

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNotes(getNotes());
  };

  return (
    <div>
      <h1 className="text-[34px] font-medium leading-tight tracking-tight">История</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        {notes.length === 0
          ? "Здесь появятся ваши поездки."
          : `${notes.length} ${pluralize(notes.length)} · итого ${fmtMoney(total)}`}
      </p>

      {notes.length === 0 ? (
        <div
          className="mt-8 rounded-3xl bg-card p-10 text-center"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
        >
          <p className="text-[15px] text-muted-foreground">Пока нет ни одной записки.</p>
          <Link
            to="/"
            className="mt-6 inline-flex h-[52px] items-center justify-center rounded-xl px-6 text-[15px] font-medium text-primary-foreground"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Создать записку
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="group rounded-2xl bg-card p-5"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {fmtDate(n.date)}
                  </p>
                  <p className="mt-1 truncate text-[17px] font-medium text-foreground">
                    {n.from} <span className="text-muted-foreground">→</span> {n.to}
                  </p>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">{n.purpose}</p>
                  {n.comment && (
                    <p className="mt-2 text-[13px] text-muted-foreground">{n.comment}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className="whitespace-nowrap text-[17px] font-medium tabular-nums">
                    {fmtMoney(n.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-muted-foreground transition hover:text-foreground"
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function pluralize(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "поездка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "поездки";
  return "поездок";
}
