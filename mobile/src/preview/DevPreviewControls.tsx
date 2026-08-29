import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui';
import { usePreview } from './PreviewContext';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { glass, layout } from '@/theme/glass';

type NavLinkProps = {
  label: string;
  onPress: () => void;
};

function NavLink({ label, onPress }: NavLinkProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.link} accessibilityRole="button">
      <Typography variant="metadata" color="secondary">
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

export function DevPreviewControls() {
  const router = useRouter();
  const { isPreviewMode, exitPreview } = usePreview();

  if (!__DEV__ || !isPreviewMode) {
    return null;
  }

  const handleExit = () => {
    exitPreview();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, styles.containerPointerEvents]}>
      <View style={styles.banner}>
        <Typography variant="metadata" color="textSecondary" style={styles.label}>
          DEV PREVIEW
        </Typography>
        <View style={styles.links}>
          <NavLink label="Login" onPress={() => router.push('/(auth)/login')} />
          <NavLink label="Signup" onPress={() => router.push('/(auth)/signup')} />
          <NavLink label="Post Detail" onPress={() => router.push('/post/preview-1')} />
          <NavLink label="Exit" onPress={handleExit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: layout.tabBarHeight + spacing.sm,
    alignItems: 'center',
    zIndex: 100,
  },
  containerPointerEvents: {
    pointerEvents: 'box-none',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: glass.backgroundColor,
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  label: {
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  link: {
    paddingVertical: spacing.xs,
  },
});
