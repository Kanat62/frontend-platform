import { useEffect, useRef, type SyntheticEvent } from "react";
import Hls from "hls.js";
import { cn } from "@/shared/lib";

// Порт english-flow/src/components/shared.tsx (VideoPlayer).
// <video controls playsInline preload="metadata"> — TЗ §11.2 (lazy-load видео).
//
// HLS: Bunny отдаёт мастер-плейлист .m3u8 с ОТНОСИТЕЛЬНЫМИ ссылками на
// <res>/video.m3u8 и .ts-сегменты — без токена. Подписанный URL несёт
// `?token=..&expires=..&token_path=/<videoId>/`; тот же query-string нужно
// дописать КО ВСЕМ дочерним запросам, иначе Bunny вернёт 403 и плеер «молчит».
// Делаем это кастомным лоадером hls.js. Кастомный UI и onTimeUpdate не меняются.

function makeBunnyLoader(authQuery: string) {
  const Base = Hls.DefaultConfig.loader as unknown as { new (config: unknown): Record<string, unknown> };
  return class BunnyLoader extends Base {
    load(context: { url: string }, config: unknown, callbacks: unknown) {
      if (authQuery && !context.url.includes("token=")) {
        context.url += (context.url.includes("?") ? "&" : "?") + authQuery;
      }
      // @ts-expect-error — вызываем метод базового XHR-лоадера hls.js
      super.load(context, config, callbacks);
    }
  } as unknown as typeof Hls.DefaultConfig.loader;
}

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

    const [path, query = ""] = src.split("?");
    const isHls = path.endsWith(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        loader: query ? makeBunnyLoader(query) : Hls.DefaultConfig.loader,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onError?.();
      });
      return () => hls.destroy();
    }

    // Нативный HLS (Safari/iOS до 17.1) либо обычный mp4/webm. Safari сам
    // прокидывает query-string мастер-плейлиста в дочерние запросы.
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
