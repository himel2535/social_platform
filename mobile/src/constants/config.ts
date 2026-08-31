import { Platform } from 'react-native';

function getDefaultApiUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

export const config = {
  apiUrl,
  socketUrl: apiUrl.replace(/\/api\/?$/, ''),
  requestTimeout: 15000,
} as const;
