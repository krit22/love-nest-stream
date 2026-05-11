import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Nav } from "./Nav";

export function Gate({ children, requireCouple = true }: { children: ReactNode; requireCouple?: boolean }) {
  const { loading, session, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    if (requireCouple && profile && !profile.couple_id) {
      navigate({ to: "/link" });
    }
  }, [loading, session, profile, requireCouple, navigate]);

  if (loading || !session || (requireCouple && !profile?.couple_id)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-serif italic text-earth/40">A quiet moment…</p>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 sm:px-8 pb-24">{children}</main>
    </>
  );
}
