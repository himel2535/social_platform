import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { glass } from '@/theme/glass';
import { useSocket } from '@/hooks/useSocket';

type Props = {
  receiverId: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
};

const TYPING_IDLE_MS = 2000;

export function MessageInput({
  receiverId,
  value,
  onChangeText,
  onSend,
  disabled = false,
  sending = false,
}: Props) {
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (!socket || !isTypingRef.current) {
      return;
    }

    isTypingRef.current = false;
    socket.emit('user_stopped_typing', { receiverId });
  }, [receiverId, socket]);

  const startTyping = useCallback(() => {
    if (!socket) {
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('user_typing', { receiverId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_IDLE_MS);
  }, [receiverId, socket, stopTyping]);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);

      if (text.trim()) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [onChangeText, startTyping, stopTyping],
  );

  const handleBlur = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  const canSend = value.trim().length > 0 && !disabled && !sending;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        placeholder="Message..."
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={2000}
        editable={!disabled && !sending}
        accessibilityLabel="Message input"
      />
      <Pressable
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        <Ionicons name="send" size={18} color={canSend ? colors.textPrimary : colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: glass.borderWidth,
    borderTopColor: glass.borderColor,
    backgroundColor: colors.backgroundSecondary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: glass.borderColor,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
