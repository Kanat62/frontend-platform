import { useEffect, useRef, type SyntheticEvent } from "react";
import Hls from "hls.js";
import { cn } from "@/shared/lib";

// Порт english-flow/src/components/shared.tsx (VideoPlayer).
// <video controls playsInline preload="metadata"> — TЗ §11.2 (lazy-load видео).
// HLS (Bunny отдаёт .m3u8): в Safari/iOS играет нативно, в Chrome/Firefox —
// через hls.js. Кастомный UI и трекинг прогресса (onTimeUpdate) не меняются —
// hls.js лишь «скармливает» байты в тот же <video>.

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

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    const isHls = src.includes(".m3u8");
    const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (isHls && !nativeHls && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onError?.();
      });
      return () => hls.destroy();
    }

    // Нативный HLS (Safari/iOS) либо обычный mp4/webm.
    video.src = src;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [src, onError]);

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
      />
    </div>
  );
}
