// Browser tab title for the web build. No-op on iOS/Android.
// Screens also set Stack.Screen `title`; this makes the tab title explicit on web regardless of
// how the navigator formats it, and restores the previous title when the screen unmounts.
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
