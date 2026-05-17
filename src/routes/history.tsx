import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Trash2, FolderOpen } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import {
  DocumentPreview,
  type PreviewTrip,
} from "@/components/DocumentPreview";
import {
  clearNotes,
  getLastName,
  getNoteGroups,
  getProfile,
  lastWorkingDayOfMonth,
  type NoteGroup,
  type PaymentMethod,
  type Profile,
} from "@/lib/storage";
import {
  buildFilename,
  downloadBlob,
  elementToPdfBlob,
} from "@/lib/pdf";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "История поездок — JUTEKS такси" },
      {
        name: "description",
        content: "История корпоративных поездок на такси.",
      },
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
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function tripToPreview(t: NoteGroup["trips"][number]): PreviewTrip {
  return {
    id: t.id,
    date: t.date,
    departTime: t.departTime,
    arriveTime: t.arriveTime,
    from: t.from,
    to: t.to,
    amount: t.amount,
    payment: (t.paymentMethod as PaymentMethod) || "card",
    purpose: t.purpose,
    counterparty: t.counterparty,
    isBusinessTrip: t.isBusinessTrip,
    bizStart: t.businessTripStart,
    bizEnd: t.businessTripEnd,
  };
}

function History() {
  const [groups, setGroups] = useState<NoteGroup[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [reDownloading, setReDownloading] = useState<NoteGroup | null>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGroups(getNoteGroups());
    setProfile(getProfile());
  }, []);

  const total = groups.reduce((s, g) => s + g.total, 0);

  const handleClear = () => {
    clearNotes();
    setGroups([]);
    setConfirmClear(false);
  };

  const handleReDownload = async (g: NoteGroup) => {
    setReDownloading(g);
    // Wait a tick for the hidden preview to render
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 30));
    const el = hiddenRef.current?.querySelector(
      "#document-preview-hidden",
    ) as HTMLElement | null;
    if (!el) {
      setReDownloading(null);
      return;
    }
    try {
      const blob = await elementToPdfBlob(el);
      const filename = buildFilename({
        lastName: getLastName(profile?.fullName || ""),
        tripDates: g.trips.map((t) => t.date),
      });
      downloadBlob(blob, filename);
    } finally {
      setReDownloading(null);
    }
  };

  return (
    <div>
      <h1 className="text-[34px] font-medium leading-tight tracking-tight">
        История
      </h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        {groups.length === 0
          ? "Здесь появятся ваши записки."
          : `${groups.length} ${pluralize(groups.length, ["записка", "записки", "записок"])} · итого ${fmtMoney(total)}`}
      </p>

      {groups.length === 0 ? (
        <div
          className="mt-10 rounded-3xl bg-card p-12 text-center animate-fade-up"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FolderOpen
              size={28}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
          </div>
          <p className="text-[16px] font-medium text-foreground">
            Здесь появятся ваши записки
          </p>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Создайте первую служебную записку.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-xl px-7 text-[15px] font-medium text-primary-foreground"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Создать записку
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-3">
            {groups.map((g, i) => (
              <li
                key={g.groupId}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
              >
                <GroupCard
                  group={g}
                  onReDownload={() => handleReDownload(g)}
                  reDownloading={reDownloading?.groupId === g.groupId}
                />
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {confirmClear ? (
              <div
                className="flex flex-col gap-3 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
              >
                <p className="text-[14px] text-foreground">
                  Удалить все записки? Действие необратимо.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[44px] rounded-xl border border-border bg-card px-4 text-[14px] font-medium text-foreground"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleClear}
                    className="min-h-[44px] rounded-xl px-4 text-[14px] font-medium text-primary-foreground"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Очистить
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl border border-border bg-card text-[14px] font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Trash2 size={16} strokeWidth={1.75} />
                Очистить историю
              </button>
            )}
          </div>
        </>
      )}

      {/* Hidden preview used for re-download PDF generation */}
      {reDownloading && (
        <div
          ref={hiddenRef}
          style={{
            position: "fixed",
            left: -10000,
            top: 0,
            width: 800,
            pointerEvents: "none",
            opacity: 0,
          }}
          aria-hidden
        >
          <DocumentPreview
            id="document-preview-hidden"
            trips={reDownloading.trips.map(tripToPreview)}
            profile={profile}
            documentDate={reDownloading.createdAt.slice(0, 10)}
          />
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  onReDownload,
  reDownloading,
}: {
  group: NoteGroup;
  onReDownload: () => void;
  reDownloading: boolean;
}) {
  const first = group.trips[0];
  const multi = group.trips.length > 1;
  const docDate = group.createdAt.slice(0, 10);
  const deadline = lastWorkingDayOfMonth(docDate);
  const overdue = deadline.getTime() < Date.now() - 24 * 60 * 60 * 1000;
  const deadlineStr = deadline.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="rounded-2xl bg-card p-5"
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {fmtShort(docDate)}
          </p>
          <p className="mt-1.5 truncate text-[17px] font-medium text-foreground">
            {multi ? (
              <>
                {group.trips.length}{" "}
                {pluralize(group.trips.length, [
                  "поездка",
                  "поездки",
                  "поездок",
                ])}
              </>
            ) : (
              <>
                {first.from}{" "}
                <span className="text-muted-foreground">→</span> {first.to}
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusPill status={group.status} />
            <span
              className="text-[12px]"
              style={{
                color: overdue
                  ? "var(--color-primary)"
                  : "var(--color-muted-foreground)",
                fontWeight: overdue ? 500 : 400,
              }}
            >
              Подать до {deadlineStr}
              {overdue ? " — просрочено" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="whitespace-nowrap text-[17px] font-medium tabular-nums">
            {fmtMoney(group.total)}
          </span>
        </div>
      </div>

      <button
        onClick={onReDownload}
        disabled={reDownloading}
        className="mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-card text-[14px] font-medium text-foreground transition active:scale-[0.99] disabled:opacity-60"
      >
        <Download size={16} strokeWidth={1.75} />
        {reDownloading ? "Готовим PDF…" : "Скачать PDF повторно"}
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: NoteGroup["status"] }) {
  if (status === "sent") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: "color-mix(in oklch, #10b981 14%, white)",
          color: "#065f46",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "#10b981" }}
        />
        Отправлено в OneDrive
      </span>
    );
  }
  if (status === "downloaded") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
        style={{
          backgroundColor: "var(--color-muted)",
          color: "var(--color-muted-foreground)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "var(--color-muted-foreground)" }}
        />
        Скачано вручную
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: "var(--color-muted)",
        color: "var(--color-muted-foreground)",
      }}
    >
      Черновик
    </span>
  );
}

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return forms[1];
  return forms[2];
}
