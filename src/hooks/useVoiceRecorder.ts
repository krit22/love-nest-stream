import { useRef, useState } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopResolveRef = useRef<((b: Blob) => void) | null>(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((t) => t.stop());
      stopResolveRef.current?.(blob);
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s >= 30) { stop(); return s; }
        return s + 1;
      });
    }, 1000);
  };

  const stop = (): Promise<Blob> =>
    new Promise((resolve) => {
      if (!mediaRef.current) return resolve(new Blob());
      stopResolveRef.current = resolve;
      mediaRef.current.stop();
      setRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    });

  return { recording, seconds, start, stop };
}
