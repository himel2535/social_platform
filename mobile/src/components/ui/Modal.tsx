import React from 'react';
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { Typography } from './Typography';
import { IconButton } from './IconButton';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { glass } from '@/theme/glass';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Modal({ visible, onClose, title, children, style }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.content, style]} onPress={(e) => e.stopPropagation()}>
          {title && (
            <View style={styles.header}>
              <Typography variant="sectionTitle">{title}</Typography>
              <IconButton icon="close" onPress={onClose} accessibilityLabel="Close modal" />
            </View>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
