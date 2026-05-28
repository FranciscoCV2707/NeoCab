// hyperwheel-data.jsx — mock data for NeoCab HyperWheel theme
// All "logos" here are typographic placeholders. No branded artwork is recreated.

// ─── SYSTEMS ────────────────────────────────────────────────────────────────
//   kind:   'platform' | 'collection' | 'meta'
//   shape:  visual placeholder rendered in the System Picker
//           'cartridge' | 'disc' | 'umd' | 'minidisc' | 'chip' | 'gd-rom'
//           | 'star' | 'clock' | 'shuffle'
//   short:  3-4 letter code stamped on the placeholder media
const SYSTEMS = [
  // ── Cartridge-based consoles ──
  { id: 'nes',     kind: 'platform',  name: 'Nintendo NES',     tag: '8-BIT',          short: 'NES',  count: 714,  hue: 5,   hue2: 220, shape: 'cartridge' },
  { id: 'snes',    kind: 'platform',  name: 'Super Famicom',    tag: '16-BIT',         short: 'SFC',  count: 612,  hue: 300, hue2: 220, shape: 'cartridge' },
  { id: 'n64',     kind: 'platform',  name: 'Nintendo 64',      tag: '64-BIT',         short: 'N64',  count: 296,  hue: 130, hue2: 50,  shape: 'cartridge' },
  { id: 'gen',     kind: 'platform',  name: 'Mega Drive',       tag: '16-BIT',         short: 'MD',   count: 488,  hue: 5,   hue2: 240, shape: 'cartridge' },
  { id: 'neogeo',  kind: 'platform',  name: 'Neo Geo',          tag: 'MVS · AES',      short: 'NGEO', count: 148,  hue: 22,  hue2: 260, shape: 'cartridge' },

  // ── Disc-based consoles ──
  { id: 'psx',     kind: 'platform',  name: 'PlayStation',      tag: '32-BIT',         short: 'PSX',  count: 1204, hue: 240, hue2: 35,  shape: 'disc' },
  { id: 'sat',     kind: 'platform',  name: 'Saturn',           tag: '32-BIT',         short: 'SAT',  count: 220,  hue: 220, hue2: 35,  shape: 'disc' },
  { id: 'dc',      kind: 'platform',  name: 'Dreamcast',        tag: '128-BIT',        short: 'DC',   count: 218,  hue: 25,  hue2: 220, shape: 'gd-rom' },
  { id: 'gcn',     kind: 'platform',  name: 'GameCube',         tag: '128-BIT',        short: 'GCN',  count: 312,  hue: 280, hue2: 200, shape: 'minidisc' },
  { id: 'psp',     kind: 'platform',  name: 'PSP',              tag: 'PORTABLE',       short: 'PSP',  count: 264,  hue: 230, hue2: 310, shape: 'umd' },

  // ── Arcade PCBs ──
  { id: 'arcade',  kind: 'platform',  name: 'Arcade',           tag: 'JAMMA',          short: 'JAM',  count: 412,  hue: 35,  hue2: 195, shape: 'chip' },
  { id: 'cps1',    kind: 'platform',  name: 'CPS-1',            tag: 'CP SYSTEM I',    short: 'CP1',  count: 31,   hue: 280, hue2: 30,  shape: 'chip' },
  { id: 'cps2',    kind: 'platform',  name: 'CPS-2',            tag: 'CP SYSTEM II',   short: 'CP2',  count: 38,   hue: 200, hue2: 35,  shape: 'chip' },

  // ── Curated collections ──
  { id: 'col_metalslug', kind: 'collection', name: 'Metal Slug Saga',   tag: 'CURATED · 7 TITLES', short: 'MS',  count: 7,   hue: 12,  hue2: 195, shape: 'chip' },
  { id: 'col_streetf',   kind: 'collection', name: 'Street Warrior',    tag: 'CURATED · 11 TITLES',short: 'SW',  count: 11,  hue: 25,  hue2: 200, shape: 'chip' },
  { id: 'col_kof',       kind: 'collection', name: 'King of Brawlers',  tag: 'CURATED · 14 TITLES',short: 'KOB', count: 14,  hue: 260, hue2: 30,  shape: 'chip' },
  { id: 'col_shmups',    kind: 'collection', name: 'Bullet Hell',       tag: 'CURATED · 22 TITLES',short: 'BH',  count: 22,  hue: 320, hue2: 200, shape: 'chip' },

  // ── Meta lists ──
  { id: 'meta_favs',   kind: 'meta', name: 'Favorites',  tag: 'PINNED',     short: '★',  count: 18, hue: 330, hue2: 40,  shape: 'star' },
  { id: 'meta_recent', kind: 'meta', name: 'Recent',     tag: 'LAST 14 DAYS', short: '↻', count: 26, hue: 165, hue2: 260, shape: 'clock' },
  { id: 'meta_random', kind: 'meta', name: 'Shuffle',    tag: 'RANDOM PLAY', short: '?', count: 0,  hue: 60,  hue2: 320, shape: 'shuffle' },
];

// ─── GAMES ─────────────────────────────────────────────────────────────────
//   hue/hue2:      drives scene tint when selected
//   titleParts:    how to typeset the big logo (plain | { accent } | { stroke })
//   hasMedia:      false to demo the "missing asset" CRT fallback
//   systemId:      foreign key into SYSTEMS
const GAMES = [
  // ── Neo Geo ──
  { id:'g01', title:'Steel Recon',       sub:'Mission One · Insertion',
    titleParts:['STEEL',{accent:'RECON'}],
    systemId:'neogeo', system:'Neo Geo MVS', year:1996, manufacturer:'Nazca Corp.',
    genre:'Run & Gun', players:'1-2P COOP', favorite:true,  playCount:142, lastPlayed:'2 DAYS AGO',
    hue:22,  hue2:200, hasMedia:true },
  { id:'g02', title:'Fighters Glory 98', sub:'Ultimate Match',
    titleParts:['FIGHTERS',{stroke:'GLORY'},'98'],
    systemId:'neogeo', system:'Neo Geo MVS', year:1998, manufacturer:'SNKorp',
    genre:'Versus Fighting', players:'1-2P VS', favorite:true, playCount:312, lastPlayed:'YESTERDAY',
    hue:260, hue2:30, hasMedia:true },
  { id:'g08', title:'Wolves of Garou',   sub:'Mark of Hunger',
    titleParts:['WOLVES OF',{accent:'GAROU'}],
    systemId:'neogeo', system:'Neo Geo MVS', year:1999, manufacturer:'SNKorp',
    genre:'Versus Fighting', players:'1-2P VS', favorite:true,  playCount:204, lastPlayed:'TODAY',
    hue:45, hue2:270, hasMedia:true },
  { id:'g10', title:'Neon Trooper',      sub:'Sector 9',
    titleParts:[{accent:'NEON'},'TROOPER'],
    systemId:'neogeo', system:'Neo Geo MVS', year:1997, manufacturer:'Nazca Corp.',
    genre:'Run & Gun', players:'1-2P COOP', favorite:false, playCount:33, lastPlayed:'5 DAYS AGO',
    hue:165, hue2:320, hasMedia:true },
  { id:'g11', title:'Iron Knuckle',      sub:'Round 8',
    titleParts:['IRON',{stroke:'KNUCKLE'}],
    systemId:'neogeo', system:'Neo Geo MVS', year:1994, manufacturer:'SNKorp',
    genre:'Boxing', players:'1-2P VS', favorite:false, playCount:12, lastPlayed:'1 MONTH AGO',
    hue:60, hue2:200, hasMedia:true },

  // ── CPS-1 / CPS-2 ──
  { id:'g03', title:'Street Warrior II', sub:'World Tournament',
    titleParts:['STREET',{accent:'WARRIOR'},'II'],
    systemId:'cps1', system:'CPS-1', year:1991, manufacturer:'Capkom',
    genre:'Versus Fighting', players:'1-2P VS', favorite:false, playCount:89, lastPlayed:'1 WEEK AGO',
    hue:200, hue2:35, hasMedia:true },
  { id:'g04', title:'Asphalt Dinos',     sub:'The Lost Highway',
    titleParts:[{stroke:'ASPHALT'},'DINOS'],
    systemId:'cps1', system:'CPS-1', year:1993, manufacturer:'Capkom',
    genre:'Beat \u2019em Up', players:'1-3P COOP', favorite:false, playCount:24, lastPlayed:'3 WEEKS AGO',
    hue:35, hue2:195, hasMedia:true },
  { id:'g07', title:'Last Brawl',        sub:'Metro Riots',
    titleParts:['LAST',{accent:'BRAWL'}],
    systemId:'cps1', system:'CPS-1', year:1989, manufacturer:'Capkom',
    genre:'Beat \u2019em Up', players:'1-2P COOP', favorite:false, playCount:18, lastPlayed:'NEVER',
    hue:12, hue2:230, hasMedia:true },
  { id:'g06', title:'Heroes Across',     sub:'Crossover Saga',
    titleParts:['HEROES',{accent:'ACROSS'}],
    systemId:'cps2', system:'CPS-2', year:1998, manufacturer:'Capkom',
    genre:'Versus Fighting', players:'1-2P VS', favorite:false, playCount:51, lastPlayed:'2 WEEKS AGO',
    hue:320, hue2:30, hasMedia:false }, // missing-asset demo

  // ── Arcade JAMMA ──
  { id:'g05', title:'Frostbros',         sub:'Glacial Stage',
    titleParts:[{accent:'FROST'},'BROS'],
    systemId:'arcade', system:'Arcade JAMMA', year:1990, manufacturer:'Tomato Soft',
    genre:'Platformer', players:'1-2P COOP', favorite:true,  playCount:67, lastPlayed:'4 DAYS AGO',
    hue:210, hue2:280, hasMedia:true },
  { id:'g09', title:'Galaxy Veil',       sub:'Phase IV',
    titleParts:[{stroke:'GALAXY'},'VEIL'],
    systemId:'arcade', system:'Arcade JAMMA', year:1987, manufacturer:'Stargrid',
    genre:'Shoot \u2019em Up', players:'1-2P ALT', favorite:false, playCount:9, lastPlayed:'NEVER',
    hue:280, hue2:200, hasMedia:true },
  { id:'g12', title:'Voidstrike',        sub:'Cluster 03',
    titleParts:['VOID',{accent:'STRIKE'}],
    systemId:'arcade', system:'Arcade JAMMA', year:1995, manufacturer:'Stargrid',
    genre:'Shoot \u2019em Up', players:'1P', favorite:false, playCount:5, lastPlayed:'NEVER',
    hue:250, hue2:35, hasMedia:true },

  // ── NES ──
  { id:'g20', title:'Pixel Plumbers',    sub:'World 1-1',
    titleParts:['PIXEL',{accent:'PLUMBERS'}],
    systemId:'nes', system:'Nintendo NES', year:1985, manufacturer:'Kyoto Toy',
    genre:'Platformer', players:'1-2P ALT', favorite:true, playCount:188, lastPlayed:'TODAY',
    hue:5, hue2:220, hasMedia:true },
  { id:'g21', title:'Quest of Lurik',    sub:'The First Quest',
    titleParts:['QUEST OF',{accent:'LURIK'}],
    systemId:'nes', system:'Nintendo NES', year:1986, manufacturer:'Kyoto Toy',
    genre:'Action RPG', players:'1P', favorite:false, playCount:42, lastPlayed:'2 WEEKS AGO',
    hue:45, hue2:280, hasMedia:true },
  { id:'g22', title:'Megabot 2',         sub:'Wily\u2019s Return',
    titleParts:['MEGA',{stroke:'BOT'},'2'],
    systemId:'nes', system:'Nintendo NES', year:1988, manufacturer:'Capkom',
    genre:'Platformer', players:'1P', favorite:true, playCount:96, lastPlayed:'YESTERDAY',
    hue:200, hue2:35, hasMedia:true },
  { id:'g23', title:'Contrarunner',      sub:'Stage 1: Jungle',
    titleParts:['CONTRA',{accent:'RUNNER'}],
    systemId:'nes', system:'Nintendo NES', year:1988, manufacturer:'Konnami',
    genre:'Run & Gun', players:'1-2P COOP', favorite:false, playCount:71, lastPlayed:'1 WEEK AGO',
    hue:120, hue2:30, hasMedia:true },

  // ── SNES ──
  { id:'g30', title:'Sky Knights',       sub:'A Hero\u2019s Tale',
    titleParts:[{accent:'SKY'},'KNIGHTS'],
    systemId:'snes', system:'Super Famicom', year:1991, manufacturer:'Kyoto Toy',
    genre:'Action RPG', players:'1P', favorite:true, playCount:212, lastPlayed:'TODAY',
    hue:300, hue2:220, hasMedia:true },
  { id:'g31', title:'Chronotrek',        sub:'1000 A.D.',
    titleParts:['CHRONO',{accent:'TREK'}],
    systemId:'snes', system:'Super Famicom', year:1995, manufacturer:'Squarewave',
    genre:'JRPG', players:'1P', favorite:true, playCount:340, lastPlayed:'TODAY',
    hue:240, hue2:35, hasMedia:true },
  { id:'g32', title:'Donkey Cargo',      sub:'Kongo Jungle',
    titleParts:[{stroke:'DONKEY'},'CARGO'],
    systemId:'snes', system:'Super Famicom', year:1994, manufacturer:'Rare Co.',
    genre:'Platformer', players:'1-2P COOP', favorite:false, playCount:54, lastPlayed:'3 DAYS AGO',
    hue:35, hue2:120, hasMedia:true },

  // ── PSX ──
  { id:'g40', title:'Metal Stealth',     sub:'Tactical Espionage',
    titleParts:[{stroke:'METAL'},'STEALTH'],
    systemId:'psx', system:'PlayStation', year:1998, manufacturer:'Konnami',
    genre:'Stealth Action', players:'1P', favorite:true, playCount:178, lastPlayed:'YESTERDAY',
    hue:120, hue2:35, hasMedia:true },
  { id:'g41', title:'Final Wanderer VII',sub:'Midgar',
    titleParts:['FINAL',{accent:'WANDERER'},'VII'],
    systemId:'psx', system:'PlayStation', year:1997, manufacturer:'Squarewave',
    genre:'JRPG', players:'1P', favorite:true, playCount:402, lastPlayed:'TODAY',
    hue:240, hue2:35, hasMedia:true },
  { id:'g42', title:'Crash Trickster',   sub:'N. Sanity Beach',
    titleParts:['CRASH',{accent:'TRICKSTER'}],
    systemId:'psx', system:'PlayStation', year:1996, manufacturer:'Naught Dog',
    genre:'Platformer', players:'1P', favorite:false, playCount:60, lastPlayed:'1 WEEK AGO',
    hue:35, hue2:200, hasMedia:true },
  { id:'g43', title:'Silent Cradle',     sub:'Foggy Town',
    titleParts:[{stroke:'SILENT'},'CRADLE'],
    systemId:'psx', system:'PlayStation', year:1999, manufacturer:'Konnami',
    genre:'Survival Horror', players:'1P', favorite:false, playCount:22, lastPlayed:'2 WEEKS AGO',
    hue:0, hue2:220, hasMedia:false }, // missing-asset demo

  // ── PSP ──
  { id:'g50', title:'Patapaw',           sub:'Tribe March',
    titleParts:['PATA',{accent:'PAW'}],
    systemId:'psp', system:'PSP', year:2007, manufacturer:'PylonStudio',
    genre:'Rhythm', players:'1P', favorite:false, playCount:18, lastPlayed:'1 MONTH AGO',
    hue:165, hue2:30, hasMedia:true },
  { id:'g51', title:'Monster Quester',   sub:'Hunt Plaza',
    titleParts:['MONSTER',{accent:'QUESTER'}],
    systemId:'psp', system:'PSP', year:2008, manufacturer:'Capkom',
    genre:'Action Hunt', players:'1-4P COOP', favorite:true, playCount:266, lastPlayed:'YESTERDAY',
    hue:25, hue2:280, hasMedia:true },

  // ── GameCube ──
  { id:'g60', title:'Smash Royal',       sub:'Final Destination',
    titleParts:['SMASH',{accent:'ROYAL'}],
    systemId:'gcn', system:'GameCube', year:2001, manufacturer:'Kyoto Toy',
    genre:'Versus Brawler', players:'1-4P VS', favorite:true, playCount:512, lastPlayed:'TODAY',
    hue:280, hue2:200, hasMedia:true },
  { id:'g61', title:'Windborne',         sub:'Outset Isle',
    titleParts:['WIND',{stroke:'BORNE'}],
    systemId:'gcn', system:'GameCube', year:2003, manufacturer:'Kyoto Toy',
    genre:'Action Adventure', players:'1P', favorite:false, playCount:48, lastPlayed:'3 WEEKS AGO',
    hue:200, hue2:120, hasMedia:true },

  // ── Mega Drive ──
  { id:'g70', title:'Hedgehog Dash',     sub:'Green Hill',
    titleParts:[{accent:'HEDGEHOG'},'DASH'],
    systemId:'gen', system:'Mega Drive', year:1991, manufacturer:'Segma',
    genre:'Platformer', players:'1P', favorite:true, playCount:155, lastPlayed:'YESTERDAY',
    hue:240, hue2:35, hasMedia:true },
  { id:'g71', title:'Streets of Wrath',  sub:'Wood Oak City',
    titleParts:['STREETS OF',{accent:'WRATH'}],
    systemId:'gen', system:'Mega Drive', year:1992, manufacturer:'Segma',
    genre:'Beat \u2019em Up', players:'1-2P COOP', favorite:false, playCount:72, lastPlayed:'4 DAYS AGO',
    hue:30, hue2:280, hasMedia:true },

  // ── Dreamcast ──
  { id:'g80', title:'Soul Caliber',      sub:'Stage of History',
    titleParts:['SOUL',{accent:'CALIBER'}],
    systemId:'dc', system:'Dreamcast', year:1999, manufacturer:'Namko',
    genre:'Weapon Fighter', players:'1-2P VS', favorite:false, playCount:88, lastPlayed:'1 WEEK AGO',
    hue:25, hue2:220, hasMedia:true },
];

Object.assign(window, { SYSTEMS, GAMES });
