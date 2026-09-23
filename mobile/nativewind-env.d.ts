/// <reference types="nativewind/types" />

// Type augmentation for NativeWind's `className` prop.
// Declared locally because `react-native-css-interop` is nested inside
// `node_modules/nativewind` and its `/// <reference>` does not resolve from
// the project's top level.
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
}
