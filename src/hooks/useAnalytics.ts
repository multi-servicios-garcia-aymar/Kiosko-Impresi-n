import { useCallback } from 'react';
import { logger } from '../services/LoggerService';
import { supabase } from '../lib/supabase';

export function useAnalytics() {
  const trackEvent = useCallback(async (event: string, properties?: any) => {
    logger.info(`Event Tracked: ${event}`, properties);

    // Persist event to Supabase if needed (Audit Log)
    try {
      const { error } = await supabase.from('audit_logs').insert({
        event_name: event,
        properties,
        timestamp: new Date().toISOString()
      });
      if (error) throw error;
    } catch (e) {
      logger.error('Failed to persist analytic event', e);
    }
  }, []);

  return { trackEvent };
}
