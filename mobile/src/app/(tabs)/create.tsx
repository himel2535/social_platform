import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  Typography,
  TextInput,
  PrimaryButton,
  KeyboardAwareContainer,
} from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { usePreview } from '@/preview';
import { postService } from '@/services/post.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';

const MAX_LENGTH = 1000;

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isPreviewMode } = usePreview();

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    if (isPreviewMode) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await postService.createPost({ content: trimmed });
      setContent('');
      router.replace('/(tabs)');
    } catch (err) {
      setError(normalizeApiError(err as ApiError, 'general'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <AppHeader title="New Post" />
      <KeyboardAwareContainer contentContainerStyle={styles.container}>
        <Typography variant="metadata" style={styles.hint}>
          {isPreviewMode
            ? 'Preview mode uses mock data only. Sign in to publish real posts.'
            : 'Share something with the community. Text only for now.'}
        </Typography>

        <TextInput
          value={content}
          onChangeText={(value) => {
            setContent(value);
            if (error) {
              setError('');
            }
          }}
          placeholder="What's on your mind?"
          multiline
          numberOfLines={6}
          maxLength={MAX_LENGTH}
          style={styles.input}
          editable={!loading}
        />

        <Typography variant="metadata" style={styles.counter}>
          {content.length}/{MAX_LENGTH}
        </Typography>

        {error ? (
          <Typography variant="error" style={styles.error}>
            {error}
          </Typography>
        ) : null}

        <PrimaryButton
          title="Publish"
          icon="send-outline"
          onPress={handleSubmit}
          disabled={!content.trim() || isPreviewMode}
          loading={loading}
          style={styles.button}
        />
      </KeyboardAwareContainer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  hint: {
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  counter: {
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  error: {
    marginBottom: spacing.md,
  },
  button: {
    alignSelf: 'stretch',
  },
});
