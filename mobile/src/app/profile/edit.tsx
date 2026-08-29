import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  IconButton,
  TextInput,
  PrimaryButton,
  LoadingSpinner,
} from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui';
import { userService } from '@/services/user.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { useSafeBack } from '@/hooks/useSafeBack';

const BIO_MAX_LENGTH = 160;

export default function EditProfileScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)');
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await userService.getMe();
        if (!active) {
          return;
        }
        setName(profile.name);
        setBio(profile.bio ?? '');
        setAvatar(profile.avatar ?? '');
      } catch (err) {
        if (active) {
          showToast(normalizeApiError(err as ApiError, 'general'), 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user) {
      setName(user.name);
      setBio(user.bio ?? '');
      setAvatar(user.avatar ?? '');
      setLoading(false);
      loadProfile();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [showToast, user]);

  const validate = () => {
    const errors: Record<string, string> = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (bio.trim().length > BIO_MAX_LENGTH) {
      errors.bio = `Bio cannot exceed ${BIO_MAX_LENGTH} characters`;
    }

    const trimmedAvatar = avatar.trim();
    if (trimmedAvatar) {
      try {
        const url = new URL(trimmedAvatar);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          errors.avatar = 'Avatar must be a valid HTTP or HTTPS URL';
        }
      } catch {
        errors.avatar = 'Avatar must be a valid URL';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const updated = await userService.updateMyProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
      });

      await updateUser({
        _id: updated._id,
        name: updated.name,
        username: updated.username,
        email: updated.email ?? user?.email ?? '',
        avatar: updated.avatar ?? undefined,
        bio: updated.bio,
        createdAt: updated.createdAt,
      });

      showToast('Profile updated successfully', 'success');
      goBack();
    } catch (err) {
      showToast(normalizeApiError(err as ApiError, 'general'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <AppHeader
        title="Edit Profile"
        leftAction={
          <IconButton
            icon="arrow-back"
            accessibilityLabel="Go back"
            onPress={goBack}
          />
        }
      />

      {loading ? (
        <LoadingSpinner style={styles.centered} />
      ) : (
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
            error={fieldErrors.name}
            autoCapitalize="words"
          />

          <TextInput
            label="Bio"
            value={bio}
            onChangeText={(value) => {
              setBio(value);
              if (fieldErrors.bio) {
                setFieldErrors((current) => ({ ...current, bio: '' }));
              }
            }}
            error={fieldErrors.bio}
            multiline
            numberOfLines={3}
            placeholder={`Tell us about yourself (max ${BIO_MAX_LENGTH} characters)`}
          />

          <TextInput
            label="Avatar URL"
            value={avatar}
            onChangeText={(value) => {
              setAvatar(value);
              if (fieldErrors.avatar) {
                setFieldErrors((current) => ({ ...current, avatar: '' }));
              }
            }}
            error={fieldErrors.avatar}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://example.com/avatar.png"
          />

          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  centered: {
    marginTop: spacing.xl,
  },
  form: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
