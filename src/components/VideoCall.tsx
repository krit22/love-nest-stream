import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Mic, MicOff, MonitorPlay, Phone, PhoneOff, ScreenShare, ScreenShareOff, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type SignalType =
  | "call-request"
  | "call-accepted"
  | "call-rejected"
  | "offer"
  | "answer"
  | "ice-candidate"
  | "hangup"
  | "screen-started"
  | "screen-stopped";

type SignalRow = {
  sender_id: string;
  recipient_id: string;
  signal_type: SignalType;
  payload: any;
};

type Props = {
  coupleId: string;
  virtualDateId: string;
  currentUserId: string;
  partnerId: string;
  displayName: string;
  withScreenShare?: boolean;
  onClose: () => void;
  subtitle?: string;
  startsIncoming?: boolean;
};

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function VideoCall({ coupleId, virtualDateId, currentUserId, partnerId, withScreenShare, onClose, subtitle, startsIncoming }: Props) {
  const [phase, setPhase] = useState<"idle" | "incoming" | "calling" | "connecting" | "connected" | "reconnecting" | "ended">(startsIncoming ? "incoming" : "idle");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [partnerSharing, setPartnerSharing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [floating, setFloating] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef(new MediaStream());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenSenderRef = useRef<RTCRtpSender | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const isCallerRef = useRef(false);
  const endedRef = useRef(false);

  const statusText = useMemo(() => {
    if (phase === "incoming") return "Incoming call from your partner ❤️";
    if (phase === "calling") return "Calling your partner ❤️";
    if (phase === "connecting") return "Connecting…";
    if (phase === "connected") return "Connected 💚";
    if (phase === "reconnecting") return "Reconnecting…";
    if (phase === "ended") return "Connection is unstable, please try again";
    return "You’re together now ❤️";
  }, [phase]);

  const sendSignal = useCallback(async (signal_type: SignalType, payload: any = {}) => {
    const { error } = await (supabase as any).from("date_call_signals").insert({
      couple_id: coupleId,
      virtual_date_id: virtualDateId,
      sender_id: currentUserId,
      recipient_id: partnerId,
      signal_type,
      payload,
    });
    if (error) toast.error(error.message);
  }, [coupleId, currentUserId, partnerId, virtualDateId]);

  const stopLocal = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    screenSenderRef.current = null;
    setSharing(false);
  }, []);

  const cleanup = useCallback(() => {
    endedRef.current = true;
    pcRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    stopLocal();
    remoteStreamRef.current = new MediaStream();
    if (audioRef.current) audioRef.current.srcObject = null;
    if (screenRef.current) screenRef.current.srcObject = null;
  }, [stopLocal]);

  const ensureLocalAudio = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
      video: false,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const addQueuedIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    const queued = [...iceQueueRef.current];
    iceQueueRef.current = [];
    for (const candidate of queued) {
      try { await pc.addIceCandidate(candidate); } catch { /* candidate may be stale after reconnect */ }
    }
  }, []);

  const makeOffer = useCallback(async (iceRestart = false) => {
    const pc = pcRef.current;
    if (!pc) return;
    const offer = await pc.createOffer({ iceRestart, offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    await sendSignal("offer", { sdp: offer });
  }, [sendSignal]);

  const ensurePeer = useCallback(async () => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers, bundlePolicy: "max-bundle" });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) void sendSignal("ice-candidate", { candidate: event.candidate.toJSON() });
    };
    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remoteStreamRef.current.getTracks().some((t) => t.id === track.id)) {
          remoteStreamRef.current.addTrack(track);
        }
        if (track.kind === "video") {
          setPartnerSharing(true);
          track.onended = () => setPartnerSharing(false);
        }
      });
      if (audioRef.current) audioRef.current.srcObject = remoteStreamRef.current;
      if (screenRef.current) screenRef.current.srcObject = remoteStreamRef.current;
    };
    pc.onconnectionstatechange = () => {
      if (endedRef.current) return;
      if (pc.connectionState === "connected") setPhase("connected");
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setPhase("reconnecting");
        if (isCallerRef.current && pc.connectionState === "failed") void makeOffer(true);
      }
      if (pc.connectionState === "closed") setPhase("ended");
    };

    const local = await ensureLocalAudio();
    local.getAudioTracks().forEach((track) => {
      if (!pc.getSenders().some((sender) => sender.track?.id === track.id)) pc.addTrack(track, local);
    });
    return pc;
  }, [ensureLocalAudio, makeOffer, sendSignal]);

  const acceptCall = useCallback(async () => {
    try {
      setPhase("connecting");
      await ensurePeer();
      await sendSignal("call-accepted");
    } catch {
      toast.error("microphone access is needed to start the call 🎙️");
      setPhase("incoming");
    }
  }, [ensurePeer, sendSignal]);

  const startCall = useCallback(async () => {
    try {
      isCallerRef.current = true;
      endedRef.current = false;
      setPhase("calling");
      await ensurePeer();
      await sendSignal("call-request");
    } catch {
      toast.error("microphone access is needed to call your partner 🎙️");
      setPhase("idle");
    }
  }, [ensurePeer, sendSignal]);

  const rejectCall = useCallback(() => {
    void sendSignal("call-rejected");
    cleanup();
    onClose();
  }, [cleanup, onClose, sendSignal]);

  const endCall = useCallback(() => {
    void sendSignal("hangup");
    cleanup();
    onClose();
  }, [cleanup, onClose, sendSignal]);

  const handleSignal = useCallback(async (row: SignalRow) => {
    if (row.sender_id === currentUserId || row.recipient_id !== currentUserId) return;
    try {
      if (row.signal_type === "call-request") {
        endedRef.current = false;
        setPhase((p) => p === "idle" ? "incoming" : p);
      }
      if (row.signal_type === "call-accepted") {
        setPhase("connecting");
        await ensurePeer();
        await makeOffer(false);
      }
      if (row.signal_type === "call-rejected") {
        toast.message("your partner can’t join right now 💌");
        setPhase("idle");
      }
      if (row.signal_type === "offer") {
        setPhase("connecting");
        const pc = await ensurePeer();
        await pc.setRemoteDescription(new RTCSessionDescription(row.payload.sdp));
        await addQueuedIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal("answer", { sdp: answer });
      }
      if (row.signal_type === "answer") {
        const pc = pcRef.current;
        if (pc && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(row.payload.sdp));
          await addQueuedIce();
        }
        setPhase("connected");
      }
      if (row.signal_type === "ice-candidate") {
        const candidate = row.payload.candidate as RTCIceCandidateInit;
        const pc = pcRef.current;
        if (pc?.remoteDescription) await pc.addIceCandidate(candidate);
        else iceQueueRef.current.push(candidate);
      }
      if (row.signal_type === "hangup") {
        toast.message("call ended softly 💗");
        cleanup();
        setPhase("ended");
      }
      if (row.signal_type === "screen-started") setPartnerSharing(true);
      if (row.signal_type === "screen-stopped") setPartnerSharing(false);
    } catch {
      setPhase("reconnecting");
    }
  }, [addQueuedIce, cleanup, currentUserId, ensurePeer, makeOffer, sendSignal]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = muted; });
    setMuted((m) => !m);
  };

  const startScreenShare = async () => {
    try {
      const pc = await ensurePeer();
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      screenStreamRef.current = stream;
      screenSenderRef.current = pc.addTrack(track, stream);
      setSharing(true);
      await sendSignal("screen-started");
      track.onended = () => void stopScreenShare();
      await makeOffer(false);
    } catch {
      toast.error("screen sharing was cancelled or blocked 🖥️");
    }
  };

  const stopScreenShare = async () => {
    const pc = pcRef.current;
    if (pc && screenSenderRef.current) pc.removeTrack(screenSenderRef.current);
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    screenSenderRef.current = null;
    setSharing(false);
    await sendSignal("screen-stopped");
    if (pc && pc.signalingState === "stable") await makeOffer(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`date-call-${virtualDateId}-${currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "date_call_signals",
        filter: `virtual_date_id=eq.${virtualDateId}`,
      }, (payload) => void handleSignal(payload.new as SignalRow))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [currentUserId, handleSignal, virtualDateId]);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = remoteStreamRef.current;
    if (screenRef.current) screenRef.current.srcObject = remoteStreamRef.current;
  }, [partnerSharing]);

  return (
    <div className="fixed inset-0 z-50 bg-earth/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl min-h-[70vh] bg-card rounded-3xl shadow-soft border-2 border-rose/30 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 gradient-blush text-white">
          <div>
            <p className="font-script text-2xl leading-none">private date call 💗</p>
            {subtitle && <p className="font-hand text-sm opacity-90">{subtitle}</p>}
          </div>
          <button onClick={endCall} className="size-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center" aria-label="close call">
            <X className="size-4" />
          </button>
        </div>

        <audio ref={audioRef} autoPlay playsInline />

        <div className="flex-1 p-5 sm:p-8 bg-gradient-to-br from-blush/10 via-card to-honey/10 flex flex-col items-center justify-center gap-6 text-center">
          <div className="relative flex items-center justify-center">
            <div className={`absolute size-40 rounded-full bg-blush/20 ${phase === "connected" ? "animate-ping" : "animate-pulse"}`} />
            <div className="relative size-36 rounded-full gradient-blush shadow-soft flex items-center justify-center text-white">
              <Phone className="size-12" />
            </div>
          </div>

          <div>
            <h2 className="font-script text-4xl text-earth">{statusText}</h2>
            <p className="font-hand text-xl text-rose mt-1">{phase === "connected" ? `Talking feels closer · ${formatTime(elapsed)}` : "soft, private, peer-to-peer"}</p>
          </div>

          {phase === "incoming" && (
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={acceptCall} className="px-6 py-3 rounded-full gradient-blush text-white font-semibold flex items-center gap-2 shadow-card"><Phone className="size-4" /> accept</button>
              <button onClick={rejectCall} className="px-6 py-3 rounded-full bg-blush/15 text-rose font-semibold flex items-center gap-2"><PhoneOff className="size-4" /> reject</button>
            </div>
          )}

          {phase === "idle" && (
            <button onClick={startCall} className="px-7 py-3 rounded-full gradient-blush text-white font-semibold flex items-center gap-2 shadow-card"><Phone className="size-4" /> start call</button>
          )}

          {(phase === "calling" || phase === "connecting" || phase === "connected" || phase === "reconnecting") && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={toggleMute} className="size-12 rounded-full bg-blush/15 text-rose hover:bg-blush/30 flex items-center justify-center" aria-label="mute microphone">
                {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>
              {withScreenShare && phase === "connected" && (
                <button onClick={sharing ? stopScreenShare : startScreenShare} className="px-4 h-12 rounded-full bg-blush/15 text-rose hover:bg-blush/30 flex items-center gap-2 font-semibold">
                  {sharing ? <ScreenShareOff className="size-5" /> : <ScreenShare className="size-5" />}
                  {sharing ? "stop sharing" : "share screen"}
                </button>
              )}
              <button onClick={endCall} className="size-12 rounded-full bg-rose text-white hover:opacity-90 flex items-center justify-center" aria-label="end call"><PhoneOff className="size-5" /></button>
            </div>
          )}

          {partnerSharing && (
            <div className={`${floating ? "fixed bottom-4 right-4 z-50 w-[18rem] max-w-[calc(100vw-2rem)]" : "w-full max-w-3xl"} rounded-3xl overflow-hidden border-2 border-rose/25 shadow-soft bg-earth`}>
              <div className="flex items-center justify-between px-4 py-2 gradient-blush text-white">
                <span className="font-hand text-lg flex items-center gap-2"><MonitorPlay className="size-4" /> your partner is sharing screen 🖥️</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFloating((v) => !v)} className="size-8 rounded-full bg-white/20 flex items-center justify-center" aria-label="toggle mini window"><Maximize2 className="size-4" /></button>
                </div>
              </div>
              <video ref={screenRef} autoPlay playsInline className="w-full aspect-video object-contain bg-earth" />
            </div>
          )}

          {phase === "reconnecting" && <p className="font-hand text-lg text-earth/60">Connection is unstable, please try again if it doesn’t return.</p>}
        </div>
      </div>
    </div>
  );
}

function formatTime(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
