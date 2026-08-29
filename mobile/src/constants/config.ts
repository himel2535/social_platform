import { Platform } from 'react-native';

function getDefaultApiUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
}

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl(),
  requestTimeout: 15000,
} as const;
