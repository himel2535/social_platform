import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  StyleSheet,
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

export function BottomSheet({ visible, onClose, title, children, style }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, style]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          {title && (
            <View style={styles.header}>
              <Typography variant="sectionTitle">{title}</Typography>
              <IconButton icon="close" onPress={onClose} accessibilityLabel="Close sheet" />
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    borderBottomWidth: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.textSecondary,
    opacity: 0.4,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
