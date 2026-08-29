import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCount } from '@/utils/format';

type Props = {
  count: number;
  isLiked?: boolean;
  onPress?: () => void;
};

export function LikeButton({ count, isLiked = false, onPress }: Props) {
  return (
    <View style={styles.container}>
      <IconButton
        icon={isLiked ? 'heart' : 'heart-outline'}
        onPress={onPress}
        color={isLiked ? colors.primary : colors.textSecondary}
        accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
      />
      <Typography variant="metadata">{formatCount(count)}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
