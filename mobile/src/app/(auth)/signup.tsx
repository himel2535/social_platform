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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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
          <Typography variant="screenTitle">Join Nexus Social</Typography>
          <Typography variant="metadata">Create your account to get started</Typography>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Jane Doe"
            autoComplete="name"
          />
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="janedoe"
            autoCapitalize="none"
            autoComplete="username"
          />
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
            helperText="Minimum 6 characters"
          />
        </View>

        <PrimaryButton
          title="Create Account"
          icon="person-add-outline"
          onPress={() => {}}
          style={styles.button}
        />

        <Link href="/(auth)/login" asChild>
          <SecondaryButton title="Already have an account?" style={styles.linkButton} />
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
