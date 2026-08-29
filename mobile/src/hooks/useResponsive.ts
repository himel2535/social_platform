import { useWindowDimensions } from 'react-native';
import { layout } from '@/theme/glass';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 360;

  return {
    width,
    height,
    isTablet,
    isSmallPhone,
    maxContentWidth: layout.maxContentWidth,
  };
}
