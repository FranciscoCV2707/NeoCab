import { useMemo } from "react";
import { Game } from "../../stores/types";
import { parseTokens } from "../../utils/tokens";

interface ReloadableTextProps {
  source: string;
  game: Game | null;
  className?: string;
  style?: React.CSSProperties;
}

export default function ReloadableText({ source, game, className, style }: ReloadableTextProps) {
  const text = useMemo(() => {
    if (!game) return source;
    return parseTokens(source, game);
  }, [source, game]);

  return (
    <span className={className} style={style}>
      {text}
    </span>
  );
}
