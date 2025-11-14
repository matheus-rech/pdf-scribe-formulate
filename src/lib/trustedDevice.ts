import { supabase } from "@/integrations/supabase/client";

const TRUSTED_DEVICE_KEY = 'trusted_device_token';
const DEVICE_EXPIRY_DAYS = 30;

interface TrustedDeviceData {
  token: string;
  expiresAt: number;
  userId: string;
}

/**
 * Generate a random token for device identification
 */
const generateDeviceToken = (): string => {
  return crypto.randomUUID();
};

/**
 * Store trusted device token in localStorage
 */
export const setTrustedDevice = (userId: string): void => {
  const token = generateDeviceToken();
  const expiresAt = Date.now() + (DEVICE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const data: TrustedDeviceData = {
    token,
    expiresAt,
    userId,
  };
  
  localStorage.setItem(TRUSTED_DEVICE_KEY, JSON.stringify(data));
};

/**
 * Check if current device is trusted and session is valid
 */
export const isTrustedDevice = async (): Promise<boolean> => {
  try {
    const stored = localStorage.getItem(TRUSTED_DEVICE_KEY);
    if (!stored) return false;
    
    const data: TrustedDeviceData = JSON.parse(stored);
    
    // Check if token has expired
    if (Date.now() > data.expiresAt) {
      clearTrustedDevice();
      return false;
    }
    
    // Verify the session is still valid
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== data.userId) {
      clearTrustedDevice();
      return false;
    }
    
    return true;
  } catch (error) {
    clearTrustedDevice();
    return false;
  }
};

/**
 * Remove trusted device token
 */
export const clearTrustedDevice = (): void => {
  localStorage.removeItem(TRUSTED_DEVICE_KEY);
};

/**
 * Get remaining days until trusted device expires
 */
export const getTrustedDeviceExpiry = (): number | null => {
  try {
    const stored = localStorage.getItem(TRUSTED_DEVICE_KEY);
    if (!stored) return null;
    
    const data: TrustedDeviceData = JSON.parse(stored);
    const daysRemaining = Math.ceil((data.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    
    return daysRemaining > 0 ? daysRemaining : null;
  } catch (error) {
    return null;
  }
};
