/// <reference types="nativewind/types" />

// Augmentación de tipos para la prop `className` de NativeWind.
// Se declara localmente porque `react-native-css-interop` queda anidado
// dentro de `node_modules/nativewind` y su `/// <reference>` no resuelve
// desde el nivel superior del proyecto.
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
