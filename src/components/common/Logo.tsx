import { Image, type ImageStyle, type StyleProp } from 'react-native';

const LOGO = require('../../../assets/images/logo.png');
const ASPECT_RATIO = 640 / 720; // width / height of assets/images/logo.png

/** Paws N' Play logo. `size` is the rendered height. */
export function Logo({ size = 140, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={LOGO}
      style={[{ height: size, width: size * ASPECT_RATIO }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Paws N' Play"
    />
  );
}
