import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
};

export const Avatar = memo(function Avatar({ uri, name = '?', size = 40, style }: Props) {
  const initials = useMemo(
    () =>
      name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [name],
  );

  const imageStyle = useMemo(
    () => ({ width: size, height: size, borderRadius: size / 2 }),
    [size],
  );

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
      accessibilityLabel={`Avatar for ${name}`}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={imageStyle}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      ) : (
        <Typography variant="userName" style={{ fontSize: size * 0.35 }}>
          {initials}
        </Typography>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
