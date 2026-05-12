import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Gate } from "@/components/Gate";
import { Heart, Copy } from "lucide-react";
import teddyRoses from "@/assets/teddy-roses.jpeg";
import bestVersions from "@/assets/best-versions.jpeg";

export const Route = createFileRoute("/link")({ component: LinkPage });

function genCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function LinkPage() { return <Gate requireCouple={false}><LinkInner /></Gate>; }

function LinkInner() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [myCode, setMyCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (profile?.couple_id) navigate({ to: "/" }); }, [profile, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("invite_codes").select("code, expires_at").eq("user_id", user.id).eq("used", false)
        .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setMyCode(data.code);
    })();
  }, [user]);

  useEffect(() => {
    const id = setInterval(async () => { await refreshProfile(); }, 4000);
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
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.rpc("join_partner", { p_code: joinCode.trim().toUpperCase() });
      if (error) throw error;
      toast.success("linked — welcome home 🧸💗");
      await refreshProfile();
      navigate({ to: "/" });
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <img src={teddyRoses} alt="teddy with roses" className="w-44 mx-auto rounded-3xl shadow-soft border-4 border-white animate-float" />
          <p className="font-hand text-2xl text-rose mt-4">find your honey 💌</p>
          <h1 className="font-script text-5xl text-earth">just the two of us</h1>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-card rounded-3xl p-7 border-2 border-rose/15 shadow-card">
            <p className="font-hand text-xl text-rose mb-4 flex items-center gap-2"><Heart className="size-4 fill-rose" /> your invite code</p>
            {myCode ? (
              <>
                <div className="font-script text-5xl tracking-[0.2em] text-earth my-6 text-center select-all bg-blush/15 rounded-2xl py-4">{myCode}</div>
                <button onClick={() => { navigator.clipboard.writeText(myCode); toast.success("copied 💗"); }}
                  className="w-full py-3 rounded-full bg-blush/20 text-rose font-semibold hover:bg-blush/30 transition flex items-center justify-center gap-2">
                  <Copy className="size-4" /> copy
                </button>
                <p className="font-hand text-sm text-earth/50 text-center mt-3">send this to your bear · expires in 24h</p>
              </>
            ) : (
              <button onClick={createCode} disabled={busy}
                className="w-full py-3.5 rounded-full gradient-blush text-white font-semibold shadow-card hover:scale-[1.02] transition disabled:opacity-50">
                generate code 🌷
              </button>
            )}
          </div>

          <div className="bg-card rounded-3xl p-7 border-2 border-rose/15 shadow-card">
            <p className="font-hand text-xl text-rose mb-4 flex items-center gap-2"><Heart className="size-4 fill-rose" /> join your bear</p>
            <form onSubmit={join} className="space-y-4">
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE" maxLength={8}
                className="w-full bg-blush/10 rounded-2xl py-4 font-script text-3xl tracking-[0.2em] text-center text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
              <button type="submit" disabled={busy || !joinCode}
                className="w-full py-3.5 rounded-full gradient-blush text-white font-semibold shadow-card hover:scale-[1.02] transition disabled:opacity-50">
                come home 💗
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 rounded-3xl overflow-hidden shadow-card border-4 border-white max-w-sm mx-auto">
          <img src={bestVersions} alt="be the best" className="w-full" />
        </div>
      </div>
    </div>
  );
}
