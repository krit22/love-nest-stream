import { createFileRoute } from "@tanstack/react-router";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bearsKiss from "@/assets/bears-kiss.jpeg";

export const Route = createFileRoute("/mood")({ component: MoodPage });

const MOODS = [
  { key: "Happy", emoji: "🥰", color: "oklch(0.88 0.1 50)" },
  { key: "Sad", emoji: "🥺", color: "oklch(0.78 0.06 240)" },
  { key: "Angry", emoji: "😤", color: "oklch(0.75 0.16 25)" },
  { key: "Lonely", emoji: "🫂", color: "oklch(0.7 0.05 280)" },
  { key: "Missing you", emoji: "💌", color: "oklch(0.82 0.1 15)" },
  { key: "Stressed", emoji: "😮‍💨", color: "oklch(0.75 0.1 60)" },
  { key: "Peaceful", emoji: "🌷", color: "oklch(0.82 0.06 150)" },
  { key: "Grateful", emoji: "✨", color: "oklch(0.85 0.08 110)" },
];

function MoodPage() { return <Gate><MoodInner /></Gate>; }

function MoodInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId).neq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: moods } = useQuery({
    queryKey: ["moods-today", coupleId, today],
    queryFn: async () => {
      const { data } = await supabase.from("moods").select("user_id, mood").eq("couple_id", coupleId).eq("mood_date", today);
      return data ?? [];
    },
  });

  const myMood = moods?.find((m) => m.user_id === user!.id);
  const theirMood = moods?.find((m) => m.user_id !== user!.id);

  const setMood = async (mood: string) => {
    try {
      if (myMood) {
        const { error } = await supabase.from("moods").update({ mood }).eq("user_id", user!.id).eq("mood_date", today);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("moods").insert({ couple_id: coupleId, user_id: user!.id, mood_date: today, mood });
        if (error) throw error;
        await supabase.rpc("bump_streak");
      }
      qc.invalidateQueries({ queryKey: ["moods-today", coupleId, today] });
      qc.invalidateQueries({ queryKey: ["home"] });
      toast.success("felt and shared 💗");
    } catch (e: any) { toast.error(e.message); }
  };

  const message = (() => {
    if (!myMood || !theirMood) return null;
    if (myMood.mood === theirMood.mood) return `you both feel ${myMood.mood.toLowerCase()} — you're not alone in it 🫂`;
    if (["Sad", "Lonely", "Stressed"].includes(myMood.mood) && ["Sad", "Lonely", "Stressed"].includes(theirMood.mood))
      return "it's a heavy day for you both. be gentle 🌷";
    return `you feel ${myMood.mood.toLowerCase()}, they feel ${theirMood.mood.toLowerCase()} — a tiny message could help 💌`;
  })();

  return (
    <div className="space-y-10">
      <div className="text-center">
        <p className="font-hand text-2xl text-rose">how's your tiny heart today?</p>
        <h1 className="font-script text-5xl text-earth">today's mood 🌸</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {MOODS.map((m) => {
          const active = myMood?.mood === m.key;
          return (
            <button key={m.key} onClick={() => setMood(m.key)}
              className={`relative p-5 rounded-3xl border-2 transition-all text-left ${active ? "border-rose bg-blush/20 scale-105 shadow-soft" : "border-rose/15 bg-card hover:border-rose/40 hover:-translate-y-1"}`}>
              <div className="text-3xl mb-2">{m.emoji}</div>
              <span className="font-hand text-xl text-earth">{m.key}</span>
              <span className="absolute top-3 right-3 size-3 rounded-full" style={{ backgroundColor: m.color }} />
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="bg-card rounded-3xl p-6 text-center border-2 border-rose/15 shadow-card">
          <p className="font-hand text-lg text-rose mb-2">you 💗</p>
          <p className="text-4xl mb-1">{MOODS.find(m => m.key === myMood?.mood)?.emoji ?? "💭"}</p>
          <p className="font-script text-2xl text-earth">{myMood?.mood ?? "not yet"}</p>
        </div>
        <img src={bearsKiss} alt="bears" className="size-28 rounded-2xl object-cover shadow-card mx-auto animate-heartbeat" />
        <div className="bg-card rounded-3xl p-6 text-center border-2 border-rose/15 shadow-card">
          <p className="font-hand text-lg text-rose mb-2">{partner?.display_name ?? "bear"} 🧸</p>
          <p className="text-4xl mb-1">{MOODS.find(m => m.key === theirMood?.mood)?.emoji ?? "💭"}</p>
          <p className="font-script text-2xl text-earth">{theirMood?.mood ?? "not yet"}</p>
        </div>
      </div>

      {message && (
        <div className="bg-blush/15 rounded-3xl p-6 border-2 border-rose/20 shadow-card text-center">
          <p className="font-hand text-2xl text-rose">{message}</p>
        </div>
      )}
    </div>
  );
}
