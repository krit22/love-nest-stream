import { useEffect, useRef } from "react";
import { X, MonitorPlay } from "lucide-react";

type Props = {
  roomName: string;
  displayName: string;
  withScreenShare?: boolean;
  onClose: () => void;
  subtitle?: string;
};

/**
 * Embeds a Jitsi Meet room. Both partners loading the same room name auto-join
 * each other (no manual pickup needed) — perfect for scheduled dates.
 * For movie / music dates, screen sharing is encouraged via a quick-tip and
 * Jitsi's built-in screenshare button (still rendered, with self-cam as PiP).
 */
export function VideoCall({ roomName, displayName, withScreenShare, onClose, subtitle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Encode safely; Jitsi room names should be URL-safe
    const safeRoom = encodeURIComponent(roomName.replace(/[^a-zA-Z0-9-_]/g, ""));
    const config = {
      // Auto-accept feel: prejoin disabled, mic + cam on
      "config.prejoinPageEnabled": "false",
      "config.startWithAudioMuted": "false",
      "config.startWithVideoMuted": "false",
      "config.disableDeepLinking": "true",
      "config.disableInviteFunctions": "true",
      "userInfo.displayName": displayName,
      "interfaceConfig.MOBILE_APP_PROMO": "false",
      "interfaceConfig.SHOW_JITSI_WATERMARK": "false",
    };
    const params = Object.entries(config)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    const src = `https://meet.jit.si/${safeRoom}#${params}&userInfo.displayName=%22${encodeURIComponent(displayName)}%22`;
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "camera; microphone; display-capture; autoplay; clipboard-write";
    iframe.className = "w-full h-full rounded-2xl border-0";
    containerRef.current?.appendChild(iframe);
    return () => {
      iframe.remove();
    };
  }, [roomName, displayName]);

  return (
    <div className="fixed inset-0 z-50 bg-earth/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl h-[80vh] bg-card rounded-3xl shadow-soft border-2 border-rose/30 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 gradient-blush text-white">
          <div>
            <p className="font-script text-2xl leading-none">our private call 💗</p>
            {subtitle && <p className="font-hand text-sm opacity-90">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {withScreenShare && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-hand bg-white/20 px-3 py-1.5 rounded-full">
                <MonitorPlay className="size-3.5" /> tap the screen-share icon to watch together
              </span>
            )}
            <button onClick={onClose} className="size-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center" aria-label="end call">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div ref={containerRef} className="flex-1 bg-black" />
      </div>
    </div>
  );
}
