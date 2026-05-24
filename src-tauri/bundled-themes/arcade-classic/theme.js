/**
 * NeoCab Theme Plugin SDK — arcade-classic starter
 *
 * Todos los exports son opcionales. Implementa solo los que necesites.
 *
 * El objeto `api` (window.NeoCabAPI) expone:
 *   api.version           — string, versión de NeoCab
 *   api.getCurrentView()  — "menu" | "systems" | "games" | "operator" | "settings"
 *   api.getFocusedIndex() — número del item enfocado
 *   api.getCurrentSystem() — objeto sistema o null
 *   api.getSystemCards()  — NodeList de .system-card
 *   api.getCssVar(name)   — lee una CSS custom property
 *   api.setCssVar(name, value) — solo vars con prefijo --theme-*
 *
 * También puedes usar event listeners directamente en onMount:
 *   document.addEventListener("neocab:navigate", e => { ... e.detail ... })
 *   document.addEventListener("neocab:viewchange", e => { ... })
 *   document.addEventListener("neocab:focus", e => { ... })
 *   document.addEventListener("neocab:select", e => { ... })
 *   document.addEventListener("neocab:back", e => { ... })
 */

// Guarda las referencias para cleanup en onUnmount
const _listeners = [];

export function onMount(api) {
  console.log('[arcade-classic] theme.js mounted — NeoCab v' + api.version);

  // Establece vars CSS personalizadas (solo prefijo --theme-*)
  api.setCssVar('--theme-card-tilt-amount', '4deg');

  // Ejemplo de listener alternativo (además de los hook exports)
  const focusHandler = (e) => {
    if (e.detail.view === 'systems') {
      document.documentElement.dataset.focusedSystem = e.detail.index;
    }
  };
  document.addEventListener('neocab:focus', focusHandler);
  _listeners.push(['neocab:focus', focusHandler]);
}

export function onNavigate({ direction, fromIndex, toIndex, view }) {
  if (view !== 'systems') return;

  // Aplica tilt momentáneo en la card que recibe el foco
  const cards = document.querySelectorAll('.system-card');
  const focused = cards[toIndex];
  if (!focused) return;

  const tilt = (direction === 'right' || direction === 'down')
    ? 'var(--theme-card-tilt-amount, 4deg)'
    : 'calc(var(--theme-card-tilt-amount, 4deg) * -1)';

  focused.style.setProperty('--tilt', tilt);
  // Elimina el tilt tras la animación
  setTimeout(() => focused.style.removeProperty('--tilt'), 300);
}

export function onViewChange({ from, to }) {
  // Añade data-transition para que el CSS pueda animar la entrada
  document.documentElement.dataset.transition = `${from}-to-${to}`;
  setTimeout(() => {
    delete document.documentElement.dataset.transition;
  }, 600);
}

export function onFocus({ index, view }) {
  // En modo lista, scroll automático al item enfocado
  if (view === 'systems') {
    const card = document.querySelectorAll('.system-card')[index];
    card?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }
}

export function onSelect({ item, view }) {
  if (view === 'systems' && item) {
    console.log('[arcade-classic] sistema seleccionado:', item.name || item.id);
  }
}

export function onBack({ fromView }) {
  console.log('[arcade-classic] back desde:', fromView);
}

export function onUnmount() {
  // Limpia event listeners añadidos en onMount
  _listeners.forEach(([name, fn]) => document.removeEventListener(name, fn));
  _listeners.length = 0;

  // Limpia vars CSS custom
  document.documentElement.style.removeProperty('--theme-card-tilt-amount');
  delete document.documentElement.dataset.focusedSystem;

  console.log('[arcade-classic] theme.js unmounted');
}
