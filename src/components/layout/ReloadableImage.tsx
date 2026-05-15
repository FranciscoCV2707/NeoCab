import { useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Game } from "../../stores/types";

interface ReloadableImageProps {
  source: string;
  game: Game | null;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ARTWORK_KEY_MAP: Record<string, keyof Game> = {
  screenshot: "image_path",
  box_art: "image_path",
  wheel: "wheel_path",
  marquee: "marquee_path",
  fanart: "image_path",
  title: "image_path",
};

export default function ReloadableImage({ source, game, fallback, className, style }: ReloadableImageProps) {
  const src = useMemo(() => {
    if (!game) return fallback;
    const field = ARTWORK_KEY_MAP[source];
    const path = field ? game[field] : undefined;
    if (typeof path === "string") {
      try { return convertFileSrc(path); } catch { return path; }
    }
    return fallback;
  }, [source, game, fallback]);

  if (!src) return null;
  return <img src={src} alt="" className={className} style={style} />;
}
