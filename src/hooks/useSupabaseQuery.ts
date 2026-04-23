import { useState, useCallback, useEffect } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

interface QueryOptions {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: PostgrestError) => void;
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: result, error: queryError } = await queryFn();
      if (queryError) {
        setError(queryError);
        options.onError?.(queryError);
      } else {
        setData(result);
        options.onSuccess?.(result);
      }
    } catch (e: any) {
      const err = { message: e.message } as PostgrestError;
      setError(err);
      options.onError?.(err);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, options.onSuccess, options.onError]);

  useEffect(() => {
    if (options.enabled !== false) {
      execute();
    }
  }, [execute, options.enabled]);

  return { data, error, isLoading, refetch: execute };
}
