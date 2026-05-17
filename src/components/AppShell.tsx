import { Link, useLocation } from "@tanstack/react-router";
import { Pencil, ClipboardList, Settings as SettingsIcon } from "lucide-react";
import { Logo } from "./Logo";
import { getInitials, type Profile } from "@/lib/storage";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { to: "/", label: "Новая записка", icon: Pencil, match: path === "/" },
    { to: "/history", label: "История", icon: ClipboardList, match: path.startsWith("/history") },
  ];

  return (
    <div className="min-h-screen pb-[92px]">
      <header
        className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl"
        style={{ backgroundColor: "color-mix(in oklch, var(--color-background) 80%, transparent)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Настройки"
            >
              <SettingsIcon size={18} strokeWidth={1.75} />
            </Link>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-[12px] font-medium text-foreground"
              style={{ boxShadow: "inset 0 0 0 1px var(--color-border)" }}
              title={profile.fullName}
            >
              {getInitials(profile.fullName)}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 backdrop-blur-xl"
        style={{
          backgroundColor: "color-mix(in oklch, var(--color-card) 85%, transparent)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="mx-auto flex max-w-3xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition"
                style={{ color: t.match ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
              >
                <Icon size={22} strokeWidth={1.75} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
