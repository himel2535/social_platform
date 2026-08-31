import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Typography } from './Typography';
import { APP_NAME } from '@/constants/branding';

type Props = {
  iconSize?: number;
  gap?: number;
  style?: ViewStyle;
  showText?: boolean;
};

const LOGO_SOURCE = require('../../../assets/images/techzugram-icon.png');

export function BrandTitle({ iconSize = 28, gap = 8, style, showText = true }: Props) {
  return (
    <View style={[styles.container, { gap }, style]}>
      <Image
        source={LOGO_SOURCE}
        style={{ width: iconSize, height: iconSize, marginTop: 2 }}
        contentFit="contain"
        accessibilityLabel={`${APP_NAME} logo`}
      />
      {showText && (
        <Typography variant="screenTitle" style={styles.title} numberOfLines={1}>
          {APP_NAME}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
  },
});
