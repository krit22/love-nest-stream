import { useEffect, useRef, useState } from "react";
import { Camera, Mic, Image as ImageIcon, X, StopCircle } from "lucide-react";
import { toast } from "sonner";

type MediaKind = "camera" | "mic" | "photo" | "none";

type Props = {
  kind: MediaKind;
  prompt: string;
  onClose: () => void;
  onComplete: (note: string) => void;
};

/**
 * Opens the right device for the dare:
 *  - "camera": live camera preview so they can perform/record the dare
 *  - "mic": audio recorder
 *  - "photo": file picker (gallery / camera capture) to send a photo
 *  - "none": just a text confirmation
 */
export function DareMedia({ kind, prompt, onClose, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (kind === "camera") {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => {
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
          setRecording(true);
          timerRef.current = window.setInterval(() => setSeconds((x) => x + 1), 1000);
        })
        .catch(() => toast.error("we need camera access for this dare 🎀"));
    } else if (kind === "mic") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          streamRef.current = s;
          setRecording(true);
          timerRef.current = window.setInterval(() => setSeconds((x) => x + 1), 1000);
        })
        .catch(() => toast.error("we need mic access for this dare 🎀"));
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [kind]);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-earth/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-card rounded-3xl shadow-soft border-2 border-rose/30 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 gradient-blush text-white">
          <p className="font-script text-2xl leading-none">your dare 💗</p>
          <button onClick={() => { stop(); onClose(); }} className="size-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="font-script text-2xl text-earth text-center">{prompt}</p>

          {kind === "camera" && (
            <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          )}

          {kind === "mic" && (
            <div className="rounded-2xl bg-blush/20 p-6 text-center">
              <Mic className={`size-12 mx-auto ${recording ? "text-rose animate-heartbeat" : "text-rose/40"}`} />
              <p className="font-hand text-2xl text-earth mt-2">{recording ? "listening… 🎙️" : "ready when you are"}</p>
            </div>
          )}

          {kind === "photo" && (
            <label className="block rounded-2xl bg-blush/20 p-6 text-center cursor-pointer hover:bg-blush/30 transition">
              <ImageIcon className="size-12 mx-auto text-rose" />
              <p className="font-hand text-xl text-earth mt-2">tap to pick a photo from your gallery</p>
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    onComplete(`shared a photo: ${f.name} 📸`);
                    onClose();
                  }
                }} />
            </label>
          )}

          {(kind === "camera" || kind === "mic") && (
            <div className="text-center font-hand text-xl text-rose">
              {recording ? `${seconds}s` : "stopped"}
            </div>
          )}

          <div className="flex gap-2 justify-center pt-1">
            {kind !== "photo" && kind !== "none" && (
              <button
                onClick={() => { stop(); onComplete(`completed the dare on ${kind} 💗 (${seconds}s)`); onClose(); }}
                className="px-5 py-2 rounded-full gradient-blush text-white flex items-center gap-2 font-semibold">
                <StopCircle className="size-4" /> done 💗
              </button>
            )}
            {kind === "none" && (
              <button onClick={() => { onComplete("accepted the dare 💗"); onClose(); }}
                className="px-5 py-2 rounded-full gradient-blush text-white font-semibold">accepted 💗</button>
            )}
          </div>

          <p className="text-xs text-earth/50 text-center font-sans">
            {kind === "camera" && "your camera & mic stay on this device — only your dare confirmation is shared."}
            {kind === "mic" && "your mic stays on this device — only your dare confirmation is shared."}
            {kind === "photo" && "your photo stays on this device — only the confirmation is shared."}
          </p>
        </div>
      </div>
    </div>
  );
}

export const dareIcon = (k: MediaKind) =>
  k === "camera" ? Camera : k === "mic" ? Mic : k === "photo" ? ImageIcon : Camera;
