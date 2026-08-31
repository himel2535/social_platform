import React from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCount } from '@/utils/format';

type Props = {
  count: number;
  isLiked?: boolean;
  onPress?: () => void;
  iconColor?: string;
  likedIconColor?: string;
  iconSize?: number;
  countStyle?: TextStyle;
  compact?: boolean;
};

export function LikeButton({
  count,
  isLiked = false,
  onPress,
  iconColor = colors.textSecondary,
  likedIconColor = colors.primary,
  iconSize = 22,
  countStyle,
  compact = false,
}: Props) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <IconButton
        icon={isLiked ? 'heart' : 'heart-outline'}
        onPress={onPress}
        color={isLiked ? likedIconColor : iconColor}
        size={iconSize}
        accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
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
