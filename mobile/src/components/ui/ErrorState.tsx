import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { SecondaryButton } from './SecondaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      <Typography variant="emptyTitle" style={styles.title}>
        {title}
      </Typography>
      <Typography variant="emptyMessage" style={styles.message}>
        {message}
      </Typography>
      {onRetry && (
        <SecondaryButton title="Try Again" onPress={onRetry} icon="refresh-outline" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
