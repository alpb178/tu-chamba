import React from 'react';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

const NAVY = '#102136';
const YELLOW = '#fdc101';
const WHITE = '#ffffff';

// Logo TuChamba (maletín + wordmark) vectorial, reutilizable.
export function Logo({ width = 200, showText = true }: { width?: number; showText?: boolean }) {
  if (!showText) {
    // Solo el maletín (cuadrado).
    const size = width;
    return (
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Path
          d="M78 72 V58 a14 14 0 0 1 14-14 h16 a14 14 0 0 1 14 14 V72"
          fill="none"
          stroke={NAVY}
          strokeWidth={14}
          strokeLinejoin="round"
        />
        <Rect x={24} y={64} width={152} height={112} rx={16} fill={NAVY} />
        <Path d="M24 100 L100 126 L176 100" fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x={84} y={108} width={32} height={32} rx={6} fill={YELLOW} />
      </Svg>
    );
  }

  const height = (width * 180) / 840;
  return (
    <Svg width={width} height={height} viewBox="0 0 840 180">
      <G transform="translate(10,10) scale(0.8)">
        <Path
          d="M78 72 V58 a14 14 0 0 1 14-14 h16 a14 14 0 0 1 14 14 V72"
          fill="none"
          stroke={NAVY}
          strokeWidth={14}
          strokeLinejoin="round"
        />
        <Rect x={24} y={64} width={152} height={112} rx={16} fill={NAVY} />
        <Path d="M24 100 L100 126 L176 100" fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x={84} y={108} width={32} height={32} rx={6} fill={YELLOW} />
      </G>
      <G transform="translate(190,12)">
        <SvgText x={6} y={120} fontSize={120} fontWeight="800" fill={NAVY}>
          Tu
        </SvgText>
        <Path d="M150 84 l30 36 l72 -84" fill="none" stroke={YELLOW} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
        <SvgText x={250} y={120} fontSize={120} fontWeight="800" fill={NAVY}>
          hamba
        </SvgText>
      </G>
    </Svg>
  );
}
