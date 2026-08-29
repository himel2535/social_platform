import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from '@/components/ui/IconButton';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCount } from '@/utils/format';

type Props = {
  count: number;
  onPress?: () => void;
};

export function CommentButton({ count, onPress }: Props) {
  return (
    <View style={styles.container}>
      <IconButton
        icon="chatbubble-outline"
        onPress={onPress}
        color={colors.textSecondary}
        accessibilityLabel="View comments"
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
