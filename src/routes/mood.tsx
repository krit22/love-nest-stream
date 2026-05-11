import { createFileRoute } from "@tanstack/react-router";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/mood")({ component: MoodPage });

const MOODS = [
  { key: "Happy", color: "oklch(0.85 0.12 90)" },
  { key: "Sad", color: "oklch(0.7 0.06 240)" },
  { key: "Angry", color: "oklch(0.65 0.18 30)" },
  { key: "Lonely", color: "oklch(0.6 0.04 280)" },
  { key: "Missing you", color: "oklch(0.78 0.08 20)" },
  { key: "Stressed", color: "oklch(0.68 0.1 60)" },
  { key: "Peaceful", color: "oklch(0.78 0.05 150)" },
  { key: "Grateful", color: "oklch(0.82 0.08 110)" },
];

function MoodPage() {
  return <Gate><MoodInner /></Gate>;
}

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
      toast.success("Felt and shared.");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const message = (() => {
    if (!myMood || !theirMood) return null;
    if (myMood.mood === theirMood.mood) return `You both feel ${myMood.mood.toLowerCase()}. You're not alone in it.`;
    if (["Sad", "Lonely", "Stressed"].includes(myMood.mood) && ["Sad", "Lonely", "Stressed"].includes(theirMood.mood))
      return "It's a heavy day for you both. Be gentle.";
    return `You feel ${myMood.mood.toLowerCase()}, they feel ${theirMood.mood.toLowerCase()}. A small message could help.`;
  })();

  return (
    <div>
      <div className="mb-10 mt-4">
        <h1 className="font-serif text-3xl">Today's mood</h1>
        <p className="font-serif italic text-earth/50 mt-1">One small word, shared.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {MOODS.map((m) => {
          const active = myMood?.mood === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              className={`p-5 rounded-2xl border transition-all text-left ${active ? "border-blush bg-blush/10 scale-[1.02]" : "border-earth/10 bg-card hover:border-earth/30"}`}
            >
              <span className="block size-3 rounded-full mb-3" style={{ backgroundColor: m.color }} />
              <span className="font-serif text-lg text-earth">{m.key}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-px bg-earth/10 rounded-2xl overflow-hidden border border-earth/5">
        <div className="bg-card p-6 text-center">
          <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-2">You</div>
          <div className="font-serif text-2xl italic text-earth">{myMood?.mood ?? "—"}</div>
        </div>
        <div className="bg-card p-6 text-center">
          <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-2">{partner?.display_name ?? "Partner"}</div>
          <div className="font-serif text-2xl italic text-earth">{theirMood?.mood ?? "—"}</div>
        </div>
      </div>

      {message && (
        <p className="text-center mt-8 font-serif italic text-earth/60">{message}</p>
      )}
    </div>
  );
}
