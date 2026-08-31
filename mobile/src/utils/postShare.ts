import * as Linking from 'expo-linking';

export function getPostShareUrl(postId: string): string {
  return Linking.createURL(`/post/${postId}`);
}
