import { useEffect, useState } from "react";
import { getSignedMediaUrl } from "@/lib/signedUrl";

type CommonProps = {
  src: string;
  className?: string;
  alt?: string;
};

function useSigned(src: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    getSignedMediaUrl(src).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [src]);
  return url;
}

export function SignedImage({ src, className, alt = "" }: CommonProps) {
  const url = useSigned(src);
  if (!url) return <div className={`bg-blush/10 animate-pulse ${className ?? ""}`} />;
  return <img src={url} alt={alt} className={className} />;
}

export function SignedVideo({ src, className }: CommonProps) {
  const url = useSigned(src);
  if (!url) return <div className={`bg-blush/10 animate-pulse ${className ?? ""}`} />;
  return <video src={url} controls className={className} />;
}

export function SignedAudio({ src, className }: CommonProps) {
  const url = useSigned(src);
  if (!url) return <div className={`bg-blush/10 animate-pulse h-10 rounded ${className ?? ""}`} />;
  return <audio src={url} controls className={className} />;
}
