import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '@/theme/glass';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function GlassCard({ children, style, contentStyle, intensity = glass.blurIntensity }: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: glass.borderRadius,
    overflow: 'hidden',
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
  },
  blur: {
    backgroundColor: glass.backgroundColor,
  },
  content: {
    padding: glass.padding,
  },
});
