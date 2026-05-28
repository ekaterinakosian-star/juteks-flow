import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppGate } from "@/components/AppGate";
import { getSettings, saveSettings } from "@/lib/storage";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Настройки — JUTEKS такси";
  }, []);
  return (
    <AppGate>
      <SettingsView />
    </AppGate>
  );
}

function SettingsView() {
  const nav = useNavigate();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setWebhookUrl(getSettings().webhookUrl);
  }, []);

  const save = () => {
    saveSettings({ webhookUrl: webhookUrl.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <button
        onClick={() => nav("/")}
        className="mb-4 inline-flex items-center gap-1 text-[14px] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Назад
      </button>

      <h1 className="text-[34px] font-medium leading-tight tracking-tight">Настройки</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Интеграция с корпоративными сервисами.
      </p>

      <div
        className="mt-8 rounded-3xl bg-card p-6 sm:p-8"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Webhook URL Power Automate
          </span>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://prod-..logic.azure.com/workflows/..."
            className="h-[52px] w-full rounded-xl border border-border bg-card px-4 text-[14px] outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5"
          />
          <p className="mt-2 text-[12px] text-muted-foreground">
            Ссылку предоставляет IT-отдел. Используется для отправки PDF в Teams/OneDrive.
          </p>
        </label>

        <button
          type="button"
          onClick={save}
          className="mt-6 h-[52px] w-full rounded-xl text-[15px] font-medium text-primary-foreground transition active:scale-[0.99]"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {saved ? "Сохранено ✓" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
