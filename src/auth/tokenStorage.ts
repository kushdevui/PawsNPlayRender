// Tokens live in the device keychain/keystore (expo-secure-store).
// SecureStore isn't available on web, so web falls back to localStorage (dev only).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'pnp.accessToken';
const REFRESH = 'pnp.refreshToken';

const web = {
  get: (k: string) => {
    try {
      return globalThis.localStorage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {}
  },
  remove: (k: string) => {
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {}
  },
};

const isWeb = Platform.OS === 'web';
const getItem = (k: string) => (isWeb ? Promise.resolve(web.get(k)) : SecureStore.getItemAsync(k));
const setItem = (k: string, v: string) => (isWeb ? Promise.resolve(web.set(k, v)) : SecureStore.setItemAsync(k, v));
const removeItem = (k: string) => (isWeb ? Promise.resolve(web.remove(k)) : SecureStore.deleteItemAsync(k));

export const tokenStorage = {
  load: async () => ({ accessToken: await getItem(ACCESS), refreshToken: await getItem(REFRESH) }),
  save: async (accessToken: string, refreshToken: string) => {
    await setItem(ACCESS, accessToken);
    await setItem(REFRESH, refreshToken);
  },
  clear: async () => {
    await removeItem(ACCESS);
    await removeItem(REFRESH);
  },
};
