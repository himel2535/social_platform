import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[username]/index" />
      <Stack.Screen name="[username]/followers" />
      <Stack.Screen name="[username]/following" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
