import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Gate } from "@/components/Gate";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Gate>
      <HomeInner />
    </Gate>
  );
}

function HomeInner() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const coupleId = profile?.couple_id ?? null;
  const today = new Date().toISOString().slice(0, 10);

  const { data } = useQuery({
    queryKey: ["home", coupleId, today],
    enabled: !!coupleId,
    queryFn: async () => {
      const [streakRes, partnerRes, todaysEntriesRes, todaysMoodsRes] = await Promise.all([
        supabase.from("streaks").select("*").eq("couple_id", coupleId!).maybeSingle(),
        supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId!).neq("id", profile!.id).maybeSingle(),
        supabase.from("diary_entries").select("user_id").eq("couple_id", coupleId!).eq("entry_date", today),
        supabase.from("moods").select("user_id, mood").eq("couple_id", coupleId!).eq("mood_date", today),
      ]);
      return {
        streak: streakRes.data,
        partner: partnerRes.data,
        myEntry: todaysEntriesRes.data?.find((e) => e.user_id === profile!.id),
        partnerEntry: todaysEntriesRes.data?.find((e) => e.user_id !== profile!.id),
        myMood: todaysMoodsRes.data?.find((m) => m.user_id === profile!.id),
        partnerMood: todaysMoodsRes.data?.find((m) => m.user_id !== profile!.id),
      };
    },
  });

  useEffect(() => {
    document.title = "Home — Twofold";
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const partnerName = data?.partner?.display_name ?? "your partner";

  return (
    <div>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end mb-20 mt-4">
        <div className="md:col-span-2">
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-4">
            {greeting}, {profile?.display_name}. <br />
            <span className="italic text-blush">{data?.partner ? `${partnerName} is here too.` : "Waiting for your partner…"}</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 px-3 py-1 bg-sage/15 text-sage text-xs font-medium rounded-full">
              <span className="size-1.5 rounded-full bg-sage animate-pulse" />
              Connected
            </span>
            {data?.myMood && (
              <span className="text-xs italic font-serif text-earth/50">You feel: {data.myMood.mood}</span>
            )}
            {data?.partnerMood && (
              <span className="text-xs italic font-serif text-earth/50">{partnerName} feels: {data.partnerMood.mood}</span>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-7xl font-serif text-earth/15 leading-none mb-1">{data?.streak?.current_streak ?? 0}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-earth/50">Day streak of memories</div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <button
          onClick={() => navigate({ to: "/diary" })}
          className="text-left p-8 rounded-2xl bg-card border border-earth/5 hover:border-blush/40 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-3">Today's diary</div>
          <p className="font-serif text-xl text-earth">
            {data?.myEntry ? "You wrote today ✍️" : "You haven't written yet"}
          </p>
          <p className="font-serif italic text-sm text-earth/50 mt-1">
            {data?.partnerEntry ? `${partnerName} wrote today.` : `${partnerName} hasn't written yet.`}
          </p>
        </button>

        <button
          onClick={() => navigate({ to: "/mood" })}
          className="text-left p-8 rounded-2xl bg-card border border-earth/5 hover:border-blush/40 transition-colors"
        >
          <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-3">Today's mood</div>
          <p className="font-serif text-xl text-earth">
            {data?.myMood ? `You feel ${data.myMood.mood.toLowerCase()}` : "Share how you feel"}
          </p>
          <p className="font-serif italic text-sm text-earth/50 mt-1">
            {data?.partnerMood ? `${partnerName} feels ${data.partnerMood.mood.toLowerCase()}.` : `${partnerName} hasn't shared yet.`}
          </p>
        </button>
      </section>

      <p className="text-center font-serif italic text-sm text-earth/40">This space belongs only to you two.</p>
    </div>
  );
}
