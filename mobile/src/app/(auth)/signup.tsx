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
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import { validateSignup } from '@/utils/authValidation';
import { APP_NAME } from '@/constants/branding';
import { normalizeApiError } from '@/utils/normalizeApiError';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { enterPreview, exitPreview, isPreviewMode } = usePreview();
  const { signup } = useAuth();

  const handlePreview = () => {
    enterPreview();
    router.replace('/(tabs)');
  };

  const handleSubmit = async () => {
    const errors = validateSignup({ name, username, email, password });
    setFieldErrors(errors);
    setFormError('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      if (isPreviewMode) {
        exitPreview();
      }
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(normalizeApiError(error as ApiError, 'signup'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <KeyboardAwareContainer contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Typography variant="screenTitle">Join {APP_NAME}</Typography>
          <Typography variant="metadata">Create your account to get started</Typography>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (fieldErrors.name) {
                setFieldErrors((current) => ({ ...current, name: '' }));
              }
            }}
            placeholder="Jane Doe"
            autoComplete="name"
            error={fieldErrors.name}
          />
          <TextInput
            label="Username"
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              if (fieldErrors.username) {
                setFieldErrors((current) => ({ ...current, username: '' }));
              }
            }}
            placeholder="janedoe"
            autoCapitalize="none"
            autoComplete="username"
            error={fieldErrors.username}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (fieldErrors.email) {
                setFieldErrors((current) => ({ ...current, email: '' }));
              }
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (fieldErrors.password) {
                setFieldErrors((current) => ({ ...current, password: '' }));
              }
            }}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            helperText={fieldErrors.password ? undefined : 'Minimum 6 characters'}
            error={fieldErrors.password}
          />
        </View>

        {formError ? (
          <Typography variant="error" style={styles.formError}>
            {formError}
          </Typography>
        ) : null}

        <PrimaryButton
          title="Create Account"
          icon="person-add-outline"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
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
  formError: {
    marginBottom: spacing.lg,
    textAlign: 'center',
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
