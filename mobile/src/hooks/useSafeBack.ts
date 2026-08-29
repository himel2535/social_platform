import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

export function useSafeBack(fallbackHref: Href = '/(tabs)') {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }, [router, fallbackHref]);
}
