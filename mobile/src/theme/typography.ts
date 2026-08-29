import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  postContent: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  metadata: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  helper: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  error: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.error,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
