import React from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCount } from '@/utils/format';

type Props = {
  count: number;
  onPress?: () => void;
  iconColor?: string;
  iconSize?: number;
  countStyle?: TextStyle;
  compact?: boolean;
};

export function CommentButton({
  count,
  onPress,
  iconColor = colors.textSecondary,
  iconSize = 22,
  countStyle,
  compact = false,
}: Props) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <IconButton
        icon="chatbubble-outline"
        onPress={onPress}
        color={iconColor}
        size={iconSize}
        accessibilityLabel="View comments"
        style={compact ? styles.compactIcon : undefined}
      />
      <Typography variant="metadata" style={countStyle}>
        {formatCount(count)}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  containerCompact: {
    gap: 2,
  },
  compactIcon: {
    width: 28,
    height: 28,
  },
});
