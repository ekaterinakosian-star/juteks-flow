import { formatDocDate, type PreviewTrip } from "@/components/DocumentPreview";
import { numberToRubles } from "@/lib/numberToWords";
import { getCompanyByBranch, type Profile } from "@/lib/storage";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const needsCp = (p: string) =>
  p === "Встреча с клиентом" || p === "Поездка к контрагенту";

export function buildNoteWordHtml(
  trips: PreviewTrip[],
  profile: Profile | null,
  documentDate?: string,
): string {
  const dates = trips.map((t) => t.date).filter(Boolean).sort();
  const minDate = dates[0] || "";
  const maxDate = dates[dates.length - 1] || "";
  const docDate = documentDate || new Date().toISOString().slice(0, 10);
  const multiple = trips.length > 1;
  const company = getCompanyByBranch(profile?.branch || "") || "ООО «Ютекс Ру»";

  const tripsHtml = trips
    .map(
      (t, i) => `
    <p style="margin:0 0 2pt 0"><b>Поездка ${i + 1}. Дата поездки: ${formatDocDate(t.date)}</b></p>
    <p style="margin:0">Дата и время поездки на такси ${formatDocDate(t.date)} ${esc(t.departTime || "__:__")} — ${esc(t.arriveTime || "__:__")}</p>
    <p style="margin:0">Маршрут: ${esc(t.from || "—")} — ${esc(t.to || "—")}</p>
    <p style="margin:0">Расходы на такси в сумме: ${t.amount.toLocaleString("ru-RU")} руб. (<i>${esc(numberToRubles(t.amount) || "—")}</i>)</p>
    <p style="margin:0">Цель поездки: ${esc(t.purpose || "—")}${needsCp(t.purpose) && t.counterparty ? ` (${esc(t.counterparty)})` : ""}</p>
    <p style="margin:0">Командировка / Служебная поездка: ${t.isBusinessTrip ? "Да" : "Нет"}</p>
    ${
      t.isBusinessTrip
        ? `<p style="margin:0">Даты командировки: с ${formatDocDate(t.bizStart || "")} по ${formatDocDate(t.bizEnd || "")}</p>`
        : ""
    }
    <p style="margin:0 0 12pt 0">Способ оплаты: ${t.payment === "card" ? "Банковская карта" : "Наличные"}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Служебная записка по расходам на такси</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page { size: A4; margin: 20mm; }
body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; }
p { margin: 0 0 6pt 0; }
</style>
</head>
<body>
<p style="text-align:right;font-size:9pt;margin-bottom:18pt">к Положению о порядке использования услуг такси в служебных целях работниками ${esc(company)}</p>
<p style="text-align:center;font-size:14pt;font-weight:bold;margin-bottom:2pt">Служебная записка по расходам на такси</p>
<p style="text-align:center;font-weight:bold">${esc(company)}</p>
<p style="text-align:center">${multiple ? "(период поездки)" : "(служебная поездка)"}</p>
${multiple ? `<p style="text-align:center">За период с ${formatDocDate(minDate)} по ${formatDocDate(maxDate)}</p>` : ""}
<p style="text-align:right">Дата документа: ${formatDocDate(docDate)}</p>
<p style="margin:0"><b>ФИО работника:</b> ${esc(profile?.fullName || "—")}</p>
<p style="margin:0"><b>Должность:</b> ${esc(profile?.position || "—")}</p>
<p style="margin:0 0 12pt 0"><b>Организация работника:</b> ${esc(company)}</p>
${tripsHtml}
<p><b>Приложение:</b> Чек / БСО</p>
<p style="margin-top:18pt">Подпись работника: _____________ &nbsp;&nbsp; Дата: _____________</p>
<p style="font-size:8pt;font-style:italic;margin-top:18pt">*Если цель поездки — встреча с клиентом, указывать компанию и ФИО представителя.<br>
**Чеки/БСО оформляются в соответствии с законодательством РФ.<br>
***Расходы возмещаются при предоставлении правильно оформленного чека/БСО.</p>
</body>
</html>`;
}

export function noteToWordBlob(
  trips: PreviewTrip[],
  profile: Profile | null,
  documentDate?: string,
): Blob {
  const html = buildNoteWordHtml(trips, profile, documentDate);
  return new Blob(["\ufeff", html], { type: "application/msword" });
}
