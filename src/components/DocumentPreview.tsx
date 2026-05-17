import { numberToRubles } from "@/lib/numberToWords";
import type { PaymentMethod, Profile } from "@/lib/storage";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export function formatDocDate(iso: string): string {
  if (!iso) return "«__» __________ 202__г.";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_RU[d.getMonth()];
  const year = String(d.getFullYear()).slice(2);
  return `«${day}» ${month} 20${year}г.`;
}

export interface PreviewTrip {
  id: string;
  date: string;
  departTime?: string;
  arriveTime?: string;
  from: string;
  to: string;
  amount: number;
  payment: PaymentMethod;
  purpose: string;
  counterparty?: string;
  isBusinessTrip?: boolean;
  bizStart?: string;
  bizEnd?: string;
}

const needsCp = (p: string) =>
  p === "Встреча с клиентом" || p === "Поездка к контрагенту";

export function DocumentPreview({
  trips,
  profile,
  documentDate,
  id = "document-preview",
}: {
  trips: PreviewTrip[];
  profile: Profile | null;
  documentDate?: string;
  id?: string;
}) {
  const dates = trips.map((t) => t.date).filter(Boolean).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const docDate = documentDate || new Date().toISOString().slice(0, 10);
  const multiple = trips.length > 1;

  return (
    <div
      id={id}
      className="rounded-3xl bg-card p-6 sm:p-10"
      style={{
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
      }}
    >
      <div className="ml-auto max-w-[60%] text-right text-[11px] leading-snug text-foreground/80">
        к Положению о порядке использования услуг такси в служебных целях работниками ООО «Ютекс Ру»
      </div>

      <h2 className="mt-8 text-center text-[20px] font-bold tracking-tight text-foreground">
        Служебная записка по расходам на такси
      </h2>
      <p className="mt-1 text-center text-[14px] text-foreground/80">
        {multiple ? "(период поездки)" : "(служебная поездка)"}
      </p>

      {multiple && (
        <p className="mt-4 text-center text-[14px]">
          За период с {formatDocDate(minDate)} по {formatDocDate(maxDate)}
        </p>
      )}

      <p className="mt-6 text-right text-[14px]">Дата документа: {formatDocDate(docDate)}</p>

      <div className="mt-6 space-y-1 text-[14px]">
        <p><strong>ФИО работника:</strong> {profile?.fullName || "—"}</p>
        <p><strong>Должность:</strong> {profile?.position || "—"}</p>
      </div>

      <div className="mt-6 space-y-6">
        {trips.map((t, i) => (
          <div key={t.id} className="text-[14px] leading-relaxed">
            <p className="font-semibold">
              Поездка {i + 1}. Дата поездки: {formatDocDate(t.date)}
            </p>
            <p>
              Дата и время поездки на такси {formatDocDate(t.date)}{" "}
              {t.departTime || "__:__"} — {t.arriveTime || "__:__"}
            </p>
            <p>
              Расходы на такси в сумме: {t.amount.toLocaleString("ru-RU")} ₽{" "}
              <em>({numberToRubles(t.amount) || "—"})</em>
            </p>
            <p>
              Цель поездки: {t.purpose || "—"}
              {needsCp(t.purpose) && t.counterparty ? ` (${t.counterparty})` : ""}
            </p>
            <p>Командировка / Служебная поездка: {t.isBusinessTrip ? "Да" : "Нет"}</p>
            {t.isBusinessTrip && (
              <p>
                Даты командировки: с {formatDocDate(t.bizStart || "")} по {formatDocDate(t.bizEnd || "")}
              </p>
            )}
            <p>Способ оплаты: {t.payment === "card" ? "Банковская карта" : "Наличные"}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-2 text-[14px]">
        <p><strong>Приложение:</strong> Чек / БСО</p>
        <p className="pt-4">Подпись работника: _____________ &nbsp;&nbsp; Дата: _____________</p>
      </div>

      <div className="mt-8 space-y-1 text-[11px] italic leading-snug text-muted-foreground">
        <p>*Если цель поездки — встреча с клиентом, указывать компанию и ФИО представителя.</p>
        <p>**Чеки/БСО оформляются в соответствии с законодательством РФ.</p>
        <p>***Расходы возмещаются при предоставлении правильно оформленного чека/БСО.</p>
      </div>
    </div>
  );
}
