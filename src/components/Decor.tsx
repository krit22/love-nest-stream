import { Heart } from "lucide-react";
import bearStar from "@/assets/bear-star.png";
import bearsBlanket from "@/assets/bears-blanket.png";

export function HeartTrail({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none flex items-center gap-1 text-rose ${className}`}>
      <Heart className="size-3 fill-rose" />
      <Heart className="size-2 fill-blush" />
      <Heart className="size-3 fill-rose" />
    </div>
  );
}

export function FloatingHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <Heart
          key={i}
          className="absolute size-4 fill-rose/30 text-rose/30 animate-float"
          style={{
            left: `${5 + i * 12}%`,
            top: `${10 + (i % 4) * 22}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${4 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return <span className={`inline-block animate-sparkle ${className}`}>✨</span>;
}

/** Tiny hand-drawn bear sticker */
export function TinyBear({ className = "", variant = "star" }: { className?: string; variant?: "star" | "blanket" }) {
  const src = variant === "star" ? bearStar : bearsBlanket;
  return <img src={src} alt="" className={`pointer-events-none select-none ${className}`} />;
}

/** Site-wide ambient decor: floating roses, hearts, and tiny bears */
export function AmbientLove() {
  const items = [
    { e: "🌹", l: 4, t: 12, d: 0, s: 7 },
    { e: "💗", l: 92, t: 18, d: 1, s: 8 },
    { e: "🌷", l: 8, t: 70, d: 2, s: 9 },
    { e: "💞", l: 88, t: 78, d: 0.6, s: 7 },
    { e: "🌸", l: 50, t: 6, d: 1.4, s: 8 },
    { e: "🧸", l: 96, t: 48, d: 2.2, s: 10 },
    { e: "🌹", l: 2, t: 42, d: 1.1, s: 9 },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute text-2xl opacity-30 animate-float"
          style={{
            left: `${it.l}%`,
            top: `${it.t}%`,
            animationDelay: `${it.d}s`,
            animationDuration: `${it.s}s`,
          }}
        >
          {it.e}
        </span>
      ))}
      <img
        src={bearStar}
        alt=""
        className="absolute w-20 opacity-25 animate-float"
        style={{ left: "3%", bottom: "5%", animationDuration: "8s" }}
      />
      <img
        src={bearsBlanket}
        alt=""
        className="absolute w-24 opacity-25 animate-float"
        style={{ right: "3%", bottom: "8%", animationDelay: "1.5s", animationDuration: "9s" }}
      />
    </div>
  );
}
