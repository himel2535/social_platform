import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';

type AvatarShape = 'circle' | 'roundedSquare';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  shape?: AvatarShape;
};

const FEED_AVATAR = {
  backgroundColor: 'rgba(29, 158, 117, 0.15)',
  borderColor: 'rgba(29, 158, 117, 0.35)',
  initialsColor: '#5DCAA5',
  borderRadius: 10,
  initialsSize: 12,
  initialsWeight: '500' as TextStyle['fontWeight'],
};

export const Avatar = memo(function Avatar({
  uri,
  name = '?',
  size = 40,
  style,
  shape = 'circle',
}: Props) {
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

  const borderRadius = shape === 'roundedSquare' ? FEED_AVATAR.borderRadius : size / 2;

  const imageStyle = useMemo(
    () => ({ width: size, height: size, borderRadius }),
    [size, borderRadius],
  );

  const containerStyle = useMemo(
    () =>
      shape === 'roundedSquare'
        ? {
            backgroundColor: FEED_AVATAR.backgroundColor,
            borderColor: FEED_AVATAR.borderColor,
          }
        : {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.primary,
          },
    [shape],
  );

  const initialsStyle = useMemo(
    () =>
      shape === 'roundedSquare'
        ? {
            fontSize: FEED_AVATAR.initialsSize,
            fontWeight: FEED_AVATAR.initialsWeight,
            color: FEED_AVATAR.initialsColor,
          }
        : { fontSize: size * 0.35 },
    [shape, size],
  );

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        { width: size, height: size, borderRadius },
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
        <Typography variant="userName" style={initialsStyle}>
          {initials}
        </Typography>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
