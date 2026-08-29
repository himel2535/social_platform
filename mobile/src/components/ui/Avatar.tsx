import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
};

export function Avatar({ uri, name = '?', size = 40, style }: Props) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Typography variant="userName" style={{ fontSize: size * 0.35 }}>
          {initials}
        </Typography>
      )}
    </View>
  );
}

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
