import { supabase } from '../lib/supabase';
import { logger } from './LoggerService';

class ConfigService {
  private static instance: ConfigService;
  private settings: Record<string, any> = {};
  private isLoading = true;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async initialize() {
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      
      data.forEach(setting => {
        this.settings[setting.key] = setting.value;
      });
      
      logger.info('Remote Config Initialized', this.settings);
    } catch (e) {
      logger.error('Failed to initialize ConfigService', e);
    } finally {
      this.isLoading = false;
    }
  }

  public get<T>(key: string, defaultValue: T): T {
    return (this.settings[key] as T) ?? defaultValue;
  }

  public isReady() {
    return !this.isLoading;
  }
}

export const configService = ConfigService.getInstance();
