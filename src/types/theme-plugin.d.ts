export interface NeoCabAPI {
  version: string;
  getCurrentView(): string;
  getFocusedIndex(): number;
  getCurrentSystem(): object | null;
  getSystemCards(): NodeListOf<Element>;
  getCssVar(name: string): string;
  /** Only --theme-* prefixed vars are allowed */
  setCssVar(name: string, value: string): void;
}

export interface ThemeNavigateEvent {
  direction: 'up' | 'down' | 'left' | 'right' | 'page_up' | 'page_down';
  fromIndex: number;
  toIndex: number;
  view: string;
}

export interface ThemeViewChangeEvent {
  from: string;
  to: string;
}

export interface ThemeFocusEvent {
  item: unknown;
  index: number;
  view: string;
}

export interface ThemeSelectEvent {
  item: unknown;
  view: string;
}

export interface ThemeBackEvent {
  fromView: string;
}

export interface ThemeLifecycle {
  onMount?(api: NeoCabAPI): void;
  onNavigate?(e: ThemeNavigateEvent): void;
  onViewChange?(e: ThemeViewChangeEvent): void;
  onFocus?(e: ThemeFocusEvent): void;
  onSelect?(e: ThemeSelectEvent): void;
  onBack?(e: ThemeBackEvent): void;
  onUnmount?(): void;
}

declare global {
  interface Window {
    NeoCabAPI?: NeoCabAPI;
  }
}
