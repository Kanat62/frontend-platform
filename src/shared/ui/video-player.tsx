import { useEffect, useRef, type SyntheticEvent } from "react";
import Hls from "hls.js";
import { cn } from "@/shared/lib";

// Порт english-flow/src/components/shared.tsx (VideoPlayer).
// <video controls playsInline preload="metadata"> — TЗ §11.2 (lazy-load видео).
//
// HLS: Bunny отдаёт подписанный URL вида
//   https://<host>/bcdn_token=..&expires=..&token_path=../<videoId>/playlist.m3u8
// Токен — сегмент ПУТИ (не query), поэтому и hls.js, и нативный HLS в Safari
// сохраняют его при резолве относительных ссылок на <res>/video.m3u8 и .ts.

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
  // Колбэки — через ref, чтобы эффект инициализации hls.js зависел ТОЛЬКО от src.
  // Иначе нестабильная ссылка onError пересоздаёт Hls на каждый ре-рендер и
  // проигрывание не успевает начаться.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    const isHls = src.split("?")[0].endsWith(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onErrorRef.current?.();
      });
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
      return () => hls.destroy();
    }

    // Нативный HLS (Safari/iOS) либо обычный mp4/webm.
    video.src = src;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

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
