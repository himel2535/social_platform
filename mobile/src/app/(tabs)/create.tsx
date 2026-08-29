import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Screen,
  AppHeader,
  Typography,
  TextInput,
  PrimaryButton,
  KeyboardAwareContainer,
} from '@/components/ui';
import { spacing } from '@/theme/spacing';

const MAX_LENGTH = 1000;

export default function CreatePostScreen() {
  const [content, setContent] = useState('');

  return (
    <Screen scroll={false}>
      <AppHeader title="New Post" />
      <KeyboardAwareContainer contentContainerStyle={styles.container}>
        <Typography variant="metadata" style={styles.hint}>
          Share something with the community. Text only for now.
        </Typography>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What's on your mind?"
          multiline
          numberOfLines={6}
          maxLength={MAX_LENGTH}
          style={styles.input}
        />

        <Typography variant="metadata" style={styles.counter}>
          {content.length}/{MAX_LENGTH}
        </Typography>

        <PrimaryButton
          title="Publish"
          icon="send-outline"
          onPress={() => {}}
          disabled={!content.trim()}
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
    marginBottom: spacing.xl,
  },
  button: {
    alignSelf: 'stretch',
  },
});
