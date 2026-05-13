import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Gate } from "@/components/Gate";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Mic, RotateCw, Send } from "lucide-react";
import { DareMedia } from "@/components/DareMedia";
import { uploadToMedia } from "@/lib/upload";

export const Route = createFileRoute("/games")({ component: GamesPage });

type DareKind = "camera" | "mic" | "photo" | "none";
type Dare = { text: string; kind: DareKind };
type DareComplete = { dare: string; kind: DareKind; note: string; file?: File; mediaKind?: "photo" | "voice" };

function GamesPage() { return <Gate><GamesInner /></Gate>; }

const KNOWS_QUESTIONS = [
  "my favorite color",
  "my comfort food",
  "the song I cry to",
  "my dream vacation",
  "my biggest fear",
  "what makes me feel safest",
  "my favorite memory of us",
  "the little thing you do that I love most",
];
const THIS_OR_THAT = [
  ["beach", "mountains"],
  ["coffee", "tea"],
  ["movies", "books"],
  ["morning person", "night owl"],
  ["sweet", "spicy"],
  ["text", "call"],
  ["cuddle", "kiss"],
];
const DARES: Dare[] = [
  { text: "send a selfie right now 📸", kind: "photo" },
  { text: "send the last photo in your gallery 🌷", kind: "photo" },
  { text: "send a photo of what you're wearing today 👗", kind: "photo" },
  { text: "send a photo of the view outside your window 🌇", kind: "photo" },
  { text: "send a photo of your current vibe (food, drink, anything) 🍰", kind: "photo" },
  { text: "say I love you in 3 languages 💞", kind: "mic" },
  { text: "sing 5 seconds of our song 🎶", kind: "mic" },
  { text: "whisper a secret only I should hear 🤫", kind: "mic" },
  { text: "record a 10-second voice note describing my smile 🥰", kind: "mic" },
  { text: "do your best impression of me — record it 😆", kind: "mic" },
  { text: "tell me your favorite memory of us in 15 seconds 💗", kind: "mic" },
  { text: "make a heart with your hands on camera 🫶", kind: "camera" },
  { text: "blow me a kiss on camera 💋", kind: "camera" },
  { text: "show me your goofiest face on camera 🤪", kind: "camera" },
  { text: "do a little happy dance on camera 💃", kind: "camera" },
  { text: "show me your cutest pout 🥺", kind: "camera" },
  { text: "give the camera the biggest hug you can 🤗", kind: "camera" },
  { text: "wink at me three times on camera 😉", kind: "camera" },
  { text: "describe me in 3 words 💗", kind: "none" },
  { text: "name 5 things you love about me 💞", kind: "none" },
  { text: "promise me one tiny sweet thing for tomorrow 🌷", kind: "none" },
  { text: "tell me the moment you knew you liked me 💌", kind: "none" },
  { text: "compliment me in a way you never have before ✨", kind: "none" },
];
const SENTENCES = [
  "When I think of you I feel…",
  "The thing I miss most about you is…",
  "My favorite version of us is…",
  "If I could teleport to you right now I would…",
];

function GamesInner() {
  const { user, profile } = useAuth();
  const coupleId = profile!.couple_id!;
  const qc = useQueryClient();
  const [game, setGame] = useState<string | null>(null);

  const { data: results } = useQuery({
    queryKey: ["games", coupleId],
    queryFn: async () => {
      const { data } = await supabase.from("game_results").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false }).limit(30);
      return data ?? [];
    },
  });

  const submit = async (gameKey: string, payload: any) => {
    const { error } = await supabase.from("game_results").insert({ couple_id: coupleId, user_id: user!.id, game: gameKey, payload });
    if (error) { toast.error(error.message); return false; }
    toast.success("saved to your timeline 💗");
    qc.invalidateQueries({ queryKey: ["games", coupleId] });
    return true;
  };

  const saveDare = async ({ file, mediaKind, ...result }: DareComplete) => {
    try {
      let mediaUrl: string | undefined;
      if (file && mediaKind) {
        toast.message("saving dare proof…");
        mediaUrl = await uploadToMedia(file, user!.id);
        const { error } = await supabase.from("media_items").insert({
          couple_id: coupleId,
          user_id: user!.id,
          kind: mediaKind,
          url: mediaUrl,
          caption: `dare: ${result.dare}`,
          tag: "dare",
        });
        if (error) throw error;
      }
      await submit("dare", { ...result, mediaUrl, mediaKind });
    } catch (e: any) {
      toast.error(e.message ?? "couldn't save this dare");
    }
  };

  const games = [
    { key: "knows", label: "Who knows better", emoji: "💗" },
    { key: "tot", label: "This or that", emoji: "🎀" },
    { key: "dare", label: "Dare wheel", emoji: "🎯" },
    { key: "sentence", label: "Finish the sentence", emoji: "✍️" },
    { key: "recall", label: "Memory recall", emoji: "🧠" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="font-hand text-2xl text-rose">play & laugh together 🎀</p>
        <h1 className="font-script text-5xl text-earth">Couple Games</h1>
      </div>

      {!game ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {games.map((g) => (
            <button key={g.key} onClick={() => setGame(g.key)}
              className="p-6 rounded-3xl bg-card border-2 border-rose/15 shadow-card hover:-translate-y-1 transition text-center">
              <div className="text-4xl mb-2">{g.emoji}</div>
              <p className="font-script text-2xl text-earth">{g.label}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setGame(null)} className="font-hand text-lg text-rose">← all games</button>
          {game === "knows" && <KnowsBetter onSave={(p) => submit("knows", p)} />}
          {game === "tot" && <ThisOrThat onSave={(p) => submit("tot", p)} />}
          {game === "dare" && <DareWheel onSave={saveDare} />}
          {game === "sentence" && <FinishSentence onSave={(p) => submit("sentence", p)} />}
          {game === "recall" && <MemoryRecall onSave={(p) => submit("recall", p)} />}
        </div>
      )}

      {/* Highlights */}
      {results && results.length > 0 && (
        <div>
          <h2 className="font-script text-3xl text-rose mb-3">our game highlights 💕</h2>
          <div className="space-y-2">
            {results.map((r: any) => (
              <div key={r.id} className="bg-card rounded-2xl px-5 py-3 border-2 border-rose/15 shadow-card">
                <p className="font-hand text-lg text-rose">{r.user_id === user!.id ? "you" : "your bear"} · {r.game}</p>
                <p className="font-hand text-lg text-earth whitespace-pre-wrap">{formatPayload(r.payload)}</p>
                {r.payload?.mediaUrl && (
                  <div className="mt-3">
                    {r.payload.mediaKind === "photo" ? (
                      <img src={r.payload.mediaUrl} alt="saved dare proof" className="max-h-72 rounded-2xl border-2 border-rose/15 object-cover" />
                    ) : (
                      <div className="rounded-2xl bg-blush/10 p-3 flex items-center gap-3">
                        <Mic className="size-5 text-rose" />
                        <audio src={r.payload.mediaUrl} controls className="w-full" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatPayload(p: any): string {
  if (!p) return "";
  if (typeof p === "string") return p;
  if (p.q && p.a) return `${p.q}\n→ ${p.a}`;
  if (p.choice) return `chose: ${p.choice}`;
  if (p.dare) return `dare: ${p.dare}`;
  return JSON.stringify(p, null, 2);
}

function KnowsBetter({ onSave }: { onSave: (p: any) => void }) {
  const q = useMemo(() => KNOWS_QUESTIONS[Math.floor(Math.random() * KNOWS_QUESTIONS.length)], []);
  const [a, setA] = useState("");
  return (
    <Card title="Who knows better 💗">
      <p className="font-script text-2xl text-earth">{q}?</p>
      <textarea value={a} onChange={(e) => setA(e.target.value)} placeholder="your guess about your partner…"
        className="w-full h-20 bg-blush/10 rounded-2xl p-3 font-hand text-xl text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
      <button onClick={() => a && onSave({ q, a })} className="px-5 py-2 rounded-full gradient-blush text-white flex items-center gap-2"><Send className="size-4" /> save guess</button>
    </Card>
  );
}

function ThisOrThat({ onSave }: { onSave: (p: any) => void }) {
  const [pair, setPair] = useState(() => THIS_OR_THAT[Math.floor(Math.random() * THIS_OR_THAT.length)]);
  return (
    <Card title="This or that 🎀">
      <div className="grid grid-cols-2 gap-3">
        {pair.map((opt) => (
          <button key={opt} onClick={() => onSave({ q: pair.join(" or "), choice: opt })}
            className="p-6 rounded-3xl bg-blush/15 hover:bg-blush/30 border-2 border-rose/20 font-script text-3xl text-earth">{opt}</button>
        ))}
      </div>
      <button onClick={() => setPair(THIS_OR_THAT[Math.floor(Math.random() * THIS_OR_THAT.length)])}
        className="font-hand text-lg text-rose flex items-center gap-1"><RotateCw className="size-4" /> another pair</button>
    </Card>
  );
}

function DareWheel({ onSave }: { onSave: (p: DareComplete) => void | Promise<void> }) {
  const [dare, setDare] = useState<Dare | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const spin = () => {
    // pick a dare we haven't seen yet this session
    const unseen = DARES.filter((d) => !history.includes(d.text));
    const pool = unseen.length > 0 ? unseen : DARES;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setDare(next);
    setHistory((h) => [...h.slice(-DARES.length + 1), next.text]);
  };
  return (
    <Card title="Dare wheel 🎯">
      <div className="text-center space-y-3">
        <button onClick={spin} className="size-32 rounded-full gradient-blush text-white font-script text-2xl shadow-soft hover:scale-105 transition flex items-center justify-center mx-auto">{dare ? "spin again" : "spin"}</button>
        {dare && (
          <>
            <p className="mt-4 font-script text-3xl text-earth">{dare.text}</p>
            <p className="font-hand text-base text-rose/70">
              {dare.kind === "camera" && "we'll open your camera so you can perform it 📷"}
              {dare.kind === "mic" && "we'll open your mic so you can record it 🎙️"}
              {dare.kind === "photo" && "we'll ask for a photo from your gallery 🖼️"}
              {dare.kind === "none" && "say it out loud or type it below 💗"}
            </p>
            <button onClick={() => setOpen(true)} className="mt-1 px-5 py-2 rounded-full gradient-blush text-white">take the dare 💗</button>
          </>
        )}
      </div>
      {open && dare && (
        <DareMedia
          kind={dare.kind}
          prompt={dare.text}
          onClose={() => setOpen(false)}
          onComplete={(result) => onSave({ dare: dare.text, kind: dare.kind, ...result })}
        />
      )}
    </Card>
  );
}

function FinishSentence({ onSave }: { onSave: (p: any) => void }) {
  const q = useMemo(() => SENTENCES[Math.floor(Math.random() * SENTENCES.length)], []);
  const [a, setA] = useState("");
  return (
    <Card title="Finish the sentence ✍️">
      <p className="font-script text-2xl text-earth">{q}</p>
      <textarea value={a} onChange={(e) => setA(e.target.value)} className="w-full h-20 bg-blush/10 rounded-2xl p-3 font-hand text-xl text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
      <button onClick={() => a && onSave({ q, a })} className="px-5 py-2 rounded-full gradient-blush text-white">save 💗</button>
    </Card>
  );
}

function MemoryRecall({ onSave }: { onSave: (p: any) => void }) {
  const [a, setA] = useState("");
  const q = "describe our first 'us' memory in 3 sentences";
  return (
    <Card title="Memory recall 🧠">
      <p className="font-script text-2xl text-earth">{q}</p>
      <textarea value={a} onChange={(e) => setA(e.target.value)} className="w-full h-28 bg-blush/10 rounded-2xl p-3 font-hand text-xl text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
      <button onClick={() => a && onSave({ q, a })} className="px-5 py-2 rounded-full gradient-blush text-white">save memory 💗</button>
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl p-6 border-2 border-rose/15 shadow-card space-y-3">
      <h2 className="font-script text-3xl text-earth flex items-center gap-2"><Heart className="size-5 fill-rose text-rose" />{title}</h2>
      {children}
    </div>
  );
}
