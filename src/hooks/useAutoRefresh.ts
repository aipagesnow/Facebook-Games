import { useCallback, useEffect, useRef } from 'react';

/**
 * Re-run `load` when:
 * - the page mounts
 * - the app window gains focus / becomes visible again
 * - a global `fgs:refresh` event fires (sidebar Refresh)
 * - optional polling interval (default 12s) so disk changes show up
 */
export function useAutoRefresh(
  load: () => void | Promise<void>,
  options?: { intervalMs?: number; enabled?: boolean }
) {
  const intervalMs = options?.intervalMs ?? 12_000;
  const enabled = options?.enabled ?? true;
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(() => {
    void loadRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    run();

    const onFocus = () => run();
    const onVis = () => {
      if (document.visibilityState === 'visible') run();
    };
    const onGlobal = () => run();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('fgs:refresh', onGlobal);

    const id =
      intervalMs > 0 ? window.setInterval(run, intervalMs) : 0;

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('fgs:refresh', onGlobal);
      if (id) window.clearInterval(id);
    };
    // Re-run when `load` identity changes (Facebook ↔ Android) so pages do not keep stale data.
  }, [enabled, intervalMs, run, load]);
}

/** Fire from the sidebar so every page reloads its data. */
export function requestStudioRefresh() {
  window.dispatchEvent(new Event('fgs:refresh'));
}
