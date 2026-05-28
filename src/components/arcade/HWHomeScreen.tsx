interface HWHomeScreenProps {
  totalGames: number;
  totalSystems: number;
  onPlay: () => void;
  onOperator: () => void;
  onSettings: () => void;
  onScan: () => void;
  loading: boolean;
  scanProgress: string;
  focusedIndex: number;
}

const MENU_ITEMS = [
  { id: 'play',     icon: '▶', label: 'JUGAR',    tag: 'Seleccionar plataforma' },
  { id: 'scan',     icon: '◎', label: 'ESCANEAR', tag: 'Buscar ROMs y juegos' },
  { id: 'settings', icon: '⚙', label: 'AJUSTES',  tag: 'Tema · Idioma · Audio' },
  { id: 'operator', icon: '⛭', label: 'OPERADOR', tag: 'Panel de administración' },
];

const TICKER_GAMES = ['STEEL RECON','CHRONOTREK','WOLVES OF GAROU','METAL STEALTH','SMASH ROYAL','FROSTBROS','FIGHTERS GLORY 98','PIXEL PLUMBERS'];

export function HWHomeScreen({
  totalGames, totalSystems,
  onPlay, onOperator, onSettings, onScan,
  loading, scanProgress, focusedIndex,
}: HWHomeScreenProps) {
  const handlers: Record<string, () => void> = { play: onPlay, scan: onScan, settings: onSettings, operator: onOperator };

  return (
    <div className="hw-home">
      {/* LEFT */}
      <div className="hw-home-left">
        <div className="hw-home-eyebrow">
          <span className="dot" />
          <span>SYSTEM ONLINE · CRT WARM · BUILD 2.2</span>
        </div>

        <div className="hw-home-mark">
          <div className="hw-home-mark-line one">NEO</div>
          <div className="hw-home-mark-line two">CAB</div>
          <div className="hw-home-mark-sub">
            HYPER<span className="amber">WHEEL</span> · ARCADE FRONTEND
          </div>
        </div>

        <div className="hw-home-stats">
          <div className="hw-home-stat">
            <div className="k">Total títulos</div>
            <div className="v tab">{totalGames.toLocaleString()}</div>
          </div>
          <div className="hw-home-stat">
            <div className="k">Sistemas</div>
            <div className="v tab">{totalSystems}</div>
          </div>
          <div className="hw-home-stat">
            <div className="k">Emuladores</div>
            <div className="v tab">300+</div>
          </div>
          <div className="hw-home-stat">
            <div className="k">Estado</div>
            <div className="v">{loading ? 'CARGANDO' : 'LISTO'}</div>
          </div>
        </div>

        <div className="hw-home-ticker">
          <span className="ttl">NOW SHOWING</span>
          <div className="hw-ticker-track">
            {/* duplicate for seamless loop */}
            <div className="hw-ticker-inner">
              {[...TICKER_GAMES, ...TICKER_GAMES].map((g, i) => (
                <span key={i}>{g}{i < TICKER_GAMES.length * 2 - 1 && <span className="pip"> ◆ </span>}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hw-home-right">
        <div className="hw-menu-head">
          <span className="line" />
          <span className="lbl">MAIN MENU</span>
          <span className="line" />
        </div>

        <div className="hw-home-menu">
          {MENU_ITEMS.map((it, i) => (
            <button
              key={it.id}
              className={`hw-menu-item${i === focusedIndex ? ' active' : ''}`}
              onClick={handlers[it.id]}
              disabled={loading}
              tabIndex={-1}
            >
              <span className="mi-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="mi-icon">{it.icon}</span>
              <span className="mi-body">
                <span className="mi-label">{it.label}</span>
                <span className="mi-tag">{it.tag}</span>
              </span>
              {i === focusedIndex && <span className="mi-arrow">▶</span>}
            </button>
          ))}
        </div>

        <div className="hw-credits-strip">
          {loading
            ? <>{scanProgress || 'CARGANDO…'}</>
            : <>INSERT COIN · <b>{totalGames}</b> TÍTULOS · FREE PLAY</>
          }
        </div>
      </div>
    </div>
  );
}
