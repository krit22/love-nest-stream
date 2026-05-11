import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const linkCls = "text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity";
  const activeProps = { className: "text-xs uppercase tracking-widest text-blush opacity-100" };

  return (
    <nav className="max-w-5xl mx-auto px-6 sm:px-8 py-8 flex justify-between items-center">
      <Link to="/" className="flex flex-col">
        <span className="font-serif italic text-2xl tracking-tight text-earth">Twofold</span>
        <span className="text-[10px] uppercase tracking-widest opacity-50">Private Space</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link to="/" className={linkCls} activeProps={activeProps} activeOptions={{ exact: true }}>Home</Link>
        <Link to="/diary" className={linkCls} activeProps={activeProps}>Diary</Link>
        <Link to="/timeline" className={linkCls} activeProps={activeProps}>Timeline</Link>
        <Link to="/mood" className={linkCls} activeProps={activeProps}>Mood</Link>
        <div className="h-4 w-px bg-earth/10" />
        <span className="hidden sm:inline text-xs italic font-serif text-earth/60">{profile?.display_name}</span>
        <button onClick={handleSignOut} className={linkCls}>Sign out</button>
      </div>
    </nav>
  );
}
