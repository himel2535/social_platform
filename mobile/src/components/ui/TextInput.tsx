import React from 'react';
import { View, TextInput as RNTextInput, StyleSheet, TextInputProps } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { glass } from '@/theme/glass';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function TextInput({ label, error, helperText, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label && (
        <Typography variant="inputLabel" style={styles.label}>
          {label}
        </Typography>
      )}
      <RNTextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label || rest.placeholder}
        {...rest}
      />
      {error ? (
        <Typography variant="error" style={styles.helper}>
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="helper" style={styles.helper}>
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: glass.backgroundColor,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
