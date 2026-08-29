import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/glass';
import { useResponsive } from '@/hooks/useResponsive';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  centered?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: ScrollViewProps;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentPaddingBottom?: number;
};

export function Screen({
  children,
  scroll = false,
  centered = true,
  style,
  contentContainerStyle,
  scrollViewProps,
  edges = ['top', 'bottom'],
  contentPaddingBottom,
}: Props) {
  const { isTablet, isDesktop, isMobile } = useResponsive();
  const shouldCenter = centered && (isTablet || isDesktop);
  const bottomPadding =
    contentPaddingBottom ?? (isMobile ? layout.tabBarHeight + spacing.lg : spacing.lg);

  const content = (
    <View
      style={[
        styles.content,
        shouldCenter && styles.centeredContent,
        { paddingBottom: bottomPadding },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  centeredContent: {
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
