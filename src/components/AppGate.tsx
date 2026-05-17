import { useEffect, useState, type ReactNode } from "react";
import { getProfile, type Profile } from "@/lib/storage";
import { Onboarding } from "./Onboarding";
import { AppShell } from "./AppShell";

export function AppGate({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-screen" />;

  if (!profile) {
    return <Onboarding onDone={() => setProfile(getProfile())} />;
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
