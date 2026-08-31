import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { buttonGlass, layout } from '@/theme/glass';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={buttonGlass.accent} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={18} color={buttonGlass.accent} />}
          <Typography variant="button" color="success">
            {title}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: buttonGlass.secondaryBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: buttonGlass.secondaryBorder,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
