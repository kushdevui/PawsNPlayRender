// Draws a handwritten signature from its strokes with plain Views (no SVG / canvas library needed),
// so it looks the same on iOS, Android and the web. Used by SignaturePad (live drawing) and by the admin
// waiver detail (a saved signature, scaled to fit any box).
import { memo, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import type { SignatureData } from '@/api/types';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';

interface StrokeProps {
  /** Strokes of [x, y] points. */
  strokes: number[][][];
  /** Multiplier from stroke space to screen points (default 1). */
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  /** Pen width in screen points. */
  strokeWidth: number;
  color: string;
}

/**
 * One thin rotated View per pair of consecutive points (each a bit longer than the gap, with round ends, so the joints
 * close up), and a dot for a single tap. Fills its parent and ignores touches.
 */
export const StrokeRenderer = memo(function StrokeRenderer({ strokes, scale = 1, offsetX = 0, offsetY = 0, strokeWidth, color }: StrokeProps) {
  const w = strokeWidth;
  const parts: ReactNode[] = [];
  strokes.forEach((stroke, si) => {
    const pt = (p: number[]) => [offsetX + p[0] * scale, offsetY + p[1] * scale];
    if (stroke.length === 1) {
      const [x, y] = pt(stroke[0]);
      parts.push(
        <View key={`${si}`} style={{ position: 'absolute', left: x - w, top: y - w, width: w * 2, height: w * 2, borderRadius: w, backgroundColor: color }} />,
      );
      return;
    }
    for (let i = 1; i < stroke.length; i++) {
      const [x1, y1] = pt(stroke[i - 1]);
      const [x2, y2] = pt(stroke[i]);
      const length = Math.hypot(x2 - x1, y2 - y1) + w;
      parts.push(
        <View
          key={`${si}-${i}`}
          style={{
            position: 'absolute',
            left: (x1 + x2) / 2 - length / 2,
            top: (y1 + y2) / 2 - w / 2,
            width: length,
            height: w,
            borderRadius: w / 2,
            backgroundColor: color,
            transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
          }}
        />,
      );
    }
  });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {parts}
    </View>
  );
});

interface ViewProps {
  signature: SignatureData | null;
  /** Box height (default theme.sizes.signatureViewHeight). The width fills the parent. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** A saved signature, scaled to fit (and centred in) a bordered box. */
export function SignatureView({ signature, height, style, accessibilityLabel = 'Signature' }: ViewProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (width !== box.width || h !== box.height) setBox({ width, height: h });
  };

  const pad = theme.spacing.sm;
  const fit =
    signature && box.width > 0
      ? Math.min((box.width - pad * 2) / signature.width, (box.height - pad * 2) / signature.height)
      : 0;
  const scale = Math.max(0, fit);

  return (
    <View
      style={[styles.box, { height: height ?? theme.sizes.signatureViewHeight }, style]}
      onLayout={onLayout}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {signature && scale > 0 ? (
        <StrokeRenderer
          strokes={signature.strokes}
          scale={scale}
          offsetX={(box.width - signature.width * scale) / 2}
          offsetY={(box.height - signature.height * scale) / 2}
          strokeWidth={Math.max(theme.sizes.borderWidth, theme.sizes.signatureStroke * scale)}
          color={theme.colors.text}
        />
      ) : (
        !signature && <AppText variant="caption" align="center">No drawn signature.</AppText>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  box: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderWidth: t.sizes.borderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    overflow: 'hidden',
  },
}));
