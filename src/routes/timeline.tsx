import { createFileRoute } from "@tanstack/react-router";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, BookHeart, Smile } from "lucide-react";
import floralCats from "@/assets/floral-cats.jpeg";

export const Route = createFileRoute("/timeline")({ component: TimelinePage });

type Item = { kind: "diary" | "mood"; user_id: string; date: string; created_at: string; content: string };

function TimelinePage() { return <Gate><TimelineInner /></Gate>; }

function TimelineInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId).neq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["timeline", coupleId],
    queryFn: async () => {
      const [d, m] = await Promise.all([
        supabase.from("diary_entries").select("user_id, entry_date, content, created_at").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(80),
        supabase.from("moods").select("user_id, mood_date, mood, created_at").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(80),
      ]);
      const items: Item[] = [
        ...(d.data ?? []).map((e) => ({ kind: "diary" as const, user_id: e.user_id, date: e.entry_date, created_at: e.created_at, content: e.content })),
        ...(m.data ?? []).map((e) => ({ kind: "mood" as const, user_id: e.user_id, date: e.mood_date, created_at: e.created_at, content: e.mood })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));
      return items;
    },
  });

  const nameOf = (uid: string) => uid === user!.id ? "you" : partner?.display_name ?? "bear";
  const isMine = (uid: string) => uid === user!.id;

  return (
    <div className="space-y-10">
      <div className="relative rounded-[2rem] overflow-hidden border-2 border-rose/15 shadow-soft">
        <img src={floralCats} alt="our memories" className="w-full h-44 sm:h-56 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-cream/85 via-cream/40 to-transparent flex flex-col justify-center pl-6 sm:pl-10">
          <p className="font-hand text-2xl text-rose">a shared little life 🌷</p>
          <h1 className="font-script text-4xl sm:text-5xl text-earth">our memories</h1>
        </div>
      </div>

      {!items || items.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border-2 border-rose/15">
          <p className="text-5xl mb-3">🧸💕</p>
          <p className="font-script text-2xl text-earth/60">no memories yet — today is a sweet day to begin</p>
        </div>
      ) : (
        <div className="relative pl-10 border-l-2 border-dashed border-rose/30 space-y-8">
          {items.map((it, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[46px] top-3 size-6 rounded-full gradient-blush flex items-center justify-center shadow-card">
                <Heart className="size-3 fill-white text-white" />
              </span>
              <div className={`rounded-3xl p-5 border-2 shadow-card ${isMine(it.user_id) ? "bg-blush/15 border-rose/20" : "bg-honey/15 border-honey/30"}`}>
                <div className="flex items-center gap-2 font-hand text-lg text-rose mb-1">
                  {it.kind === "diary" ? <BookHeart className="size-4" /> : <Smile className="size-4" />}
                  {nameOf(it.user_id)} · {it.kind === "diary" ? "wrote" : "felt"} ·
                  <span className="text-earth/50 text-base">{new Date(it.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </div>
                {it.kind === "diary" ? (
                  <p className="font-script text-xl text-earth/85 line-clamp-4 whitespace-pre-wrap">{it.content}</p>
                ) : (
                  <p className="font-script text-2xl text-earth">felt <span className="text-rose">{it.content.toLowerCase()}</span> 💗</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
