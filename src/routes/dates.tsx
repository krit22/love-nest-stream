import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarHeart, Trash2, Clock, Video, MonitorPlay } from "lucide-react";
import bearStar from "@/assets/bear-star.png";
import { VideoCall } from "@/components/VideoCall";

export const Route = createFileRoute("/dates")({ component: DatesPage });

type DateRow = {
  id: string; created_by: string; title: string; scheduled_at: string;
  recurrence: string | null; notes: string | null; date_type: string | null;
};

const DATE_TYPES = [
  { value: "video_call", label: "💗 video call", screenShare: false },
  { value: "movie_night", label: "🎬 movie night (screen share)", screenShare: true },
  { value: "music_together", label: "🎵 listen to music together (screen share)", screenShare: true },
  { value: "dinner", label: "🍝 video call dinner", screenShare: false },
  { value: "study", label: "📚 study together", screenShare: false },
];

function DatesPage() { return <Gate><DatesInner /></Gate>; }

function DatesInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [dateType, setDateType] = useState("video_call");
  const [notes, setNotes] = useState("");
  const [activeCall, setActiveCall] = useState<DateRow | null>(null);
  const [incomingCall, setIncomingCall] = useState(false);

  const { data: partner } = useQuery({
    queryKey: ["partner", coupleId],
    queryFn: async () => (await supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId).neq("id", user!.id).maybeSingle()).data,
  });

  const { data: dates } = useQuery({
    queryKey: ["dates", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("virtual_dates").select("*").eq("couple_id", coupleId).order("scheduled_at", { ascending: true });
      return (data ?? []) as DateRow[];
    },
  });

  const create = async () => {
    if (!title || !when) return toast.error("title & time please 💗");
    const { error } = await supabase.from("virtual_dates").insert({
      couple_id: coupleId, created_by: user!.id, title, scheduled_at: new Date(when).toISOString(),
      recurrence: recurrence === "none" ? null : recurrence, notes: notes || null,
      date_type: dateType,
    } as any);
    if (error) return toast.error(error.message);
    setTitle(""); setWhen(""); setNotes(""); setRecurrence("none"); setDateType("video_call");
    toast.success("date booked 💌");
    qc.invalidateQueries({ queryKey: ["dates", coupleId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("virtual_dates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["dates", coupleId] });
  };

  const now = Date.now();
  const upcoming = (dates ?? []).filter((d) => new Date(d.scheduled_at).getTime() >= now - 60 * 60 * 1000);
  const past = (dates ?? []).filter((d) => new Date(d.scheduled_at).getTime() < now - 60 * 60 * 1000);
  const next = upcoming[0];
  const minutesTo = next ? Math.round((new Date(next.scheduled_at).getTime() - now) / 60000) : null;
  const isLive = next && minutesTo !== null && minutesTo <= 15 && minutesTo >= -60;
  const nextTypeMeta = next ? DATE_TYPES.find((t) => t.value === (next.date_type ?? "video_call")) : null;

  useEffect(() => {
    if (!next || !isLive || !partner?.id) return;
    const channel = supabase
      .channel(`date-incoming-${next.id}-${user!.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "date_call_signals",
        filter: `virtual_date_id=eq.${next.id}`,
      }, (payload) => {
        const row = payload.new as any;
        if (row.signal_type === "call-request" && row.recipient_id === user!.id) {
          setIncomingCall(true);
          setActiveCall(next);
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [isLive, next, partner?.id, user]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="font-hand text-2xl text-rose">our little plans 💌</p>
        <h1 className="font-script text-5xl text-earth">Virtual Dates</h1>
      </div>

      {next && (
        <div className={`relative rounded-3xl p-6 border-2 shadow-soft text-center ${isLive ? "gradient-blush text-white border-rose" : "bg-card border-rose/20"}`}>
          {isLive ? (
            <>
              <p className="font-hand text-2xl">date started 💗</p>
              <h2 className="font-script text-4xl">{next.title}</h2>
              <p className="font-hand text-lg mt-1 opacity-90">{nextTypeMeta?.label}</p>
              <p className="font-hand text-base mt-1 opacity-80">your bear is being auto-connected 💞</p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <button onClick={() => { setIncomingCall(false); setActiveCall(next); }}
                  disabled={!partner?.id}
                  className="px-6 py-3 rounded-full bg-white text-rose font-semibold shadow-card flex items-center gap-2 hover:scale-105 transition disabled:opacity-60">
                  {nextTypeMeta?.screenShare ? <MonitorPlay className="size-4" /> : <Video className="size-4" />}
                  start call 💗
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-hand text-2xl text-rose">next date</p>
              <h2 className="font-script text-3xl text-earth">{next.title}</h2>
              <p className="font-hand text-lg text-rose/80">{nextTypeMeta?.label}</p>
              <p className="font-hand text-xl text-earth/70">{new Date(next.scheduled_at).toLocaleString()}</p>
              <p className="text-sm text-earth/50 mt-1 flex items-center justify-center gap-1"><Clock className="size-3" /> in {minutesTo} min</p>
            </>
          )}
          <img src={bearStar} alt="" className="absolute -top-6 right-4 w-20 animate-float" />
        </div>
      )}

      {/* Schedule form */}
      <div className="bg-card rounded-3xl p-6 border-2 border-rose/15 shadow-card space-y-3">
        <p className="font-script text-2xl text-earth">plan a new date 🌹</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="movie night, video call dinner…"
          className="w-full bg-blush/10 rounded-full px-4 py-2 font-hand text-xl text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
        <select value={dateType} onChange={(e) => setDateType(e.target.value)}
          className="w-full bg-blush/10 rounded-full px-4 py-2 font-hand text-lg text-rose">
          {DATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            className="bg-blush/10 rounded-full px-4 py-2 font-sans text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}
            className="bg-blush/10 rounded-full px-4 py-2 font-hand text-lg text-rose">
            <option value="none">no repeat</option>
            <option value="weekly">every week</option>
            <option value="monthly">every month</option>
          </select>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="anything special to bring…"
          className="w-full h-20 bg-blush/10 rounded-2xl px-4 py-2 font-hand text-lg text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
        <button onClick={create} className="px-6 py-2 rounded-full gradient-blush text-white font-semibold flex items-center gap-2"><CalendarHeart className="size-4" /> book it</button>
      </div>

      <Section title="upcoming 💗" rows={upcoming} userId={user!.id} onDelete={remove} />
      <Section title="past dates 🌷" rows={past} userId={user!.id} onDelete={remove} />

      {activeCall && partner?.id && (
        <VideoCall
          coupleId={coupleId}
          virtualDateId={activeCall.id}
          currentUserId={user!.id}
          partnerId={partner.id}
          displayName={profile?.display_name ?? "honey"}
          withScreenShare={DATE_TYPES.find((t) => t.value === activeCall.date_type)?.screenShare}
          subtitle={activeCall.title}
          startsIncoming={incomingCall}
          onClose={() => { setActiveCall(null); setIncomingCall(false); }}
        />
      )}
    </div>
  );
}

function Section({ title, rows, userId, onDelete }: { title: string; rows: DateRow[]; userId: string; onDelete: (id: string) => void }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h2 className="font-script text-3xl text-rose mb-3">{title}</h2>
      <div className="space-y-2">
        {rows.map((d) => {
          const meta = DATE_TYPES.find((t) => t.value === (d.date_type ?? "video_call"));
          return (
            <div key={d.id} className="bg-card rounded-2xl px-5 py-3 border-2 border-rose/15 shadow-card flex items-center justify-between gap-3">
              <div>
                <p className="font-script text-xl text-earth">{d.title}</p>
                <p className="font-hand text-base text-rose/70">{new Date(d.scheduled_at).toLocaleString()} {d.recurrence ? `· ${d.recurrence}` : ""}</p>
                <p className="font-hand text-base text-rose/60">{meta?.label}</p>
                {d.notes && <p className="font-hand text-base text-earth/60">{d.notes}</p>}
              </div>
              {d.created_by === userId && (
                <button onClick={() => onDelete(d.id)} className="text-rose/50 hover:text-rose"><Trash2 className="size-4" /></button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
