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
};

export function Screen({
  children,
  scroll = false,
  centered = true,
  style,
  contentContainerStyle,
  scrollViewProps,
  edges = ['top', 'bottom'],
}: Props) {
  const { isTablet } = useResponsive();

  const content = (
    <View
      style={[
        styles.content,
        centered && isTablet && styles.tabletContent,
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
  tabletContent: {
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
