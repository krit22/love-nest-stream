import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import teddyRoses from "@/assets/teddy-roses.jpeg";
import bearsHearts from "@/assets/bears-hearts.jpeg";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirectUrl, data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Welcome, sweet bear 🧸💕");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Image side */}
        <div className="hidden md:block relative">
          <img src={teddyRoses} alt="Teddy holding roses" className="rounded-3xl shadow-soft w-full object-cover" />
          <img src={bearsHearts} alt="Bears with hearts" className="absolute -bottom-8 -right-6 w-40 h-40 object-cover rounded-2xl shadow-soft border-4 border-cream rotate-6" />
          <div className="absolute -top-4 -left-4 px-4 py-2 bg-cream rounded-full shadow-card font-hand text-rose text-xl rotate-[-6deg]">
            for us, only us 💌
          </div>
        </div>

        {/* Form side */}
        <div className="relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 rounded-full gradient-blush shadow-soft mb-4 animate-heartbeat">
              <Heart className="size-7 fill-white text-white" />
            </div>
            <h1 className="font-script text-5xl text-rose">Honey & Bear</h1>
            <p className="mt-2 font-hand text-2xl text-earth/70">our tiny private home 🧸💗</p>
          </div>

          <form onSubmit={submit} className="bg-card/90 backdrop-blur border-2 border-rose/15 rounded-3xl p-7 space-y-4 shadow-soft">
            {mode === "signup" && (
              <div>
                <label className="font-hand text-lg text-rose">What should they call you?</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-blush/10 rounded-2xl px-4 py-3 font-medium text-earth focus:outline-none focus:ring-2 focus:ring-rose/40 placeholder:text-earth/30"
                  placeholder="my sweet name…"
                />
              </div>
            )}
            <div>
              <label className="font-hand text-lg text-rose">Email 💌</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-blush/10 rounded-2xl px-4 py-3 font-medium text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
            </div>
            <div>
              <label className="font-hand text-lg text-rose">Secret password 🔐</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 bg-blush/10 rounded-2xl px-4 py-3 font-medium text-earth focus:outline-none focus:ring-2 focus:ring-rose/40" />
            </div>

            <button type="submit" disabled={busy}
              className="w-full py-3.5 rounded-full gradient-blush text-white font-semibold tracking-wide shadow-card hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50">
              {busy ? "…" : mode === "signin" ? "Come cuddle in 🧸" : "Build our love nest 💕"}
            </button>

            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="w-full font-hand text-lg text-rose hover:text-earth transition-colors">
              {mode === "signin" ? "New here? Build a tiny home together →" : "Already cozy? Sign in →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
