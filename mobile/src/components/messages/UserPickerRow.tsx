import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Typography } from '@/components/ui';
import { UserProfile } from '@/services/user.service';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

type Props = {
  user: UserProfile;
  onPress: () => void;
};

export function UserPickerRow({ user, onPress }: Props) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Message ${user.name}`}
    >
      <Avatar name={user.name} uri={user.avatar} size={48} shape="roundedSquare" />
      <View style={styles.content}>
        <Typography variant="userName" numberOfLines={1}>
          {user.name}
        </Typography>
        <Typography variant="username" numberOfLines={1}>
          @{user.username}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flex: 1,
    gap: 2,
  },
});
