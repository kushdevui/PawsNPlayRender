// Finger / mouse signature pad built on PanResponder (works on iOS, Android and react-native-web, no extra library).
// Points are recorded in the box's own pixel space ({ width, height, strokes: [[[x, y], ...], ...] }) and drawn
// with StrokeRenderer. While the pen is down the pad keeps the gesture (the parent ScrollView must not scroll):
// it claims the responder in the capture phase, refuses to hand it over, and reports onDrawingChange(true/false)
// so the screen can also set scrollEnabled={false}.
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import type { SignatureData } from '@/api/types';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { StrokeRenderer } from './SignatureView';

interface Props {
  value: SignatureData | null;
  onChange: (value: SignatureData | null) => void;
  /** true while the pen is down - use it to disable the parent ScrollView. */
  onDrawingChange?: (drawing: boolean) => void;
  /** Field label above the box (e.g. "Signature"). */
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Limits accepted by the server; the pad stops recording beyond them. */
  maxStrokes?: number;
  maxPoints?: number;
}

const countPoints = (strokes: number[][][]) => strokes.reduce((n, s) => n + s.length, 0);

// Web: stop touch scrolling / text selection inside the box (not in the RN style types, hence the cast).
const webNoGestures = (Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none', cursor: 'crosshair' } : {}) as unknown as ViewStyle;

export function SignaturePad({
  value,
  onChange,
  onDrawingChange,
  label,
  required,
  error,
  disabled,
  placeholder = 'Sign here with your finger or mouse',
  maxStrokes = 100,
  maxPoints = 5000,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [size, setSize] = useState({ width: 0, height: 0 });
  // The stroke being drawn: mutated in `current` by the handlers, mirrored to `live` for rendering.
  const [live, setLive] = useState<number[][] | null>(null);
  const current = useRef<number[][] | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  // Handlers are created once; they read the latest props from here.
  const latest = useRef({ value, onChange, onDrawingChange, disabled, size, maxStrokes, maxPoints });
  useEffect(() => {
    latest.current = { value, onChange, onDrawingChange, disabled, size, maxStrokes, maxPoints };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    const height = Math.round(e.nativeEvent.layout.height);
    if (width === size.width && height === size.height) return;
    setSize({ width, height });
    // The box changed size (window resized / rotated): keep the signature by scaling it to the new box.
    if (value && value.width > 0 && value.height > 0 && width > 0 && height > 0) {
      const sx = width / value.width;
      const sy = height / value.height;
      onChange({ width, height, strokes: value.strokes.map((s) => s.map(([x, y]) => [Math.round(x * sx), Math.round(y * sy)])) });
    }
  };

  const responder = useMemo(() => {
    const minStep = theme.sizes.signatureMinStep;
    const canDraw = () => !latest.current.disabled;
    const point = (x: number, y: number) => {
      const { width, height } = latest.current.size;
      return [Math.round(Math.min(Math.max(x, 0), width)), Math.round(Math.min(Math.max(y, 0), height))];
    };
    const finish = () => {
      const stroke = current.current;
      current.current = null;
      const { value: v, onChange: change, onDrawingChange: drawing, size: box } = latest.current;
      drawing?.(false);
      if (stroke && stroke.length > 0 && box.width > 0) {
        change({ width: box.width, height: box.height, strokes: [...(v?.strokes ?? []), stroke] });
      }
      setLive(null);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: canDraw,
      onStartShouldSetPanResponderCapture: canDraw,
      onMoveShouldSetPanResponder: canDraw,
      onMoveShouldSetPanResponderCapture: canDraw,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        const { pageX, pageY, locationX, locationY } = e.nativeEvent;
        const done = latest.current.value?.strokes ?? [];
        if (done.length >= latest.current.maxStrokes || countPoints(done) >= latest.current.maxPoints) return; // box is full
        // Strokes ignore touches, so the first event's location is relative to the box. Later points use
        // page coordinates minus this origin (location can be relative to another view once the pen leaves the box).
        origin.current = { x: pageX - locationX, y: pageY - locationY };
        current.current = [point(locationX, locationY)];
        latest.current.onDrawingChange?.(true);
        setLive(current.current.slice());
      },
      onPanResponderMove: (e) => {
        const stroke = current.current;
        if (!stroke) return;
        if (countPoints(latest.current.value?.strokes ?? []) + stroke.length >= latest.current.maxPoints) return;
        const p = point(e.nativeEvent.pageX - origin.current.x, e.nativeEvent.pageY - origin.current.y);
        const last = stroke[stroke.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < minStep) return;
        stroke.push(p);
        setLive(stroke.slice());
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, [theme.sizes.signatureMinStep]);

  const strokes = value?.strokes ?? [];
  const drawn = live ? [...strokes, live] : strokes;
  const empty = drawn.length === 0;
  const full = strokes.length >= maxStrokes || countPoints(strokes) >= maxPoints;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        {!!label && (
          <AppText variant="body" style={styles.flex}>
            {label}
            {required && <AppText variant="bodyStrong" color="primaryText">{' *'}</AppText>}
          </AppText>
        )}
        <Button
          title="Clear"
          icon="eraser"
          variant="ghost"
          size="sm"
          onPress={() => onChange(null)}
          disabled={disabled || strokes.length === 0}
          accessibilityHint="Clears the signature so you can sign again"
        />
      </View>
      <View
        {...responder.panHandlers}
        onLayout={onLayout}
        style={[styles.box, error ? styles.boxError : null, disabled ? styles.boxDisabled : null, webNoGestures]}
        accessible
        accessibilityLabel={label ? `${label}. ${placeholder}` : placeholder}
        accessibilityHint="Draw your signature in this box. You also type your name below to sign."
        accessibilityValue={{ text: empty ? 'Not signed' : 'Signed' }}
      >
        <View style={styles.baseline} pointerEvents="none" />
        {empty && (
          <View style={styles.placeholder} pointerEvents="none">
            <AppText variant="caption" color="placeholder" align="center">{placeholder}</AppText>
          </View>
        )}
        <StrokeRenderer strokes={drawn} strokeWidth={theme.sizes.signatureStroke} color={theme.colors.text} />
      </View>
      {full && <AppText variant="caption" style={styles.error}>The box is full. Tap Clear to sign again.</AppText>}
      {!!error && <AppText variant="label" color="danger" style={styles.error}>{error}</AppText>}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignSelf: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm, marginBottom: t.spacing.xs },
  flex: { flex: 1 },
  box: {
    height: t.sizes.signaturePadHeight,
    borderWidth: t.sizes.focusBorderWidth,
    borderColor: t.colors.borderStrong,
    borderStyle: 'dashed',
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    overflow: 'hidden',
  },
  boxError: { borderColor: t.colors.danger },
  boxDisabled: { backgroundColor: t.colors.disabled },
  // Light "sign on the line" guide, a quarter up from the bottom.
  baseline: {
    position: 'absolute',
    left: t.spacing.lg,
    right: t.spacing.lg,
    bottom: t.sizes.signaturePadHeight / 4,
    borderBottomWidth: t.sizes.borderWidth,
    borderBottomColor: t.colors.border,
  },
  placeholder: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: t.spacing.lg },
  error: { marginTop: t.spacing.xs },
}));
