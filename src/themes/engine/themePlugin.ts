import { readTextFile } from '@tauri-apps/plugin-fs';
import { buildNeoCabAPI } from './neoCabApi';
import type { ThemeLifecycle } from '../../types/theme-plugin';

let _cssLinkEl: HTMLLinkElement | null = null;
let _cssBlobUrl: string | null = null;
let _jsModule: ThemeLifecycle | null = null;
let _jsBlobUrl: string | null = null;

export async function injectThemeAssets(
  _slug: string,
  themePath: string
): Promise<void> {
  await unloadThemeAssets();

  try {
    const cssText = await readTextFile(`${themePath}/theme.css`);
    _cssBlobUrl = URL.createObjectURL(new Blob([cssText], { type: 'text/css' }));
    const link = document.createElement('link');
    link.id = 'theme-plugin-css';
    link.rel = 'stylesheet';
    link.href = _cssBlobUrl;
    document.head.appendChild(link);
    _cssLinkEl = link;
  } catch {
    // theme.css is optional
  }

  try {
    const jsText = await readTextFile(`${themePath}/theme.js`);
    _jsBlobUrl = URL.createObjectURL(
      new Blob([jsText], { type: 'text/javascript' })
    );
    _jsModule = (await import(/* @vite-ignore */ _jsBlobUrl)) as ThemeLifecycle;
    _jsModule.onMount?.(buildNeoCabAPI());
  } catch {
    // theme.js is optional
  }
}

export async function unloadThemeAssets(): Promise<void> {
  _jsModule?.onUnmount?.();
  _jsModule = null;

  _cssLinkEl?.remove();
  _cssLinkEl = null;

  if (_cssBlobUrl) {
    URL.revokeObjectURL(_cssBlobUrl);
    _cssBlobUrl = null;
  }
  if (_jsBlobUrl) {
    URL.revokeObjectURL(_jsBlobUrl);
    _jsBlobUrl = null;
  }
}

export const notifyThemeNavigate  = (d: object) => _jsModule?.onNavigate?.(d as never);
export const notifyThemeViewChange = (d: object) => _jsModule?.onViewChange?.(d as never);
export const notifyThemeFocus     = (d: object) => _jsModule?.onFocus?.(d as never);
export const notifyThemeSelect    = (d: object) => _jsModule?.onSelect?.(d as never);
export const notifyThemeBack      = (d: object) => _jsModule?.onBack?.(d as never);
