import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
};

export function LoadingSpinner({ size = 'large', color = colors.primary, style }: Props) {
  return (
    <View style={[styles.container, style]} accessibilityLabel="Loading">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
