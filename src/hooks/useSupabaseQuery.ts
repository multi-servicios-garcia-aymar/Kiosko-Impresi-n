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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const execute = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const { data: result, error: queryError } = await queryFn();
      if (queryError) {
        setError(queryError);
        setStatus('error');
        options.onError?.(queryError);
      } else {
        setData(result);
        setStatus('success');
        options.onSuccess?.(result);
      }
    } catch (e: any) {
      const err = { 
        message: e.message || 'Unknown error during Supabase query',
        details: e.details || '',
        hint: e.hint || '',
        code: e.code || 'UNKNOWN'
      } as PostgrestError;
      setError(err);
      setStatus('error');
      options.onError?.(err);
    }
  }, [queryFn, options.onSuccess, options.onError]);

  useEffect(() => {
    if (options.enabled !== false) {
      execute();
    }
  }, [execute, options.enabled]);

  return { 
    data, 
    error, 
    status,
    isLoading: status === 'loading', 
    isSuccess: status === 'success',
    isError: status === 'error',
    refetch: execute 
  };
}
