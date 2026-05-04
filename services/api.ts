import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/Config';

const TOKEN_KEY = 'mpp_auth_token';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Generic API wrapper
 * Handles adding the Authorization header automatically
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  console.log(`[API Debug] Fetching ${endpoint} with token: ${token ? 'YES' : 'NO'}`);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${Config.BASE_URL}${endpoint}`;

  try {
    console.log(`[API Debug] fetch starting: ${url}`);
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error: any) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export async function fetchMobileSettings() {
  return await apiFetch('/settings');
}

