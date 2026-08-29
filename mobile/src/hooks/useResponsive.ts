import { useWindowDimensions } from 'react-native';
import { layout } from '@/theme/glass';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const isSmallPhone = width < 360;

  return {
    width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    isSmallPhone,
    maxContentWidth: layout.maxContentWidth,
    sidebarWidth: layout.sidebarWidth,
  };
}
