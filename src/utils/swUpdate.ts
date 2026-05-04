// Service worker registration with update detection.
// Dispatches `rezakit:sw-update-available` when a new SW is installed and waiting,
// and `rezakit:sw-activated` once a brand-new SW takes control.

const SW_PATH = '/service-worker.js';

type Listener = (reg: ServiceWorkerRegistration) => void;

let registration: ServiceWorkerRegistration | null = null;
const updateListeners = new Set<Listener>();

function emitUpdateAvailable() {
  if (!registration) return;
  for (const fn of updateListeners) fn(registration);
  window.dispatchEvent(new CustomEvent('rezakit:sw-update-available'));
}

export function onUpdateAvailable(fn: Listener): () => void {
  updateListeners.add(fn);
  // If a waiting worker is already there at subscription time, fire immediately
  if (registration?.waiting) fn(registration);
  return () => updateListeners.delete(fn);
}

export async function applyUpdate() {
  if (!registration) return;
  const waiting = registration.waiting;
  if (!waiting) return;
  // Tell the waiting SW to take over, then reload once it does
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.hostname === 'localhost') {
    // Dev: deregister to avoid stale assets
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
      registration = reg;

      // Fired when an update has been found
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // A new SW is installed AND there is a controller → we have an update
            emitUpdateAvailable();
          }
        });
      });

      // If a worker was already waiting when we mounted, surface it now
      if (reg.waiting && navigator.serviceWorker.controller) emitUpdateAvailable();

      // Check periodically (every 30 min while app is open)
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
      window.addEventListener('focus', () => reg.update().catch(() => {}));
    } catch (err) {
      console.warn('SW registration failed', err);
    }
  });

  // When the new SW takes control → reload once so all clients use fresh assets
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  // SW broadcast (post-activate hello)
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'SW_UPDATED') {
      window.dispatchEvent(new CustomEvent('rezakit:sw-activated', { detail: e.data }));
    }
  });
}
