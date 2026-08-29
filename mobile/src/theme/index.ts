export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { radius } from './radius';
export { glass, shadows, layout } from './glass';

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radius } from './radius';
import { glass, shadows, layout } from './glass';

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  glass,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;
