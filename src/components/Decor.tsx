import { Heart } from "lucide-react";

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
      {[...Array(6)].map((_, i) => (
        <Heart
          key={i}
          className="absolute size-4 fill-rose/30 text-rose/30 animate-float"
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
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
