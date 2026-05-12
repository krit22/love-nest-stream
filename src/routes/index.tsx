import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Gate } from "@/components/Gate";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, BookHeart, Smile, Clock } from "lucide-react";
import teddyBalloons from "@/assets/teddy-balloons.jpeg";
import bearsHearts from "@/assets/bears-hearts.jpeg";
import bearsKiss from "@/assets/bears-kiss.jpeg";
import teddyRainbow from "@/assets/teddy-rainbow-balloons.jpeg";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Gate><HomeInner /></Gate>;
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

  useEffect(() => { document.title = "Home — Honey & Bear 🧸"; }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const partnerName = data?.partner?.display_name ?? "your bear";

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] gradient-romantic p-6 sm:p-10 shadow-soft border-2 border-rose/15">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="relative z-10">
            <p className="font-hand text-2xl text-rose mb-1">{greeting}, sweet bear 🧸</p>
            <h1 className="font-script text-4xl sm:text-5xl text-earth leading-tight">
              Hi {profile?.display_name},<br />
              <span className="text-rose">{data?.partner ? `${partnerName} is here too 💗` : "waiting for your honey…"}</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/70 rounded-full text-xs font-medium text-rose shadow-card">
                <Heart className="size-3 fill-rose animate-heartbeat" /> Connected
              </span>
              {data?.myMood && <span className="px-3 py-1.5 bg-white/70 rounded-full text-xs font-hand text-lg text-earth/70">you · {data.myMood.mood}</span>}
              {data?.partnerMood && <span className="px-3 py-1.5 bg-white/70 rounded-full text-xs font-hand text-lg text-earth/70">{partnerName} · {data.partnerMood.mood}</span>}
            </div>
          </div>
          <img src={teddyBalloons} alt="Teddy with balloons" className="w-48 sm:w-60 rounded-3xl shadow-soft border-4 border-white animate-float justify-self-center" />
        </div>
      </section>

      {/* Streak banner */}
      <section className="relative overflow-hidden rounded-3xl bg-card border-2 border-rose/15 p-6 shadow-card flex items-center gap-5">
        <img src={bearsHearts} alt="Bears" className="size-24 rounded-2xl object-cover shadow-card" />
        <div className="flex-1">
          <p className="font-hand text-xl text-rose">our love streak</p>
          <p className="font-script text-5xl text-earth leading-none">{data?.streak?.current_streak ?? 0} <span className="text-rose">days</span></p>
          <p className="text-sm text-earth/60 mt-1">of showing up for each other 💕</p>
        </div>
        <div className="hidden sm:flex flex-col items-end font-hand text-xl text-rose/70">
          <span>longest: {data?.streak?.longest_streak ?? 0}</span>
          <span>🌷</span>
        </div>
      </section>

      {/* Quick cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <button onClick={() => navigate({ to: "/diary" })}
          className="group relative overflow-hidden text-left p-7 rounded-3xl bg-card border-2 border-rose/15 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <span className="size-10 rounded-2xl gradient-blush flex items-center justify-center"><BookHeart className="size-5 text-white" /></span>
            <span className="font-hand text-2xl text-rose">today's diary</span>
          </div>
          <p className="font-script text-2xl text-earth">{data?.myEntry ? "you wrote today ✍️💌" : "write a love note 💕"}</p>
          <p className="font-hand text-lg text-earth/60 mt-1">{data?.partnerEntry ? `${partnerName} wrote too 🥰` : `${partnerName} hasn't written yet…`}</p>
        </button>

        <button onClick={() => navigate({ to: "/mood" })}
          className="group relative overflow-hidden text-left p-7 rounded-3xl bg-card border-2 border-rose/15 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <span className="size-10 rounded-2xl gradient-blush flex items-center justify-center"><Smile className="size-5 text-white" /></span>
            <span className="font-hand text-2xl text-rose">today's mood</span>
          </div>
          <p className="font-script text-2xl text-earth">{data?.myMood ? `you feel ${data.myMood.mood.toLowerCase()}` : "share how you feel 🌸"}</p>
          <p className="font-hand text-lg text-earth/60 mt-1">{data?.partnerMood ? `${partnerName} feels ${data.partnerMood.mood.toLowerCase()} 💗` : `${partnerName} hasn't shared yet…`}</p>
        </button>
      </section>

      {/* Memory tease */}
      <section className="grid sm:grid-cols-3 gap-4">
        <button onClick={() => navigate({ to: "/timeline" })} className="col-span-2 relative rounded-3xl overflow-hidden p-6 bg-card border-2 border-rose/15 shadow-card text-left hover:shadow-soft transition-all">
          <div className="flex items-center gap-3 mb-3">
            <span className="size-10 rounded-2xl gradient-blush flex items-center justify-center"><Clock className="size-5 text-white" /></span>
            <span className="font-hand text-2xl text-rose">our memories</span>
          </div>
          <p className="font-script text-xl text-earth">every little day, gathered together 🌷</p>
        </button>
        <div className="rounded-3xl overflow-hidden shadow-card border-4 border-white">
          <img src={bearsKiss} alt="Bears kiss" className="w-full h-full object-cover" />
        </div>
      </section>

      {/* Sweet quote with rainbow teddy */}
      <section className="relative rounded-3xl overflow-hidden bg-card border-2 border-rose/15 shadow-card grid sm:grid-cols-[auto_1fr] items-center gap-4 p-6">
        <img src={teddyRainbow} alt="Teddy with rainbow balloons" className="w-40 sm:w-48 rounded-2xl object-cover" />
        <div className="font-hand text-2xl text-earth/80 leading-snug">
          "in every quiet day, in every distant night —<br />
          <span className="text-rose font-script text-3xl">we're still each other's home.</span>"
          <p className="text-sm font-sans text-earth/40 mt-3 not-italic">— this little space belongs only to you two 💕</p>
        </div>
      </section>
    </div>
  );
}
