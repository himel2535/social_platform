import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography, TypographyVariant } from '@/theme/typography';
import { colors } from '@/theme/colors';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof typeof colors | string;
};

export function Typography({
  variant = 'postContent',
  color,
  style,
  children,
  ...rest
}: Props) {
  const colorValue = color
    ? color in colors
      ? colors[color as keyof typeof colors]
      : color
    : undefined;

  return (
    <Text
      style={[typography[variant], colorValue ? { color: colorValue } : undefined, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({});
