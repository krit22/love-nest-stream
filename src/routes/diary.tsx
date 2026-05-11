import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/diary")({ component: DiaryPage });

type Entry = {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  created_at: string;
};

function DiaryPage() {
  return (
    <Gate>
      <DiaryInner />
    </Gate>
  );
}

function DiaryInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("couple_id", coupleId)
        .neq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["diary", coupleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("couple_id", coupleId)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      return (data ?? []) as Entry[];
    },
  });

  const myToday = entries?.find((e) => e.entry_date === today && e.user_id === user!.id);
  const theirToday = entries?.find((e) => e.entry_date === today && e.user_id !== user!.id);

  // Group past entries by date
  const past = (entries ?? []).filter((e) => e.entry_date < today);
  const grouped: Record<string, Entry[]> = {};
  for (const e of past) {
    (grouped[e.entry_date] ||= []).push(e);
  }

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      if (myToday) {
        const { error } = await supabase
          .from("diary_entries")
          .update({ content: draft, updated_at: new Date().toISOString() })
          .eq("id", myToday.id);
        if (error) throw error;
        toast.success("Updated.");
      } else {
        const { error } = await supabase
          .from("diary_entries")
          .insert({ couple_id: coupleId, user_id: user!.id, entry_date: today, content: draft });
        if (error) throw error;
        await supabase.rpc("bump_streak");
        toast.success("Saved. It locks at midnight.");
        setDraft("");
      }
      qc.invalidateQueries({ queryKey: ["diary", coupleId] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8 mt-4">
        <h1 className="font-serif text-3xl">Shared Diary</h1>
        <span className="text-xs uppercase tracking-widest opacity-40 italic">{formatDate(today)}</span>
      </div>

      {/* Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-earth/10 rounded-2xl overflow-hidden border border-earth/5 mb-16">
        <div className="bg-card p-8 relative">
          <div className="text-[10px] uppercase tracking-widest text-blush font-medium mb-6">Your entry — today</div>
          {myToday ? (
            <>
              <p className="font-serif text-lg leading-relaxed text-earth whitespace-pre-wrap">{myToday.content}</p>
              <textarea
                value={draft || myToday.content}
                onChange={(e) => setDraft(e.target.value)}
                className="hidden"
              />
              <div className="mt-6 pt-4 border-t border-earth/5 flex justify-between items-center">
                <span className="text-xs italic font-serif text-earth/40">Editable until midnight</span>
                <button
                  onClick={() => {
                    setDraft(myToday.content);
                    setTimeout(save, 0);
                  }}
                  className="text-xs uppercase tracking-widest text-earth/60 hover:text-earth"
                >
                  Edit
                </button>
              </div>
              {draft && draft !== myToday.content && (
                <div className="mt-4">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-full h-32 bg-secondary/30 rounded-lg p-3 font-serif text-base focus:outline-none"
                  />
                  <button onClick={save} disabled={saving} className="mt-2 px-4 py-2 rounded-full bg-earth text-parchment text-xs uppercase tracking-widest disabled:opacity-50">
                    Save changes
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What's true for you today?"
                className="w-full h-40 bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-serif text-lg leading-relaxed placeholder:text-earth/20 resize-none"
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-earth/5">
                <span className="text-xs italic font-serif text-earth/40">Locks at midnight</span>
                <button
                  onClick={save}
                  disabled={saving || !draft.trim()}
                  className="px-6 py-2 bg-earth text-parchment text-xs uppercase tracking-widest rounded-full hover:bg-earth/90 disabled:opacity-50"
                >
                  Save memory
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-secondary/40 p-8 relative">
          <div className="text-[10px] uppercase tracking-widest text-earth/40 mb-6">{partner?.display_name ?? "Partner"} — today</div>
          {theirToday ? (
            <p className="font-serif text-lg leading-relaxed text-earth whitespace-pre-wrap">{theirToday.content}</p>
          ) : (
            <p className="font-serif italic text-earth/40">Not written yet. They'll arrive when they're ready.</p>
          )}
        </div>
      </div>

      {/* Past */}
      {Object.keys(grouped).length > 0 && (
        <>
          <h2 className="font-serif text-2xl mb-6">Past memories <span className="text-xs not-italic uppercase tracking-widest text-earth/40 ml-3">🔒 locked</span></h2>
          <div className="space-y-px bg-earth/10 rounded-2xl overflow-hidden border border-earth/5">
            {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map((date) => {
              const day = grouped[date];
              const mine = day.find((e) => e.user_id === user!.id);
              const theirs = day.find((e) => e.user_id !== user!.id);
              return (
                <div key={date} className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-px bg-earth/10">
                  <div className="bg-card p-6 text-xs italic font-serif text-earth/50">{formatDate(date)}</div>
                  <div className="bg-card p-6">
                    <div className="text-[10px] uppercase tracking-widest text-earth/30 mb-2">You</div>
                    <p className="font-serif italic text-earth/70 whitespace-pre-wrap">{mine?.content ?? "—"}</p>
                  </div>
                  <div className="bg-card p-6">
                    <div className="text-[10px] uppercase tracking-widest text-earth/30 mb-2">{partner?.display_name ?? "Partner"}</div>
                    <p className="font-serif italic text-earth/70 whitespace-pre-wrap">{theirs?.content ?? "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
