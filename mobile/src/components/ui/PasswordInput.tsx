import React, { useState } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { glass } from '@/theme/glass';
import { TextInputProps } from 'react-native';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function PasswordInput({ label, error, helperText, style, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Typography variant="inputLabel" style={styles.label}>
          {label}
        </Typography>
      )}
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={[styles.input, error && styles.inputError, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!visible}
          accessibilityLabel={label || rest.placeholder}
          {...rest}
        />
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
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
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: glass.backgroundColor,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.xxxl,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  toggle: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
