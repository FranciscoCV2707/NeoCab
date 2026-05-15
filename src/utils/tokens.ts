import { Game } from "../stores/types";

type TokenFn = (game: Game, args: string) => string;

// Registry of token functions
const tokenFunctions: Record<string, TokenFn> = {};

export function registerTokenFunction(name: string, fn: TokenFn) {
  tokenFunctions[name] = fn;
}

export function getTokenValue(token: string, game: Game): string {
  switch (token) {
    case "Title": return game.title || "";
    case "Year": return game.year?.toString() || "";
    case "Developer": return game.developer || "";
    case "Publisher": return game.publisher || "";
    case "Genre": return game.genre || "";
    case "Players": return game.players ? `${game.players}P` : "";
    case "PlayedCount": return (game.play_count || 0).toString();
    case "PlayedTime": {
      const t = game.total_play_time || 0;
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    case "Rating": return game.rating ? game.rating.toFixed(1) : "";
    case "Description": return game.description || "";
    case "Favourite": return game.is_favorite ? "★" : "☆";
    case "LastPlayed": return game.last_played || "";
    case "Region": return ""; // not in current Game model
    case "Language": return ""; // not in current Game model
    default: return `[${token}]`;
  }
}

export function parseTokens(text: string, game: Game): string {
  return text.replace(/\[([!\w]+)(?::([^\]]*))?\]/g, (match, name, args) => {
    if (name.startsWith("!")) {
      // Function call: [!func_name:arg1,arg2]
      const fnName = name.slice(1);
      const fn = tokenFunctions[fnName];
      return fn ? fn(game, args || "") : match;
    }
    return getTokenValue(name, game);
  });
}

// Register built-in token functions
registerTokenFunction("upper", (game, args) => {
  const val = getTokenValue(args, game);
  return val.toUpperCase();
});

registerTokenFunction("lower", (game, args) => {
  const val = getTokenValue(args, game);
  return val.toLowerCase();
});

registerTokenFunction("truncate", (game, args) => {
  const [token, lenStr] = (args || "20").split(",");
  const val = getTokenValue(token, game);
  const len = parseInt(lenStr, 10) || 20;
  return val.length > len ? val.slice(0, len) + "..." : val;
});
