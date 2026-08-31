import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, feedGlass } from '@/theme/glass';

type GlassCardVariant = 'default' | 'feed';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: GlassCardVariant;
};

export function GlassCard({
  children,
  style,
  contentStyle,
  intensity,
  variant = 'default',
}: Props) {
  const tokens = variant === 'feed' ? feedGlass : glass;
  const blurIntensity = intensity ?? tokens.blurIntensity;

  const content = (
    <View style={[styles.content, { padding: tokens.padding }, contentStyle]}>{children}</View>
  );

  const blurBackground =
    variant === 'feed' ? feedGlass.backgroundColor : glass.backgroundColor;

  const useBlur = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: tokens.borderRadius,
          borderWidth: tokens.borderWidth,
          borderColor: tokens.borderColor,
        },
        style,
      ]}
    >
      {useBlur ? (
        <BlurView intensity={blurIntensity} tint="dark" style={[styles.blur, { backgroundColor: blurBackground }]}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.blur, { backgroundColor: blurBackground }]}>{content}</View>
      )}
      {variant === 'feed' && (
        <LinearGradient
          colors={['transparent', feedGlass.accentColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.feedAccent}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  blur: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  feedAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
});
