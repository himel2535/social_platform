import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="compose" />
      <Stack.Screen name="[userId]" />
    </Stack>
  );
}
