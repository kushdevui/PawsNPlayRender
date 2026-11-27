// Cross-platform alert/confirm. React Native's Alert.alert does nothing on web
// (react-native-web), so on web we fall back to the browser's own dialogs.
import { Alert, Platform, type AlertButton } from 'react-native';

/**
 * Same signature as Alert.alert. On web:
 * - no buttons / one button -> window.alert, then that button's onPress
 * - a cancel button + an action -> window.confirm; OK runs the first non-cancel button
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
  const cancel = (buttons ?? []).find((b) => b.style === 'cancel');
  if (!buttons?.length || !cancel || actions.length === 0) {
    globalThis.alert?.(text);
    (actions[0] ?? cancel)?.onPress?.();
    return;
  }
  if (globalThis.confirm?.(text)) actions[0].onPress?.();
  else cancel.onPress?.();
}
