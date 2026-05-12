import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Heart } from "lucide-react";

export function Nav() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const linkCls = "text-xs font-medium tracking-wide text-earth/60 hover:text-rose transition-colors";
  const activeProps = { className: "text-xs font-semibold tracking-wide text-rose" };

  return (
    <nav className="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex justify-between items-center flex-wrap gap-4">
      <Link to="/" className="flex items-center gap-2 group">
        <span className="size-9 rounded-full gradient-blush flex items-center justify-center shadow-card group-hover:animate-heartbeat">
          <Heart className="size-4 fill-white text-white" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-script text-2xl text-rose">Honey & Bear</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-earth/40">our little home 🧸</span>
        </div>
      </Link>
      <div className="flex items-center gap-5 flex-wrap">
        <Link to="/" className={linkCls} activeProps={activeProps} activeOptions={{ exact: true }}>Home</Link>
        <Link to="/diary" className={linkCls} activeProps={activeProps}>Diary</Link>
        <Link to="/timeline" className={linkCls} activeProps={activeProps}>Memories</Link>
        <Link to="/mood" className={linkCls} activeProps={activeProps}>Mood</Link>
        <span className="h-4 w-px bg-rose/20" />
        <span className="hidden sm:inline font-hand text-lg text-rose">{profile?.display_name}</span>
        <button onClick={handleSignOut} className={linkCls}>Sign out</button>
      </div>
    </nav>
  );
}
