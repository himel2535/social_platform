import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';

type Props = {
  style?: ViewStyle;
};

export function CenteredLoading({ style }: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <LoadingSpinner />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
  },
});
