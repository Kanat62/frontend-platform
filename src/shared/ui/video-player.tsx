import { useRef, type SyntheticEvent } from "react";
import { cn } from "@/shared/lib";

// Порт english-flow/src/components/shared.tsx (VideoPlayer).
// <video controls playsInline preload="metadata"> — TЗ §11.2 (lazy-load видео).

export function VideoPlayer({
  src,
  className,
  poster,
  onError,
  onTimeUpdate,
  onEnded,
}: {
  src: string;
  className?: string;
  poster?: string;
  onError?: () => void;
  onTimeUpdate?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (e: SyntheticEvent<HTMLVideoElement>) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <video
        key={src}
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        onError={onError}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        className="absolute inset-0 size-full"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
