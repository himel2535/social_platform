import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard, Avatar, TextInput, IconButton } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  userName?: string;
  loading?: boolean;
};

export function CommentInput({
  value,
  onChangeText,
  onSubmit,
  userName = 'You',
  loading = false,
}: Props) {
  return (
    <GlassCard style={styles.container} contentStyle={styles.content}>
      <Avatar name={userName} size={36} />
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Add a comment..."
          multiline
        />
      </View>
      <IconButton
        icon="send"
        onPress={onSubmit}
        color={colors.secondary}
        disabled={!value.trim() || loading}
        accessibilityLabel="Send comment"
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  inputWrapper: {
    flex: 1,
  },
});
