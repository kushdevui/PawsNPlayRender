import { useState } from 'react';
import { View } from 'react-native';
import { HelperText, TextInput as PaperTextInput, type TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import type { IconName } from './Icon';

export interface TextInputProps
  extends Omit<PaperTextInputProps, 'mode' | 'error' | 'left' | 'right' | 'label' | 'theme' | 'secureTextEntry' | 'style'> {
  label?: string;
  /** Error message; shows red outline + message below. */
  error?: string;
  helperText?: string;
  leftIcon?: IconName;
  /** Password field with a show/hide toggle. */
  password?: boolean;
}

/** The only text input screens should use. Renders Paper's outlined TextInput with our theme. */
export function TextInput({ label, error, helperText, leftIcon, password = false, ...rest }: TextInputProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [hidden, setHidden] = useState(true);
  const message = error || helperText;

  return (
    <View style={styles.wrap}>
      <PaperTextInput
        mode="outlined"
        label={label}
        error={!!error}
        secureTextEntry={password && hidden}
        autoCapitalize={password ? 'none' : rest.autoCapitalize}
        outlineColor={theme.colors.border}
        activeOutlineColor={theme.colors.secondary}
        textColor={theme.colors.text}
        placeholderTextColor={theme.colors.placeholder}
        selectionColor={theme.colors.primary}
        cursorColor={theme.colors.text}
        outlineStyle={styles.outline}
        style={styles.input}
        left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} color={theme.colors.textSubtle} /> : undefined}
        right={
          password ? (
            <PaperTextInput.Icon
              icon={hidden ? 'eye-outline' : 'eye-off-outline'}
              color={theme.colors.textMuted}
              onPress={() => setHidden((h) => !h)}
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              forceTextInputFocus={false}
            />
          ) : undefined
        }
        {...rest}
      />
      {!!message && (
        <HelperText type={error ? 'error' : 'info'} visible padding="none" style={styles.helper}>
          {message}
        </HelperText>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignSelf: 'stretch' },
  input: { backgroundColor: t.colors.surface, fontSize: t.fontSize.md },
  outline: { borderRadius: t.radius.md },
  helper: { paddingHorizontal: t.spacing.xs },
}));
