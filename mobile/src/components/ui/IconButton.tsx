import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/glass';
import { radius } from '@/theme/radius';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  onPress,
  color = colors.textPrimary,
  size = 22,
  disabled = false,
  accessibilityLabel,
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
});
