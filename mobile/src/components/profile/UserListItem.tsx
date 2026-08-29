import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Typography } from '@/components/ui';
import { UserProfile } from '@/services/user.service';
import { spacing } from '@/theme/spacing';

type Props = {
  user: UserProfile;
};

export function UserListItem({ user }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/profile/${user.username}`)}
      accessibilityRole="button"
      accessibilityLabel={`View profile for ${user.name}`}
    >
      <Avatar name={user.name} uri={user.avatar} size={44} />
      <View style={styles.info}>
        <Typography variant="userName">{user.name}</Typography>
        <Typography variant="username">@{user.username}</Typography>
        {user.bio ? (
          <Typography variant="metadata" numberOfLines={1}>
            {user.bio}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
});
