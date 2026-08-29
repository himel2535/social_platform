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
  minTouchTarget: 44,
  tabBarHeight: 64,
} as const;
