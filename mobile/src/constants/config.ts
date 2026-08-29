export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api',
  requestTimeout: 15000,
} as const;
