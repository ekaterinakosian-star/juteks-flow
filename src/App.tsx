import { HashRouter, Route, Routes, Link } from "react-router-dom";
import IndexPage from "./routes/index";
import HistoryPage from "./routes/history";
import SettingsPage from "./routes/settings";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
