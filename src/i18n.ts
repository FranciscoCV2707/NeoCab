type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

export const translations: Translations = {
  // Main Menu
  PLAY_ARCADE: { en: "PLAY ARCADE", es: "JUGAR ARCADE" },
  SCAN_ROMS: { en: "SCAN ROMS", es: "ESCANEAR JUEGOS" },
  SETTINGS: { en: "SETTINGS", es: "AJUSTES" },
  OPERATOR_PANEL: { en: "OPERATOR PANEL", es: "PANEL DE OPERADOR" },
  EXIT: { en: "EXIT", es: "SALIR" },
  SELECT_SYSTEM: { en: "SELECT SYSTEM", es: "SELECCIONAR SISTEMA" },
  CHOOSE_PLATFORM: { en: "CHOOSE YOUR PLATFORM", es: "ELIGE TU PLATAFORMA" },
  BACK: { en: "BACK", es: "ATRÁS" },
  
  // Game List
  FILTERS: { en: "Filters", es: "Filtros" },
  GAMES: { en: "games", es: "juegos" },
  ALL: { en: "All", es: "Todos" },
  FAVORITES: { en: "Favorites", es: "Favoritos" },
  CLEAR: { en: "Clear", es: "Limpiar" },
  SORT: { en: "Sort:", es: "Ordenar:" },
  GENRE: { en: "Genre:", es: "Género:" },
  YEAR: { en: "Year:", es: "Año:" },
  NO_GAMES_FOUND: { en: "No games found", es: "No se encontraron juegos" },
  SCAN_HINT: { en: "Scan ROMs to populate game library", es: "Escanea ROMs para poblar la biblioteca" },
  PLAYERS: { en: "Players", es: "Jugadores" },
  PLATFORM: { en: "Platform", es: "Plataforma" },
  
  // Sorting options
  TITLE: { en: "Title", es: "Título" },
  MOST_PLAYED: { en: "Most Played", es: "Más Jugados" },
  RATING: { en: "Rating", es: "Calificación" },
  
  // Attract Mode
  ATTRACT_MODE: { en: "ATTRACT MODE - INSERT COIN", es: "MODO DE DEMOSTRACIÓN - INSERTE MONEDA" },
  // Operator & Elite Features
  VISUAL_STYLES: { en: "VISUAL STYLES", es: "ESTILOS VISUALES" },
  LIBRARY_AUDIT: { en: "LIBRARY AUDIT", es: "AUDITORÍA DE BIBLIOTECA" },
  GENERAL_SETTINGS: { en: "GENERAL SETTINGS", es: "AJUSTES GENERALES" },
  TOP_SCORERS: { en: "TOP SCORERS", es: "MEJORES PUNTUACIONES" },
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  localStorage.setItem('neocab_language', lang);
}

export function getLanguage(): Language {
  const saved = localStorage.getItem('neocab_language') as Language;
  if (saved && (saved === 'en' || saved === 'es')) {
    currentLanguage = saved;
    return saved;
  }
  return currentLanguage;
}

export function t(key: keyof typeof translations): string {
  const lang = getLanguage();
  if (translations[key]) {
    return translations[key][lang] || translations[key].en;
  }
  return key as string;
}
