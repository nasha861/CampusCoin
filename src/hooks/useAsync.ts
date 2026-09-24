import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Runs an async factory on mount (and whenever `deps` change), exposing
 * loading/error/data state. Intended for simple "fetch on page load" cases;
 * pages with more complex data needs should compose their own state.
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[] = []): AsyncState<T> & {
  refetch: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, isLoading: true });
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let isCancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    factory()
      .then((data) => {
        if (!isCancelled) setState({ data, error: null, isLoading: false });
      })
      .catch((error: Error) => {
        if (!isCancelled) setState({ data: null, error, isLoading: false });
      });

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  return { ...state, refetch };
}
