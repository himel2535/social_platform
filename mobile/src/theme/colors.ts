export const colors = {
  background: '#0B1020',
  backgroundSecondary: '#111827',
  primary: '#7C3AED',
  secondary: '#06B6D4',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  error: '#F43F5E',
  white: '#FFFFFF',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
