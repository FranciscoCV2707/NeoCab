import { useState, useCallback } from 'react';
import { useScraper, useScraperConfig } from '../scrapers/useScraperHook';
import { PROVIDER_INFO, type ScraperProvider, type MediaType } from '../scrapers/types';
import { useTranslation } from '../i18n';
import './ScraperPanel.css';

interface ScraperPanelProps {
  gameId?: number;
  gameTitle?: string;
  onScrapeComplete?: (images: Record<string, string>) => void;
  onClose?: () => void;
}

export function ScraperPanel({ gameId, gameTitle, onScrapeComplete, onClose }: ScraperPanelProps) {
  const { t } = useTranslation();
  const {
    searchResults,
    isSearching,
    isScraping,
    scrapeProgress,
    searchGames,
    scrapeMultiple,
    clearSearch,
    activeProvider,
    setActiveProvider,
  } = useScraper();

  const [query, setQuery] = useState(gameTitle || '');
  const [searched, setSearched] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>(['marquee', 'wheel', 'box']);

  const { config: localConfig } = useScraperConfig('local');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearched(true);
    await searchGames(query);
  }, [query, searchGames]);

  const handleScrapeSelected = useCallback(async () => {
    if (!selectedResult) return;
    const result = searchResults.find((r) => r.gameId === selectedResult);
    if (result) {
      onScrapeComplete?.({
        marquee: result.image || '',
        wheel: result.image || '',
      });
    }
  }, [selectedResult, searchResults, onScrapeComplete]);

  const handleBatchScrape = useCallback(async () => {
    if (!gameId) return;
    const results = await scrapeMultiple([gameId], mediaTypes);
    if (results[0]?.success) {
      onScrapeComplete?.(results[0].images as Record<string, string>);
    }
  }, [gameId, mediaTypes, onScrapeComplete, scrapeMultiple]);

  const toggleMediaType = (type: MediaType) => {
    setMediaTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="scraper-panel">
      <div className="scraper-header">
        <h3>{t('settings.scrapers')}</h3>
        {onClose && (
          <button className="scraper-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="scraper-provider-tabs">
        {Object.values(PROVIDER_INFO).map((provider) => (
          <button
            key={provider.id}
            className={`provider-tab ${activeProvider === provider.id ? 'active' : ''}`}
            onClick={() => setActiveProvider(provider.id)}
            title={provider.requiresAuth ? 'Requires credentials' : 'No authentication needed'}
          >
            {provider.name}
            {provider.requiresAuth && <span className="auth-badge">*</span>}
          </button>
        ))}
      </div>

      <div className="scraper-search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('nav.search')}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? '...' : t('nav.search')}
        </button>
      </div>

      {searched && searchResults.length > 0 && (
        <div className="scraper-results">
          <h4>{t('game.title')}</h4>
          <ul className="results-list">
            {searchResults.map((result) => (
              <li
                key={result.gameId}
                className={`result-item ${selectedResult === result.gameId ? 'selected' : ''}`}
                onClick={() => setSelectedResult(result.gameId)}
              >
                {result.image && <img src={result.image} alt="" className="result-thumb" />}
                <div className="result-info">
                  <span className="result-title">{result.title}</span>
                  <span className="result-year">{result.year || 'N/A'}</span>
                  <span className="result-system">{result.system || 'Unknown'}</span>
                </div>
                <span className="result-provider">{result.provider}</span>
              </li>
            ))}
          </ul>
          <button
            className="scrape-selected-btn"
            onClick={handleScrapeSelected}
            disabled={!selectedResult}
          >
            {t('game.play')} - {t('menu.scan_roms')}
          </button>
        </div>
      )}

      {searched && searchResults.length === 0 && !isSearching && (
        <div className="scraper-empty">
          <p>{t('game.no_games')}</p>
          <button onClick={clearSearch}>{t('filter.clear')}</button>
        </div>
      )}

      {gameId && (
        <div className="scraper-batch">
          <h4>{t('menu.scan_roms')}</h4>
          <div className="media-types">
            {(['marquee', 'wheel', 'box', 'screenshot', 'video', 'title'] as MediaType[]).map((type) => (
              <label key={type} className="media-checkbox">
                <input
                  type="checkbox"
                  checked={mediaTypes.includes(type)}
                  onChange={() => toggleMediaType(type)}
                />
                {type}
              </label>
            ))}
          </div>
          <button onClick={handleBatchScrape} disabled={isScraping || mediaTypes.length === 0}>
            {isScraping ? `${scrapeProgress.completed}/${scrapeProgress.total}` : t('menu.scan_roms')}
          </button>
        </div>
      )}

      {isScraping && (
        <div className="scraper-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(scrapeProgress.completed / scrapeProgress.total) * 100}%` }}
            />
          </div>
          <span className="progress-text">{scrapeProgress.current}</span>
        </div>
      )}
    </div>
  );
}