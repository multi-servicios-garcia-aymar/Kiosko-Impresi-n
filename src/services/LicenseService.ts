import { supabase } from '../lib/supabase';
import { logger } from './LoggerService';

export interface LicenseData {
  key: string;
  hardwareId: string;
  expiresAt: string;
  isActive: boolean;
  clientName: string;
}

export class LicenseService {
  public static STORAGE_KEY = 'nexo_kiosk_license';
  public static MACHINE_ID_KEY = 'nexo_kiosk_machine_id';
  public static TRIAL_START_KEY = 'nexo_kiosk_trial_start';

  /**
   * Retrieves the unique hardware ID of the current machine (Web Fallback)
   */
  static async getMachineId(): Promise<string> {
    let machineId = localStorage.getItem(this.MACHINE_ID_KEY);
    if (!machineId) {
      machineId = 'WEB-ID-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(this.MACHINE_ID_KEY, machineId);
    }
    return machineId;
  }

  /**
   * Checks if the current machine has a valid, active license
   */
  static async checkLocalLicense(): Promise<{ isValid: boolean; error?: string; data?: LicenseData }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { isValid: false, error: 'No hay licencia registrada.' };
      }

      const license: LicenseData = JSON.parse(stored);
      const currentHardwareId = await this.getMachineId();

      // 1. Verify Hardware ID matches
      if (license.hardwareId !== currentHardwareId) {
        return { isValid: false, error: 'Esta licencia pertenece a otro equipo.' };
      }

      // 2. Verify Expiration
      if (new Date(license.expiresAt) < new Date()) {
        return { isValid: false, error: 'La licencia ha expirado.' };
      }

      // 3. Verify Status
      if (!license.isActive) {
        return { isValid: false, error: 'La licencia ha sido desactivada por el administrador.' };
      }

      // Optional: Silent online verification
      this.silentOnlineCheck(license.key, currentHardwareId).catch(e => {
        logger.warn('Silent online check failed to execute', e);
      });

      return { isValid: true, data: license };
    } catch (error) {
      logger.error('Error verifying local license', error);
      return { isValid: false, error: 'Error al verificar la licencia local.' };
    }
  }

  /**
   * Activates or Verifies a license key online
   * Follows the strict logic: Basic Checks -> Activation (if new) -> Verification (if existing)
   */
  static async activateLicense(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentHardwareId = await this.getMachineId();

      // 1. Consulta Inicial (Fetch)
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        logger.error('Supabase fetch error:', error);
        // Diferenciar entre "No se encontró la licencia" y "Error de red/Timeout"
        if (error.code === 'PGRST116') {
          return { success: false, error: 'La clave de licencia no existe.' };
        }
        return { success: false, error: `Error de red (${error.message || error.code || 'Timeout'}). Revisa tu internet o firewall.` };
      }

      if (!data) {
        return { success: false, error: 'Licencia no válida o no encontrada.' };
      }

      const license = data;

      // PASO A: Verificaciones Básicas
      if (license.is_active === false) {
        return { success: false, error: 'Licencia desactivada por el administrador.' };
      }

      // PASO B: ¿Es la primera vez que se usa? (Activación)
      if (license.expires_at === null) {
        // Calcular fecha: Hoy + duration_months
        const durationMonths = license.duration_months || 1;
        const expiresAtDate = new Date();
        expiresAtDate.setMonth(expiresAtDate.getMonth() + durationMonths);
        const expiresAtISO = expiresAtDate.toISOString();

        // Actualizar Servidor: Vincular PC y establecer fecha
        const { error: updateError } = await supabase
          .from('licenses')
          .update({ 
            hardware_id: currentHardwareId,
            expires_at: expiresAtISO
          })
          .eq('key', key)
          .is('expires_at', null); // Safety check

        if (updateError) {
          logger.error('Error activating license:', updateError);
          return { success: false, error: 'Error al activar la licencia en el servidor.' };
        }

        // Actualizar objeto local para guardar
        license.expires_at = expiresAtISO;
        license.hardware_id = currentHardwareId;
      } 
      // PASO C: ¿Ya fue activada antes? (Verificación de rutina)
      else {
        // Validar PC
        if (license.hardware_id !== currentHardwareId) {
          return { success: false, error: 'Licencia vinculada a otra computadora.' };
        }

        // Validar Fecha
        if (new Date(license.expires_at) < new Date()) {
          return { success: false, error: 'Esta licencia ya expiró.' };
        }
      }

      // Guardar localmente para persistencia
      const localData: LicenseData = {
        key: license.key,
        hardwareId: currentHardwareId,
        expiresAt: license.expires_at,
        isActive: license.is_active,
        clientName: license.client_name || 'Cliente Premium',
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(localData));

      logger.info('License activated/verified successfully', { key });
      return { success: true };
    } catch (error: any) {
      logger.error('Activation error:', error);
      return { success: false, error: error.message || 'Error de conexión al servidor de licencias.' };
    }
  }

  /**
   * Silently checks if the license is still valid on the server
   * If the license is explicitly revoked or changed, it will invalidate local session.
   * If the license is deleted or there's a network error, it stays active (Offline Resilience).
   */
  private static async silentOnlineCheck(key: string, hardwareId: string) {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('is_active, expires_at, hardware_id, client_name')
        .eq('key', key)
        .single();

      if (error) {
        // PGRST116 means no rows returned (license deleted)
        if (error.code === 'PGRST116') {
          logger.warn('License deleted from server. Invalidating local session.', { key });
          this.logout();
          window.location.reload();
        } else {
          logger.warn('Network or server error during silent check. Proceeding offline.', error);
        }
        return;
      }

      if (data) {
        // If explicitly invalidated on server (revoked, expired, or hardware mismatch)
        if (data.hardware_id !== hardwareId || data.is_active === false || new Date(data.expires_at) < new Date()) {
          logger.warn('License invalidated by server check (mismatch, inactive, or expired)', { key });
          this.logout();
          window.location.reload();
          return;
        }

        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const license: LicenseData = JSON.parse(stored);
          license.isActive = data.is_active;
          license.expiresAt = data.expires_at;
          license.clientName = data.client_name || license.clientName;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(license));
        }
      }
    } catch (e) {
      // Ignore unexpected errors (offline mode). 
      // This ensures the app keeps working if the server is unreachable.
      logger.warn('Unexpected error during silent online check', e);
    }
  }

  /**
   * Retrieves the trial start date (Web Fallback)
   */
  static async getTrialStartDate(): Promise<Date> {
    try {
      let dateStr = localStorage.getItem(this.TRIAL_START_KEY);
      if (!dateStr) {
        dateStr = new Date().toISOString();
        localStorage.setItem(this.TRIAL_START_KEY, dateStr);
      }
      return new Date(dateStr);
    } catch (error) {
      logger.error('Failed to get trial date:', error);
      return new Date(); // Fallback to now
    }
  }

  /**
   * Checks if the trial period is still active (3 days)
   */
  static async checkTrialStatus(): Promise<{ isTrialActive: boolean; daysRemaining: number }> {
    const startDate = await this.getTrialStartDate();
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    const TRIAL_DURATION_DAYS = 3;
    const isTrialActive = diffDays < TRIAL_DURATION_DAYS;
    const daysRemaining = Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - diffDays));

    return { isTrialActive, daysRemaining };
  }

  static logout() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
