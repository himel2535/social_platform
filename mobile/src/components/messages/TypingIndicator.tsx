import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui';
import { spacing } from '@/theme/spacing';

type Props = {
  visible: boolean;
  username?: string;
};

export function TypingIndicator({ visible, username }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Typography variant="metadata" style={styles.text}>
        {username ? `${username} is typing...` : 'typing...'}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  text: {
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
    fontSize: 12,
  },
});
