import React from 'react';
import { View, StyleSheet, Platform, TextInput as RNTextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
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
        {Platform.OS === 'ios' || Platform.OS === 'android' ? (
          <BlurView intensity={50} tint="dark" style={styles.glassShell}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
            <RNTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </BlurView>
        ) : (
          <View style={[styles.glassShell, styles.glassSolid]}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
            <RNTextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        )}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  glassShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    minHeight: 44,
  },
  glassSolid: {
    backgroundColor: 'rgba(30,32,45,0.9)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
