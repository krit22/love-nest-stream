import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, Video, Mic, Square, Heart, BookHeart, Smile, Trash2 } from "lucide-react";
import floralCats from "@/assets/floral-cats.jpeg";
import bearStar from "@/assets/bear-star.png";
import bearsBlanket from "@/assets/bears-blanket.png";
import { uploadToMedia } from "@/lib/upload";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

export const Route = createFileRoute("/memories")({ component: MemoriesPage });

type Media = { id: string; user_id: string; kind: "photo" | "video" | "voice"; url: string; caption: string | null; tag: string | null; created_at: string };
type Item = { kind: "diary" | "mood" | "media"; user_id: string; date: string; created_at: string; content: string; media?: Media };

function MemoriesPage() { return <Gate><MemoriesInner /></Gate>; }

function MemoriesInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const qc = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [tag, setTag] = useState<string>("love");
  const recorder = useVoiceRecorder();

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => (await supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId).neq("id", user!.id).maybeSingle()).data,
  });

  const { data: items } = useQuery({
    queryKey: ["memories-feed", coupleId],
    queryFn: async () => {
      const [d, m, ph] = await Promise.all([
        supabase.from("diary_entries").select("user_id, entry_date, content, created_at").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(60),
        supabase.from("moods").select("user_id, mood_date, mood, created_at").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(60),
        supabase.from("media_items").select("*").eq("couple_id", coupleId).is("vault_category", null).order("created_at", { ascending: false }).limit(80),
      ]);
      const out: Item[] = [
        ...(d.data ?? []).map((e) => ({ kind: "diary" as const, user_id: e.user_id, date: e.entry_date, created_at: e.created_at, content: e.content })),
        ...(m.data ?? []).map((e) => ({ kind: "mood" as const, user_id: e.user_id, date: e.mood_date, created_at: e.created_at, content: e.mood })),
        ...((ph.data ?? []) as Media[]).map((mm) => ({ kind: "media" as const, user_id: mm.user_id, date: mm.created_at.slice(0, 10), created_at: mm.created_at, content: mm.caption ?? "", media: mm })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));
      return out;
    },
  });

  const { data: gallery } = useQuery({
    queryKey: ["memories-gallery", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("media_items").select("*").eq("couple_id", coupleId).is("vault_category", null).is("diary_entry_id", null).order("created_at", { ascending: false }).limit(60);
      return (data ?? []) as Media[];
    },
  });

  const upload = async (file: File, kind: "photo" | "video" | "voice") => {
    try {
      toast.message("uploading…");
      const url = await uploadToMedia(file, user!.id);
      const { error } = await supabase.from("media_items").insert({
        couple_id: coupleId, user_id: user!.id, kind, url, caption: caption || null, tag,
      });
      if (error) throw error;
      setCaption("");
      toast.success("saved to memories 💗");
      qc.invalidateQueries({ queryKey: ["memories-feed", coupleId] });
      qc.invalidateQueries({ queryKey: ["memories-gallery", coupleId] });
    } catch (e: any) { toast.error(e.message); }
  };

  const startRec = async () => {
    try { await recorder.start(); } catch { toast.error("microphone unavailable"); }
  };
  const stopRec = async () => {
    const blob = await recorder.stop();
    if (blob.size === 0) return;
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
    await upload(file, "voice");
  };

  const removeMedia = async (id: string) => {
    const { error } = await supabase.from("media_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["memories-feed", coupleId] });
    qc.invalidateQueries({ queryKey: ["memories-gallery", coupleId] });
  };

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
        <img src={bearsBlanket} alt="" className="absolute bottom-2 right-4 w-24 sm:w-28 animate-float" />
      </div>

      {/* Upload bar */}
      <div className="bg-card rounded-3xl p-5 border-2 border-rose/15 shadow-card space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="add a tiny caption…"
            className="flex-1 min-w-[180px] bg-blush/10 rounded-full px-4 py-2 font-hand text-lg text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-rose/40" />
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="bg-blush/10 rounded-full px-3 py-2 font-hand text-lg text-rose">
            <option value="love">💗 love</option>
            <option value="comfort">🫂 comfort</option>
            <option value="sad">🥺 sad</option>
            <option value="happy">🥰 happy</option>
            <option value="missing">💌 missing</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => photoRef.current?.click()} className="px-4 py-2 rounded-full bg-blush/15 text-rose hover:bg-blush/30 flex items-center gap-2"><ImagePlus className="size-4" /> photo</button>
          <button onClick={() => videoRef.current?.click()} className="px-4 py-2 rounded-full bg-blush/15 text-rose hover:bg-blush/30 flex items-center gap-2"><Video className="size-4" /> video</button>
          {!recorder.recording ? (
            <button onClick={startRec} className="px-4 py-2 rounded-full gradient-blush text-white flex items-center gap-2"><Mic className="size-4" /> record voice</button>
          ) : (
            <button onClick={stopRec} className="px-4 py-2 rounded-full bg-rose text-white flex items-center gap-2 animate-pulse"><Square className="size-4" /> stop · {recorder.seconds}s / 30</button>
          )}
          <span className="font-hand text-sm text-earth/50">photos, videos, voice notes (10–30s) 💕</span>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "photo")} />
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "video")} />
        </div>
      </div>

      {/* Gallery grid (uploaded photos/videos not tied to a diary day) */}
      {gallery && gallery.length > 0 && (
        <div>
          <h2 className="font-script text-3xl text-rose mb-4">our gallery 🖼️</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallery.map((m) => (
              <div key={m.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-blush/10 border-2 border-rose/15">
                {m.kind === "photo" && <img src={m.url} className="w-full h-full object-cover" alt={m.caption ?? ""} />}
                {m.kind === "video" && <video src={m.url} controls className="w-full h-full object-cover" />}
                {m.kind === "voice" && (
                  <div className="w-full h-full p-3 flex flex-col items-center justify-center gap-2">
                    <Mic className="size-7 text-rose" />
                    <audio src={m.url} controls className="w-full" />
                  </div>
                )}
                {m.user_id === user!.id && (
                  <button onClick={() => removeMedia(m.id)} className="absolute top-2 right-2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="size-3 text-rose" />
                  </button>
                )}
                {m.caption && <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 font-hand text-sm text-white">{m.caption}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <h2 className="font-script text-3xl text-rose">timeline of us 🌷</h2>
      {!items || items.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-3xl border-2 border-rose/15">
          <img src={bearStar} alt="" className="w-24 mx-auto mb-3 animate-float" />
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
                <div className="flex items-center gap-2 font-hand text-lg text-rose mb-2">
                  {it.kind === "diary" ? <BookHeart className="size-4" /> : it.kind === "mood" ? <Smile className="size-4" /> : <ImagePlus className="size-4" />}
                  {nameOf(it.user_id)} · {it.kind === "diary" ? "wrote" : it.kind === "mood" ? "felt" : "shared a memory"} ·
                  <span className="text-earth/50 text-base">{new Date(it.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </div>
                {it.kind === "diary" && <p className="font-script text-xl text-earth/85 line-clamp-4 whitespace-pre-wrap">{it.content}</p>}
                {it.kind === "mood" && <p className="font-script text-2xl text-earth">felt <span className="text-rose">{it.content.toLowerCase()}</span> 💗</p>}
                {it.kind === "media" && it.media && (
                  <div className="space-y-2">
                    {it.media.kind === "photo" && <img src={it.media.url} alt="" className="rounded-2xl max-h-80 object-cover" />}
                    {it.media.kind === "video" && <video src={it.media.url} controls className="rounded-2xl max-h-80" />}
                    {it.media.kind === "voice" && <audio src={it.media.url} controls className="w-full" />}
                    {it.media.caption && <p className="font-hand text-lg text-earth/80">"{it.media.caption}"</p>}
                    {it.media.tag && <span className="inline-block font-hand text-sm text-rose bg-blush/15 px-2 py-0.5 rounded-full">#{it.media.tag}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
