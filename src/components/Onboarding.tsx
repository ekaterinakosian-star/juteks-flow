import { useState } from "react";
import { POSITIONS, BRANCHES, saveProfile, type Position } from "@/lib/storage";
import { Logo } from "./Logo";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState<Position>(POSITIONS[0]);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError("Укажите ФИО");
    if (!email.trim()) return setError("Укажите корпоративный email");
    if (!email.endsWith("@ifloor.pro"))
      return setError("Email должен быть в домене @ifloor.pro");
    saveProfile({ fullName: fullName.trim(), position, branch, email: email.trim() });
    onDone();
  };

  const fieldClass =
    "w-full rounded-xl border border-border bg-card px-4 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div
          className="rounded-3xl bg-card p-8 sm:p-10"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 20px 60px -20px rgba(0,0,0,0.12)" }}
        >
          <h1 className="text-[28px] font-medium leading-tight tracking-tight text-foreground">
            Добро пожаловать
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Заполните профиль, чтобы начать учёт расходов на такси.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="ФИО">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className={`${fieldClass} h-[52px]`}
                autoFocus
              />
            </Field>

            <Field label="Должность">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className={`${fieldClass} h-[52px] appearance-none pr-10`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236E6E73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                }}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Филиал / Региональное подразделение"
              hint={
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                >
                  Обновить позже
                </span>
              }
            >
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className={`${fieldClass} h-[52px] appearance-none pr-10`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236E6E73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                }}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Корпоративный email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="i.ivanov@ifloor.pro"
                className={`${fieldClass} h-[52px]`}
              />
            </Field>

            {error && (
              <p className="text-[13px]" style={{ color: "var(--color-primary)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-2 h-[52px] w-full rounded-xl text-[15px] font-medium text-primary-foreground transition active:scale-[0.99]"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Сохранить и начать
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
