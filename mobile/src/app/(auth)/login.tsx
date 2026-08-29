import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  Screen,
  KeyboardAwareContainer,
  Typography,
  TextInput,
  PasswordInput,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { usePreview } from '@/preview';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { enterPreview } = usePreview();

  const handlePreview = () => {
    enterPreview();
    router.replace('/(tabs)');
  };

  return (
    <Screen scroll={false}>
      <KeyboardAwareContainer contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Typography variant="screenTitle">Welcome back</Typography>
          <Typography variant="metadata">Sign in to Nexus Social</Typography>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            autoComplete="password"
          />
        </View>

        <PrimaryButton
          title="Sign In"
          icon="log-in-outline"
          onPress={() => {}}
          style={styles.button}
        />

        <Link href="/(auth)/signup" asChild>
          <SecondaryButton title="Create an account" style={styles.linkButton} />
        </Link>

        {__DEV__ && (
          <SecondaryButton
            title="Preview App (Development)"
            icon="eye-outline"
            onPress={handlePreview}
            style={styles.previewButton}
          />
        )}
      </KeyboardAwareContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.lg,
  },
  linkButton: {
    alignSelf: 'center',
  },
  previewButton: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
});
