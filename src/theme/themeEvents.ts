export type NeoCabEventName =
  | 'neocab:navigate'
  | 'neocab:viewchange'
  | 'neocab:focus'
  | 'neocab:select'
  | 'neocab:back';

export function dispatchNeoCabEvent(name: NeoCabEventName, detail: unknown): void {
  document.dispatchEvent(new CustomEvent(name, { detail, bubbles: false }));
}
