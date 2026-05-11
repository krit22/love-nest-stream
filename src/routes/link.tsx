import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Gate } from "@/components/Gate";

export const Route = createFileRoute("/link")({ component: LinkPage });

function genCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function LinkPage() {
  return (
    <Gate requireCouple={false}>
      <LinkInner />
    </Gate>
  );
}

function LinkInner() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [myCode, setMyCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.couple_id) navigate({ to: "/" });
  }, [profile, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("invite_codes")
        .select("code, expires_at")
        .eq("user_id", user.id)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setMyCode(data.code);
    })();
  }, [user]);

  // Poll for couple_id every 4s in case partner joined
  useEffect(() => {
    const id = setInterval(async () => {
      await refreshProfile();
    }, 4000);
    return () => clearInterval(id);
  }, [refreshProfile]);

  const createCode = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const code = genCode();
      const { error } = await supabase.from("invite_codes").insert({ code, user_id: user.id });
      if (error) throw error;
      setMyCode(code);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.rpc("join_partner", { p_code: joinCode.trim().toUpperCase() });
      if (error) throw error;
      toast.success("You're linked. Welcome home.");
      await refreshProfile();
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-earth">Find your person.</h1>
          <p className="mt-3 font-serif italic text-earth/60">Share your code, or enter theirs.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-px bg-earth/10 rounded-3xl overflow-hidden border border-earth/5">
          <div className="bg-card p-8">
            <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-4">Your invite code</div>
            {myCode ? (
              <>
                <div className="font-serif text-4xl tracking-[0.3em] text-earth my-6 text-center select-all">{myCode}</div>
                <p className="text-xs italic font-serif text-earth/50 text-center">Send this to your partner. Expires in 24h.</p>
              </>
            ) : (
              <button
                onClick={createCode}
                disabled={busy}
                className="w-full py-3 rounded-full bg-earth text-parchment text-xs uppercase tracking-widest hover:bg-earth/90 transition-colors disabled:opacity-50"
              >
                Generate code
              </button>
            )}
          </div>

          <div className="bg-card p-8">
            <div className="text-[10px] uppercase tracking-widest text-blush mb-4">Join your partner</div>
            <form onSubmit={join} className="space-y-4">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                maxLength={8}
                className="w-full bg-transparent border-b border-earth/10 py-3 font-serif text-2xl tracking-[0.2em] text-center focus:outline-none focus:border-blush"
              />
              <button
                type="submit"
                disabled={busy || !joinCode}
                className="w-full py-3 rounded-full border border-earth/20 text-earth text-xs uppercase tracking-widest hover:bg-earth/5 transition-colors disabled:opacity-50"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-8 font-serif italic text-sm text-earth/40">
          Once linked, this space belongs only to the two of you.
        </p>
      </div>
    </div>
  );
}
