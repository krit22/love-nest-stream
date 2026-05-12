import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Lock } from "lucide-react";
import diaryBear from "@/assets/diary-bear.jpeg";
import girlCorazon from "@/assets/girl-corazon.jpeg";
import adventureJournal from "@/assets/adventure-journal.jpeg";

export const Route = createFileRoute("/diary")({ component: DiaryPage });

type Entry = { id: string; user_id: string; entry_date: string; content: string; created_at: string; };

function DiaryPage() { return <Gate><DiaryInner /></Gate>; }

function DiaryInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId).neq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["diary", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("diary_entries").select("*").eq("couple_id", coupleId)
        .order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(60);
      return (data ?? []) as Entry[];
    },
  });

  const myToday = entries?.find((e) => e.entry_date === today && e.user_id === user!.id);
  const theirToday = entries?.find((e) => e.entry_date === today && e.user_id !== user!.id);

  const past = (entries ?? []).filter((e) => e.entry_date < today);
  const grouped: Record<string, Entry[]> = {};
  for (const e of past) (grouped[e.entry_date] ||= []).push(e);

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      if (myToday) {
        const { error } = await supabase.from("diary_entries").update({ content: draft, updated_at: new Date().toISOString() }).eq("id", myToday.id);
        if (error) throw error;
        toast.success("Updated 💗");
      } else {
        const { error } = await supabase.from("diary_entries").insert({ couple_id: coupleId, user_id: user!.id, entry_date: today, content: draft });
        if (error) throw error;
        await supabase.rpc("bump_streak");
        toast.success("Saved. It locks at midnight 🔒💕");
        setDraft("");
      }
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["diary", coupleId] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-10">
      {/* Header banner */}
      <div className="relative rounded-[2rem] overflow-hidden border-2 border-rose/15 shadow-soft">
        <img src={diaryBear} alt="My Romantic Diary" className="w-full h-44 sm:h-56 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-cream/80 via-cream/30 to-transparent flex flex-col justify-center pl-6 sm:pl-10">
          <p className="font-hand text-2xl text-rose">today's love note 💌</p>
          <h1 className="font-script text-4xl sm:text-5xl text-earth">{formatDate(today)}</h1>
        </div>
      </div>

      {/* Today entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* My entry */}
        <div className="relative bg-card rounded-3xl p-7 border-2 border-rose/15 shadow-card overflow-hidden">
          <div className="absolute top-3 right-4 font-hand text-xl text-rose flex items-center gap-1"><Heart className="size-4 fill-rose" /> you</div>
          <p className="font-hand text-xl text-rose/70 mb-3">My entry — today</p>
          {myToday && !editing ? (
            <>
              <p className="font-script text-2xl leading-relaxed text-earth whitespace-pre-wrap min-h-[8rem]">{myToday.content}</p>
              <div className="mt-5 pt-4 border-t border-dashed border-rose/20 flex justify-between items-center">
                <span className="font-hand text-sm text-earth/50">editable until midnight 🌙</span>
                <button onClick={() => { setDraft(myToday.content); setEditing(true); }}
                  className="font-hand text-lg text-rose hover:text-earth">edit ✏️</button>
              </div>
            </>
          ) : (
            <>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder="dear love…  ✍️💕"
                className="w-full h-40 bg-blush/10 rounded-2xl p-4 font-script text-2xl leading-relaxed text-earth placeholder:text-earth/30 focus:outline-none focus:ring-2 focus:ring-rose/40 resize-none" />
              <div className="flex justify-between items-center mt-4">
                <span className="font-hand text-sm text-earth/50 flex items-center gap-1"><Lock className="size-3" /> locks at midnight</span>
                <div className="flex gap-2">
                  {editing && <button onClick={() => setEditing(false)} className="font-hand text-lg text-earth/50 px-3">cancel</button>}
                  <button onClick={save} disabled={saving || !draft.trim()}
                    className="px-6 py-2.5 gradient-blush text-white text-sm font-semibold rounded-full shadow-card hover:scale-105 transition disabled:opacity-50">
                    save memory 💗
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Their entry */}
        <div className="relative bg-card rounded-3xl p-7 border-2 border-rose/15 shadow-card overflow-hidden">
          <div className="absolute top-3 right-4 font-hand text-xl text-rose flex items-center gap-1"><Heart className="size-4 fill-rose" /> {partner?.display_name ?? "bear"}</div>
          <p className="font-hand text-xl text-rose/70 mb-3">{partner?.display_name ?? "Partner"} — today</p>
          {theirToday ? (
            <p className="font-script text-2xl leading-relaxed text-earth whitespace-pre-wrap">{theirToday.content}</p>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <img src={girlCorazon} alt="waiting bear" className="w-40 rounded-2xl shadow-card opacity-90" />
              <p className="font-hand text-xl text-earth/50 mt-4 text-center">not written yet —<br />they'll arrive when ready 💗</p>
            </div>
          )}
        </div>
      </div>

      {/* Past memories */}
      {Object.keys(grouped).length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-script text-3xl text-rose">past memories</h2>
            <span className="font-hand text-lg text-earth/50 flex items-center gap-1"><Lock className="size-3" /> sealed forever</span>
          </div>
          <div className="space-y-4">
            {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map((date) => {
              const day = grouped[date];
              const mine = day.find((e) => e.user_id === user!.id);
              const theirs = day.find((e) => e.user_id !== user!.id);
              return (
                <div key={date} className="bg-card rounded-3xl p-6 border-2 border-rose/15 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-script text-2xl text-rose">{formatDate(date)}</span>
                    <Lock className="size-4 text-rose/40" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-blush/10 rounded-2xl p-4">
                      <p className="font-hand text-lg text-rose mb-1">you 💗</p>
                      <p className="font-script text-xl text-earth/80 whitespace-pre-wrap">{mine?.content ?? "—"}</p>
                    </div>
                    <div className="bg-honey/10 rounded-2xl p-4">
                      <p className="font-hand text-lg text-rose mb-1">{partner?.display_name ?? "Partner"} 🧸</p>
                      <p className="font-script text-xl text-earth/80 whitespace-pre-wrap">{theirs?.content ?? "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decorative footer */}
      <div className="rounded-3xl overflow-hidden shadow-soft border-4 border-white">
        <img src={adventureJournal} alt="Our adventure journal" className="w-full object-cover" />
      </div>
    </div>
  );
}

function formatDate(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
