import { useMemo } from "react";
import { Game } from "../../stores/types";
import { useGameStore } from "../../stores/useGameStore";
import ReloadableImage from "./ReloadableImage";
import ReloadableText from "./ReloadableText";

interface LayoutDef {
  width?: number;
  height?: number;
  background?: string;
  components: LayoutComponent[];
}

interface LayoutComponent {
  id: string;
  type: "reloadableImage" | "reloadableVideo" | "reloadableText" | "container" | "menu" | "effect";
  source?: string;
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  alpha?: number;
  font?: string;
  fontSize?: number;
  color?: string;
  children?: LayoutComponent[];
  [key: string]: unknown;
}

interface LayoutEngineProps {
  layout: LayoutDef;
  style?: React.CSSProperties;
}

export default function LayoutEngine({ layout, style }: LayoutEngineProps) {
  const games = useGameStore((s) => s.games);
  const focusedIndex = useGameStore((s) => s.focusedIndex);
  const currentGame: Game | null = games[focusedIndex] || null;

  const containerStyle: React.CSSProperties = useMemo(() => ({
    width: layout.width || 1920,
    height: layout.height || 1080,
    background: layout.background || "#000",
    position: "relative",
    overflow: "hidden",
    ...style,
  }), [layout, style]);

  const renderComponent = (comp: LayoutComponent, index: number) => {
    const compStyle: React.CSSProperties = {
      position: "absolute",
      left: typeof comp.x === "number" ? comp.x : comp.x,
      top: typeof comp.y === "number" ? comp.y : comp.y,
      width: typeof comp.width === "number" ? comp.width : comp.width,
      height: typeof comp.height === "number" ? comp.height : comp.height,
      opacity: comp.alpha ?? 1,
      fontFamily: comp.font,
      fontSize: comp.fontSize,
      color: comp.color,
    };

    switch (comp.type) {
      case "reloadableImage":
        return (
          <ReloadableImage
            key={comp.id || index}
            source={comp.source || "screenshot"}
            game={currentGame}
            style={compStyle}
          />
        );

      case "reloadableText":
        return (
          <ReloadableText
            key={comp.id || index}
            source={comp.source || "[Title]"}
            game={currentGame}
            style={compStyle}
          />
        );

      case "container":
        return (
          <div key={comp.id || index} style={{ ...compStyle, overflow: "hidden" }}>
            {comp.children?.map((child, i) => renderComponent(child, i))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      {layout.components.map((comp, i) => renderComponent(comp, i))}
    </div>
  );
}
