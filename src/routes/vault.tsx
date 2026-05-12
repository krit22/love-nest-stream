import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Mic, Square, ImagePlus, Video, Sparkles, Shuffle, Trash2 } from "lucide-react";
import bearsBlanket from "@/assets/bears-blanket.png";
import { uploadToMedia } from "@/lib/upload";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

export const Route = createFileRoute("/vault")({ component: VaultPage });

type Item = { id: string; user_id: string; category: string; kind: "text" | "photo" | "video" | "voice"; content: string | null; url: string | null; created_at: string };

const CATEGORIES = [
  { key: "sad", label: "Open when sad", emoji: "🥺", theme: "from-blue-100 to-rose/10" },
  { key: "angry", label: "Open when angry", emoji: "😤", theme: "from-red-100 to-honey/10" },
  { key: "lonely", label: "Open when lonely", emoji: "🫂", theme: "from-purple-100 to-blush/15" },
  { key: "missing", label: "Open when missing me", emoji: "💌", theme: "from-pink-100 to-rose/15" },
  { key: "fight", label: "Open after a fight", emoji: "🌹", theme: "from-rose/15 to-honey/20" },
  { key: "overthinking", label: "Open when overthinking", emoji: "🌙", theme: "from-indigo-100 to-blush/10" },
];

function VaultPage() { return <Gate><VaultInner /></Gate>; }

function VaultInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();
  const [emergencyItem, setEmergencyItem] = useState<Item | null>(null);

  const { data: items } = useQuery({
    queryKey: ["vault", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("vault_items").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
      return (data ?? []) as Item[];
    },
  });

  const byCat = useMemo(() => {
    const m: Record<string, Item[]> = {};
    (items ?? []).forEach((i) => (m[i.category] ||= []).push(i));
    return m;
  }, [items]);

  const addText = async () => {
    if (!active || !draft.trim()) return;
    const { error } = await supabase.from("vault_items").insert({
      couple_id: coupleId, user_id: user!.id, category: active, kind: "text", content: draft,
    });
    if (error) return toast.error(error.message);
    setDraft("");
    toast.success("tucked in 💗");
    qc.invalidateQueries({ queryKey: ["vault", coupleId] });
  };

  const addMedia = async (file: File, kind: "photo" | "video" | "voice") => {
    if (!active) return;
    try {
      const url = await uploadToMedia(file, user!.id);
      const { error } = await supabase.from("vault_items").insert({
        couple_id: coupleId, user_id: user!.id, category: active, kind, url,
      });
      if (error) throw error;
      toast.success("saved 💕");
      qc.invalidateQueries({ queryKey: ["vault", coupleId] });
    } catch (e: any) { toast.error(e.message); }
  };

  const stopRec = async () => {
    const blob = await recorder.stop();
    if (blob.size === 0) return;
    await addMedia(new File([blob], `vault-${Date.now()}.webm`, { type: "audio/webm" }), "voice");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("vault_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["vault", coupleId] });
  };

  const emergency = () => {
    const all = items ?? [];
    if (all.length === 0) return toast.error("vault is empty — fill it together first 💗");
    setEmergencyItem(all[Math.floor(Math.random() * all.length)]);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="font-hand text-2xl text-rose">a soft place to land 🌷</p>
        <h1 className="font-script text-5xl text-earth">Open When</h1>
      </div>

      <div className="flex justify-center">
        <button onClick={emergency} className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-blush text-white font-semibold shadow-soft hover:scale-105 transition">
          <Sparkles className="size-4" /> emergency comfort
        </button>
      </div>

      {!active ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setActive(c.key)}
              className={`p-6 rounded-3xl bg-gradient-to-br ${c.theme} border-2 border-rose/20 shadow-card hover:-translate-y-1 transition text-left`}>
              <div className="text-4xl mb-2">{c.emoji}</div>
              <p className="font-script text-2xl text-earth">{c.label}</p>
              <p className="font-hand text-lg text-rose/70 mt-1">{(byCat[c.key] ?? []).length} little notes</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <button onClick={() => setActive(null)} className="font-hand text-lg text-rose">← all categories</button>
          <div className="bg-card rounded-3xl p-6 border-2 border-rose/15 shadow-card">
            <h2 className="font-script text-3xl text-earth mb-1">{CATEGORIES.find(c => c.key === active)?.label}</h2>
            <p className="font-hand text-lg text-rose/70 mb-4">add a comfort note for them 💌</p>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="when you feel this way, remember…"
              className="w-full h-24 bg-blush/10 rounded-2xl p-3 font-hand text-xl text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button onClick={addText} disabled={!draft.trim()} className="px-5 py-2 rounded-full gradient-blush text-white font-semibold disabled:opacity-50">save note 💗</button>
              <button onClick={() => photoRef.current?.click()} className="px-4 py-2 rounded-full bg-blush/15 text-rose flex items-center gap-2"><ImagePlus className="size-4" /> photo</button>
              <button onClick={() => videoRef.current?.click()} className="px-4 py-2 rounded-full bg-blush/15 text-rose flex items-center gap-2"><Video className="size-4" /> video</button>
              {!recorder.recording ? (
                <button onClick={() => recorder.start()} className="px-4 py-2 rounded-full bg-blush/15 text-rose flex items-center gap-2"><Mic className="size-4" /> voice</button>
              ) : (
                <button onClick={stopRec} className="px-4 py-2 rounded-full bg-rose text-white flex items-center gap-2 animate-pulse"><Square className="size-4" /> stop · {recorder.seconds}s</button>
              )}
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && addMedia(e.target.files[0], "photo")} />
              <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && addMedia(e.target.files[0], "video")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(byCat[active] ?? []).map((it) => (
              <VaultCard key={it.id} item={it} onDelete={() => remove(it.id)} canDelete={it.user_id === user!.id} />
            ))}
            {(byCat[active] ?? []).length === 0 && (
              <div className="col-span-full text-center py-10 bg-blush/10 rounded-3xl">
                <img src={bearsBlanket} alt="" className="w-28 mx-auto mb-2 animate-float" />
                <p className="font-script text-2xl text-earth/60">no notes here yet — fill it with love</p>
              </div>
            )}
          </div>
        </div>
      )}

      {emergencyItem && (
        <div onClick={() => setEmergencyItem(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-3xl p-6 border-2 border-rose/20 shadow-soft max-w-md w-full">
            <p className="font-hand text-2xl text-rose mb-2">a little hug from us 🫂</p>
            <VaultCard item={emergencyItem} canDelete={false} />
            <div className="flex gap-2 mt-4">
              <button onClick={emergency} className="flex-1 px-4 py-2 rounded-full bg-blush/15 text-rose flex items-center justify-center gap-1"><Shuffle className="size-4" /> another</button>
              <button onClick={() => setEmergencyItem(null)} className="flex-1 px-4 py-2 rounded-full gradient-blush text-white">thank you 💗</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VaultCard({ item, onDelete, canDelete }: { item: Item; onDelete?: () => void; canDelete: boolean }) {
  return (
    <div className="relative bg-card rounded-3xl p-5 border-2 border-rose/15 shadow-card">
      {canDelete && (
        <button onClick={onDelete} className="absolute top-3 right-3 text-rose/50 hover:text-rose"><Trash2 className="size-4" /></button>
      )}
      {item.kind === "text" && <p className="font-script text-2xl text-earth whitespace-pre-wrap">{item.content}</p>}
      {item.kind === "photo" && item.url && <img src={item.url} alt="" className="rounded-2xl w-full max-h-72 object-cover" />}
      {item.kind === "video" && item.url && <video src={item.url} controls className="rounded-2xl w-full" />}
      {item.kind === "voice" && item.url && (
        <div className="flex items-center gap-3"><Heart className="size-5 fill-rose text-rose animate-heartbeat" /><audio src={item.url} controls className="flex-1" /></div>
      )}
    </div>
  );
}
