import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function and tracks { data, loading, error }.
 * Re-runs when the values in `deps` change, or when you call reload().
 * `deps` is compared by value (JSON), so passing a fresh object with the
 * same contents does not trigger a refetch.
 */
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  // Always call the latest `fn` without making it a dependency, since callers
  // pass a new arrow function on every render.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const key = JSON.stringify(deps);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef
      .current()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
