import { createFileRoute } from "@tanstack/react-router";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/timeline")({ component: TimelinePage });

type Item = { kind: "diary" | "mood"; user_id: string; date: string; created_at: string; content: string };

function TimelinePage() {
  return <Gate><TimelineInner /></Gate>;
}

function TimelineInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles").select("id, display_name").eq("couple_id", coupleId).neq("id", user!.id).maybeSingle();
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

  const nameOf = (uid: string) => uid === user!.id ? "You" : partner?.display_name ?? "Partner";

  return (
    <div>
      <div className="mb-10 mt-4">
        <h1 className="font-serif text-3xl">Our timeline</h1>
        <p className="font-serif italic text-earth/50 mt-1">A shared life stream.</p>
      </div>

      {!items || items.length === 0 ? (
        <p className="font-serif italic text-earth/40 text-center py-16">No memories yet. Today is a good day to begin.</p>
      ) : (
        <div className="relative pl-8 border-l border-earth/10 space-y-10">
          {items.map((it, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[34px] top-2 size-3 rounded-full bg-blush ring-4 ring-background" />
              <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-2">
                {nameOf(it.user_id)} · {it.kind === "diary" ? "Diary" : "Mood"} · {new Date(it.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="bg-card border border-earth/5 rounded-2xl p-6">
                {it.kind === "diary" ? (
                  <p className="font-serif text-lg italic text-earth/80 line-clamp-4 whitespace-pre-wrap">{it.content}</p>
                ) : (
                  <p className="font-serif text-xl text-earth"><span className="text-blush">●</span> Felt {it.content.toLowerCase()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
