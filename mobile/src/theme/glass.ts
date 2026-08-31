import { colors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';

export const glass = {
  backgroundOpacity: 0.1,
  borderOpacity: 0.14,
  blurIntensity: 20,
  backgroundColor: `rgba(255, 255, 255, 0.10)`,
  borderColor: `rgba(255, 255, 255, 0.14)`,
  borderWidth: 1,
  borderRadius: radius.lg,
  padding: spacing.lg,
} as const;

export const feedGlass = {
  blurIntensity: 70,
  backgroundColor: 'rgba(20, 22, 35, 0.55)',
  borderColor: 'rgba(255, 255, 255, 0.06)',
  borderWidth: 1,
  borderRadius: 16,
  padding: spacing.lg,
  accentColor: 'rgba(93, 202, 165, 0.5)',
} as const;

export const buttonGlass = {
  primaryGradient: ['rgba(34, 197, 94, 0.55)', 'rgba(16, 185, 129, 0.35)'] as const,
  primaryBorder: 'rgba(74, 222, 128, 0.45)',
  secondaryBackground: 'rgba(34, 197, 94, 0.12)',
  secondaryBorder: 'rgba(74, 222, 128, 0.35)',
  textOnPrimary: colors.textPrimary,
  accent: colors.success,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const layout = {
  maxContentWidth: 680,
  sidebarWidth: 240,
  minTouchTarget: 44,
  tabBarHeight: 64,
} as const;
