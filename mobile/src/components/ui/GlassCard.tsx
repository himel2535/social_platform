import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '@/theme/glass';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function GlassCard({ children, style, contentStyle, intensity = glass.blurIntensity }: Props) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <View style={[styles.wrapper, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="dark" style={styles.blur}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.blur, styles.solidBackground]}>{content}</View>
      )}
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
  solidBackground: {
    backgroundColor: glass.backgroundColor,
  },
  content: {
    padding: glass.padding,
  },
});
