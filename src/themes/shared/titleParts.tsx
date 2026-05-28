// shared/titleParts.tsx — renders game.titleParts array into React nodes
import React from 'react';

export type TitlePart = string | { accent: string } | { stroke: string };

function isAccent(p: TitlePart): p is { accent: string } {
  return typeof p === 'object' && 'accent' in p;
}
function isStroke(p: TitlePart): p is { stroke: string } {
  return typeof p === 'object' && 'stroke' in p;
}

// Renders titleParts array into a span sequence. prefix adds leading space before each part.
export function TitleParts({
  parts,
  prefix = ' ',
  render,
}: {
  parts: TitlePart[];
  prefix?: string;
  render?: (text: string, cls: string | null) => React.ReactNode;
}) {
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === 'string') {
          return (
            <React.Fragment key={i}>
              {i > 0 && prefix}
              {render ? render(p, null) : <span>{p}</span>}
            </React.Fragment>
          );
        }
        if (isAccent(p)) {
          return (
            <React.Fragment key={i}>
              {i > 0 && prefix}
              {render ? render(p.accent, 'accent') : <span className="accent">{p.accent}</span>}
            </React.Fragment>
          );
        }
        if (isStroke(p)) {
          return (
            <React.Fragment key={i}>
              {i > 0 && prefix}
              {render ? render(p.stroke, 'stroke') : <span className="stroke">{p.stroke}</span>}
            </React.Fragment>
          );
        }
        return null;
      })}
    </>
  );
}

// Build titleParts from a plain title string (splits on uppercase boundaries)
export function buildTitleParts(title: string): TitlePart[] {
  const parts: TitlePart[] = [];
  const upperPlaces: { index: number; char: string }[] = [];
  for (let i = 1; i < title.length; i++) {
    if (title[i] >= 'A' && title[i] <= 'Z' && title[i - 1] >= 'a') {
      upperPlaces.push({ index: i, char: title[i] });
    }
  }
  if (upperPlaces.length > 0 && upperPlaces[0].index > 1) {
    parts.push(title.slice(0, upperPlaces[0].index));
    for (let j = 0; j < upperPlaces.length; j++) {
      const start = upperPlaces[j].index;
      const end = j + 1 < upperPlaces.length ? upperPlaces[j + 1].index : title.length;
      const seg = title.slice(start, end);
      if (j % 2 === 0) {
        parts.push({ accent: seg });
      } else {
        parts.push(seg);
      }
    }
  } else {
    parts.push(title);
  }
  return parts;
}