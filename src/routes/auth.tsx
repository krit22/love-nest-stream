import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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
          email,
          password,
          options: { emailRedirectTo: redirectUrl, data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Welcome. A quiet space awaits.");
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
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-serif italic text-4xl text-earth">Twofold</h1>
          <p className="mt-3 font-serif italic text-earth/60">A private home, for the two of you.</p>
        </div>

        <form onSubmit={submit} className="bg-card border border-earth/5 rounded-3xl p-8 space-y-5 shadow-sm">
          {mode === "signup" && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-earth/50">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 bg-transparent border-b border-earth/10 py-2 font-serif text-lg focus:outline-none focus:border-blush"
                placeholder="What should they call you?"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-earth/50">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-transparent border-b border-earth/10 py-2 font-serif text-lg focus:outline-none focus:border-blush"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-earth/50">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-transparent border-b border-earth/10 py-2 font-serif text-lg focus:outline-none focus:border-blush"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-full bg-earth text-parchment text-xs uppercase tracking-widest hover:bg-earth/90 transition-colors disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Come in" : "Make a home"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-xs italic font-serif text-earth/50 hover:text-earth transition-colors"
          >
            {mode === "signin" ? "New here? Create your space." : "Already have a home? Sign in."}
          </button>
        </form>
      </div>
    </div>
  );
}
