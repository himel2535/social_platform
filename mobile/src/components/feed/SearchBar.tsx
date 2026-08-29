import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { IconButton } from '@/components/ui/IconButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Filter by username...',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {value.length > 0 && (
        <IconButton
          icon="close-circle"
          onPress={() => onChangeText('')}
          color={colors.textSecondary}
          accessibilityLabel="Clear search"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
});
