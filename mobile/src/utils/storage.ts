import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const FCM_TOKEN_KEY = 'fcm_device_token';

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage may be unavailable in private browsing
    }
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage may be unavailable in private browsing
    }
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function saveToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await removeItem(TOKEN_KEY);
}

export async function saveUser(user: string): Promise<void> {
  await setItem(USER_KEY, user);
}

export async function getUser(): Promise<string | null> {
  return getItem(USER_KEY);
}

export async function removeUser(): Promise<void> {
  await removeItem(USER_KEY);
}

export async function saveFcmToken(token: string): Promise<void> {
  await setItem(FCM_TOKEN_KEY, token);
}

export async function getFcmToken(): Promise<string | null> {
  return getItem(FCM_TOKEN_KEY);
}

export async function removeFcmToken(): Promise<void> {
  await removeItem(FCM_TOKEN_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await removeToken();
  await removeUser();
}
