// themes-data.jsx — shared mock data for the NeoCab theme pack
// Real arcade game titles used as TEXT references only — logos are typographic placeholders,
// not the original branded artwork. Suitable for prototype/design use.

const PACK_SYSTEMS = [
  { id: 'arcade',  name: 'Arcade',       tag: 'JAMMA / Misc PCBs', short: 'ARC',  count: 412,  hue: 35,  hue2: 195, shape: 'chip',      year: '1971+'},
  { id: 'neogeo',  name: 'Neo Geo',      tag: 'MVS · AES',         short: 'NGEO', count: 148,  hue: 22,  hue2: 260, shape: 'cartridge', year: 1990  },
  { id: 'cps1',    name: 'CPS-1',        tag: 'CP System I',       short: 'CP1',  count: 31,   hue: 280, hue2: 30,  shape: 'chip',      year: 1988  },
  { id: 'cps2',    name: 'CPS-2',        tag: 'CP System II',      short: 'CP2',  count: 38,   hue: 200, hue2: 35,  shape: 'chip',      year: 1993  },
  { id: 'snes',    name: 'Super Nintendo',tag: '16-bit · SFC',     short: 'SFC',  count: 612,  hue: 300, hue2: 220, shape: 'cartridge', year: 1990  },
  { id: 'genesis', name: 'Sega Genesis', tag: 'Mega Drive · 16-bit',short:'MD',   count: 488,  hue: 5,   hue2: 240, shape: 'cartridge', year: 1988  },
  { id: 'psx',     name: 'PlayStation',  tag: '32-bit · 1994',     short: 'PSX',  count: 1204, hue: 240, hue2: 35,  shape: 'disc',      year: 1994  },
  { id: 'dc',      name: 'Dreamcast',    tag: '128-bit · 1998',    short: 'DC',   count: 218,  hue: 25,  hue2: 220, shape: 'gd-rom',    year: 1998  },
];

// titleParts: how the typographic placeholder logo is rendered
//   - 'STRING' → plain
//   - { accent: 'X' } → tinted accent
//   - { stroke: 'X' } → outlined
const PACK_GAMES = [
  {
    id: 'metalslug',
    title: 'Metal Slug',
    titleParts: [{ accent:'METAL' }, 'SLUG'],
    sub: 'Mission One · Insertion',
    system: 'Neo Geo', systemId: 'neogeo',
    year: 1996, manufacturer: 'Nazca · SNK',
    genre: 'Run & Gun', players: '1-2P COOP',
    driver: 'neogeo.cpp', romset: 'mslug',
    favorite: true,  playCount: 142, lastPlayed: '2 days ago',
    hue: 22, hue2: 200,
    hasVideo: true, hasScreenshot: true, hasMarquee: true, hasBackground: true,
    tagline: 'Heavy machine gun on the western front.',
  },
  {
    id: 'kof98',
    title: 'The King of Fighters 98',
    titleParts: ['KING OF', { accent:'FIGHTERS' }, '98'],
    sub: 'Ultimate Match · Team Battle',
    system: 'Neo Geo', systemId: 'neogeo',
    year: 1998, manufacturer: 'SNK',
    genre: 'Versus Fighting', players: '1-2P VS',
    driver: 'neogeo.cpp', romset: 'kof98',
    favorite: true,  playCount: 312, lastPlayed: 'Yesterday',
    hue: 260, hue2: 30,
    hasVideo: true, hasScreenshot: true, hasMarquee: true, hasBackground: true,
    tagline: 'The dream match. 38 fighters, no holds barred.',
  },
  {
    id: 'sf2',
    title: 'Street Fighter II',
    titleParts: ['STREET', { accent:'FIGHTER' }, 'II'],
    sub: 'The World Warrior',
    system: 'CPS-1', systemId: 'cps1',
    year: 1991, manufacturer: 'Capcom',
    genre: 'Versus Fighting', players: '1-2P VS',
    driver: 'cps1.cpp', romset: 'sf2',
    favorite: false, playCount: 89,  lastPlayed: '1 week ago',
    hue: 200, hue2: 35,
    hasVideo: true, hasScreenshot: true, hasMarquee: true, hasBackground: true,
    tagline: 'You must defeat me to stand a chance.',
  },
  {
    id: 'cadillacs',
    title: 'Cadillacs and Dinosaurs',
    titleParts: [{ stroke:'CADILLACS' }, '& DINOS'],
    sub: 'Mustapha · Mess · Jack · Hannah',
    system: 'CPS-1', systemId: 'cps1',
    year: 1993, manufacturer: 'Capcom',
    genre: 'Beat \u2019em Up', players: '1-3P COOP',
    driver: 'cps1.cpp', romset: 'cadillac',
    favorite: false, playCount: 24,  lastPlayed: '3 weeks ago',
    hue: 35, hue2: 195,
    hasVideo: false, hasScreenshot: true, hasMarquee: true, hasBackground: false, // screenshot fallback
    tagline: 'A prehistoric beat-em-up with classic cars.',
  },
  {
    id: 'snowbros',
    title: 'Snow Bros',
    titleParts: [{ accent:'SNOW' }, 'BROS'],
    sub: 'Nick · Tom · Glacial Stage',
    system: 'Arcade', systemId: 'arcade',
    year: 1990, manufacturer: 'Toaplan',
    genre: 'Platformer', players: '1-2P COOP',
    driver: 'snowbros.cpp', romset: 'snowbros',
    favorite: true,  playCount: 67, lastPlayed: '4 days ago',
    hue: 210, hue2: 280,
    hasVideo: true, hasScreenshot: true, hasMarquee: true, hasBackground: true,
    tagline: 'Roll snowballs over every enemy on screen.',
  },
  {
    id: 'mvc',
    title: 'Marvel vs Capcom',
    titleParts: ['MARVEL VS', { accent:'CAPCOM' }],
    sub: 'Clash of Super Heroes',
    system: 'CPS-2', systemId: 'cps2',
    year: 1998, manufacturer: 'Capcom',
    genre: 'Versus Fighting', players: '1-2P VS',
    driver: 'cps2.cpp', romset: 'mvsc',
    favorite: false, playCount: 51, lastPlayed: '2 weeks ago',
    hue: 320, hue2: 30,
    hasVideo: false, hasScreenshot: false, hasMarquee: false, hasBackground: false, // FALLBACK demo
    tagline: 'Crossover tag-team action.',
  },
  {
    id: 'finalfight',
    title: 'Final Fight',
    titleParts: ['FINAL', { accent:'FIGHT' }],
    sub: 'Metro City · 1989',
    system: 'CPS-1', systemId: 'cps1',
    year: 1989, manufacturer: 'Capcom',
    genre: 'Beat \u2019em Up', players: '1-2P COOP',
    driver: 'cps1.cpp', romset: 'ffight',
    favorite: false, playCount: 18, lastPlayed: 'Never',
    hue: 12, hue2: 230,
    hasVideo: true, hasScreenshot: true, hasMarquee: true, hasBackground: true,
    tagline: 'Mayor Haggar fights for his daughter.',
  },
  {
    id: 'garou',
    title: 'Garou: Mark of the Wolves',
    titleParts: ['GAROU', { accent:'MOTW' }],
    sub: 'The next generation of fighters',
    system: 'Neo Geo', systemId: 'neogeo',
    year: 1999, manufacturer: 'SNK',
    genre: 'Versus Fighting', players: '1-2P VS',
    driver: 'neogeo.cpp', romset: 'garou',
    favorite: true,  playCount: 204, lastPlayed: 'Today',
    hue: 45, hue2: 270,
    hasVideo: true, hasScreenshot: true, hasMarquee: true, hasBackground: true,
    tagline: 'Stylish 2D fighting at its peak.',
  },
];

const PACK_FILTERS = [
  { id: 'all',      label: 'All Games' },
  { id: 'favs',     label: 'Favorites' },
  { id: 'most',     label: 'Most Played' },
  { id: 'recent',   label: 'Recent' },
  { id: 'fight',    label: 'Versus Fighting' },
  { id: 'beat',     label: 'Beat \u2019em Up' },
  { id: 'platform', label: 'Platformer' },
];

// ─── Library generator ─────────────────────────────────────────────────────
// A real arcade system holds hundreds of ROMs. PACK_GAMES only has a handful of
// hero titles, so buildSystemLibrary() returns those real entries first and then
// deterministically synthesises believable filler titles up to `cap`, so a
// "game wall" UI can show a dense, scrollable, filterable grid per system.
const LIB_A = ['Neon','Cosmic','Dragon','Turbo','Shadow','Hyper','Mega','Astro','Iron','Crimson','Galaxy','Thunder','Cyber','Phantom','Samurai','Rocket','Laser','Vortex','Blaze','Striker','Solar','Onyx','Aero','Magna','Delta','Omega','Razor','Nova','Pulse','Titan','Jade','Vega','Quasar','Ronin','Falcon'];
const LIB_B = ['Strike','Raiders','Fist','Warriors','Legend','Circuit','Patrol','Brawl','Force','Quest','Rally','Storm','Arena','Squadron','Hunter','Saga','Drift','Blitz','Champ','Riot','Rangers','Frontier','Combat','Rush','Guardian','Sentinel','Crusade','Vanguard','Empire','Showdown','Gambit','Reckoning','Overdrive'];
const LIB_S = ['','',' II',' EX',' Turbo',' DX',' R',' Zero',' \u201995',' Plus',' Neo',' \u201998'];
const LIB_GENRES = ['Versus Fighting','Beat \u2019em Up','Run & Gun','Platformer','Shoot \u2019em Up','Racing','Puzzle','Action'];
const LIB_MAKERS = ['Capcom','SNK','Konami','Sega','Taito','Namco','Toaplan','Irem','Data East','Technos','Atlus','Jaleco'];
const LIB_LP = ['Never','Never','Today','Yesterday','3 days ago','Last week','2 weeks ago','1 month ago'];

function libHash(n) { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
function libPick(arr, n) { return arr[Math.floor(libHash(n) * arr.length) % arr.length]; }

function buildSystemLibrary(sys, cap = 120) {
  const real = window.PACK_GAMES.filter(g => g.systemId === sys.id);
  const total = Math.min(sys.count, cap);
  const out = real.slice();
  const base = sys.id.length * 17 + 5;
  for (let i = out.length; i < total; i++) {
    const s = base + i * 9;
    const a = libPick(LIB_A, s), b = libPick(LIB_B, s + 1), suf = libPick(LIB_S, s + 2);
    const genre = libPick(LIB_GENRES, s + 3), maker = libPick(LIB_MAKERS, s + 4);
    const year = (typeof sys.year === 'number' ? sys.year : 1985) + Math.floor(libHash(s + 5) * 12);
    out.push({
      id: `${sys.id}-g${i}`,
      title: `${a} ${b}${suf}`,
      titleParts: [{ accent: a }, `${b}${suf}`],
      sub: `${maker} \u00b7 ${year}`,
      system: sys.name, systemId: sys.id,
      year, manufacturer: maker, genre, players: libHash(s + 9) > .5 ? '1-2P' : '1P',
      driver: `${sys.id}.cpp`, romset: `${a.toLowerCase()}${i}`,
      favorite: libHash(s + 6) > 0.86,
      playCount: Math.floor(libHash(s + 7) * 240),
      lastPlayed: libPick(LIB_LP, s + 8),
      hue: Math.floor(libHash(s + 10) * 360), hue2: Math.floor(libHash(s + 11) * 360),
      hasVideo: libHash(s + 12) > .45, hasScreenshot: libHash(s + 13) > .2,
      hasMarquee: true, hasBackground: libHash(s + 14) > .5,
      tagline: 'Drop a coin and find out.',
      generated: true,
    });
  }
  return out;
}
window.buildSystemLibrary = buildSystemLibrary;


// Theme registry — used by the host to render the switcher + mount the active theme
const THEME_REGISTRY = [
  {
    id: 'batocera',
    name: 'Batocera Station',
    tagline: 'Clean · Modern Retro · System OS',
    inspiration: 'Batocera · EmulationStation · RetroBat',
    status: 'ready',
    accent: 'oklch(70% 0.18 220)',
    accent2: 'oklch(70% 0.18 280)',
    preview: 'horizontal-rail',
  },
  {
    id: 'operator',
    name: 'Advance Operator',
    tagline: 'CRT Phosphor · Dense ROM list · Operator-grade',
    inspiration: 'AdvanceMENU · AdvanceMAME · Arcade-shop tools',
    status: 'ready',
    accent: 'oklch(82% 0.20 130)',
    accent2: 'oklch(78% 0.20 75)',
    preview: 'crt-list',
  },
  {
    id: 'hyperrush',
    name: 'HyperWheel Rush',
    tagline: 'Aggressive · Curved wheel · Big neon',
    inspiration: 'HyperSpin · Custom arcade carts',
    status: 'ready',
    accent: 'oklch(70% 0.22 35)',
    accent2: 'oklch(70% 0.22 320)',
    preview: 'wheel-curve',
  },
  {
    id: 'attractflux',
    name: 'Attract Flux',
    tagline: 'Floating panels · Diagonal layouts · Artistic',
    inspiration: 'Attract-Mode · Configurable arcade frontends',
    status: 'ready',
    accent: 'oklch(70% 0.22 290)',
    accent2: 'oklch(75% 0.20 50)',
    preview: 'angled-panels',
  },
  {
    id: 'neonwall',
    name: 'CoinOps Neon Wall',
    tagline: 'Cinematic · Premium · Game wall',
    inspiration: 'CoinOPS · BigBox · LaunchBox fullscreen',
    status: 'ready',
    accent: 'oklch(72% 0.22 270)',
    accent2: 'oklch(72% 0.20 340)',
    preview: 'cinematic-wall',
  },
];

Object.assign(window, { PACK_SYSTEMS, PACK_GAMES, PACK_FILTERS, THEME_REGISTRY });
