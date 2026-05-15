export type InputAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'back'
  | 'coin'
  | 'start'
  | 'pause'
  | 'quick_save'
  | 'quick_load'
  | 'screenshot'
  | 'toggle_menu'
  | 'page_up'
  | 'page_down';

export interface KeymapConfig {
  keyboard: Record<InputAction, string[]>;
  gamepad: Record<InputAction, string[]>;
}

export const DEFAULT_KEYMAP: KeymapConfig = {
  keyboard: {
    up: ['ArrowUp', 'w', 'W'],
    down: ['ArrowDown', 's', 'S'],
    left: ['ArrowLeft', 'a', 'A'],
    right: ['ArrowRight', 'd', 'D'],
    confirm: ['Enter', ' '],
    back: ['Escape', 'Backspace'],
    coin: ['5', 'ShiftLeft'],
    start: ['1'],
    pause: ['p', 'P', 'Pause'],
    quick_save: ['F5'],
    quick_load: ['F7'],
    screenshot: ['F12'],
    toggle_menu: ['Tab'],
    page_up: ['PageUp'],
    page_down: ['PageDown'],
  },
  gamepad: {
    up: ['dpad_up', 'left_stick_up'],
    down: ['dpad_down', 'left_stick_down'],
    left: ['dpad_left', 'left_stick_left'],
    right: ['dpad_right', 'left_stick_right'],
    confirm: ['button_south'],
    back: ['button_east'],
    coin: ['button_west'],
    start: ['start'],
    pause: ['button_north'],
    quick_save: ['button_left_shoulder'],
    quick_load: ['button_right_shoulder'],
    screenshot: [],
    toggle_menu: ['select'],
    page_up: [],
    page_down: [],
  },
};

const STORAGE_KEY = 'neocab_keymap';

export function loadKeymap(): KeymapConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        keyboard: { ...DEFAULT_KEYMAP.keyboard, ...parsed.keyboard },
        gamepad: { ...DEFAULT_KEYMAP.gamepad, ...parsed.gamepad },
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_KEYMAP;
}

export function saveKeymap(config: KeymapConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function resetKeymap(): void {
  localStorage.removeItem(STORAGE_KEY);
}
