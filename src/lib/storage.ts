export type Position =
  | "Генеральный директор"
  | "Заместитель генерального директора"
  | "Директор по финансам"
  | "Директор по производству"
  | "Директор по персоналу"
  | "Директор коммерческий"
  | "Директор по работе с федеральными сетями"
  | "Директор объектных продаж"
  | "Руководитель отдела / службы"
  | "Специалист";

export const POSITIONS: Position[] = [
  "Генеральный директор",
  "Заместитель генерального директора",
  "Директор по финансам",
  "Директор по производству",
  "Директор по персоналу",
  "Директор коммерческий",
  "Директор по работе с федеральными сетями",
  "Директор объектных продаж",
  "Руководитель отдела / службы",
  "Специалист",
];

export const BRANCHES = ["Добавить позже — TODO"];

export type PaymentMethod = "card" | "cash";

export type TripPurpose =
  | "Поездка в офис / на производство"
  | "Аэропорт / ж.д. вокзал"
  | "Встреча с клиентом"
  | "Поездка к контрагенту"
  | "Иное (согласовано с руководителем)";

export const TRIP_PURPOSES: TripPurpose[] = [
  "Поездка в офис / на производство",
  "Аэропорт / ж.д. вокзал",
  "Встреча с клиентом",
  "Поездка к контрагенту",
  "Иное (согласовано с руководителем)",
];

export interface Profile {
  fullName: string;
  position: Position;
  branch: string;
  email: string;
}

export type NoteStatus = "draft" | "sent" | "downloaded";

export interface TaxiNote {
  id: string;
  groupId?: string;
  status?: NoteStatus;
  date: string;
  departTime?: string;
  arriveTime?: string;
  from: string;
  to: string;
  purpose: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  counterparty?: string;
  isBusinessTrip?: boolean;
  businessTripStart?: string;
  businessTripEnd?: string;
  comment?: string;
  createdAt: string;
}

const PROFILE_KEY = "juteks.profile";
const NOTES_KEY = "juteks.notes";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function getNotes(): TaxiNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? (JSON.parse(raw) as TaxiNote[]) : [];
  } catch {
    return [];
  }
}

export function saveNote(note: TaxiNote) {
  const all = getNotes();
  all.unshift(note);
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

export function deleteNote(id: string) {
  const all = getNotes().filter((n) => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

export interface Settings {
  webhookUrl: string;
}

const SETTINGS_KEY = "juteks.settings";

export function getSettings(): Settings {
  if (typeof window === "undefined") return { webhookUrl: "" };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Settings) : { webhookUrl: "" };
  } catch {
    return { webhookUrl: "" };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts[0] || "Сотрудник";
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
