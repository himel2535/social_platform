import { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';

type SkeletonBlockProps = {
  style?: StyleProp<ViewStyle>;
  pulse: Animated.Value;
};

export function usePulseAnimation() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return pulse;
}

export function SkeletonBlock({ style, pulse }: SkeletonBlockProps) {
  return (
    <Animated.View
      style={[
        styles.block,
        style,
        {
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 0.65],
          }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.sm,
  },
});
