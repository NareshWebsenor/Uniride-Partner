import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { useThemeColor } from '@/hooks/useThemeColor';

/** Illustrative street grid; never presented as actual location or navigation. */
export default function DemoMap({ showRoute }: { showRoute: boolean }) {
  const colors = useThemeColor();
  const driver = showRoute ? { x: 105, y: 330 } : { x: 195, y: 255 };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 450" preserveAspectRatio="xMidYMid slice">
        <Rect width="400" height="450" fill={colors.surfaceRaised} />
        <G rotation={-18} origin="200,225">
          {Array.from({ length: 14 }, (_, i) => (
            <G key={i}>
              <Line x1={i * 38 - 60} y1={-100} x2={i * 38 - 60} y2={600}
                stroke={colors.surface} strokeWidth={i % 3 === 0 ? 4 : 1.5} />
              <Line x1={-150} y1={i * 42 - 50} x2={600} y2={i * 42 - 50}
                stroke={colors.surface} strokeWidth={i % 4 === 0 ? 5 : 1.5} />
            </G>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <Path key={i}
              d={`M ${i * 68 - 35} 80 v 35 h 18 v 42 h -18 v 65 h 18 v 40 h -18 v 95`}
              stroke={colors.surface} strokeWidth={1.2} fill={colors.transparent} />
          ))}
          <Rect x={225} y={-25} width={65} height={82} rx={6}
            fill={colors.success} opacity={0.08} />
          <Rect x={105} y={290} width={55} height={80} rx={6}
            fill={colors.success} opacity={0.08} />
        </G>
        <Path d="M -20 25 L 44 135 L 50 240 L 38 340 L 48 470"
          stroke={colors.border} strokeWidth={12} fill={colors.transparent} />
        <Path d="M -20 25 L 44 135 L 50 240 L 38 340 L 48 470"
          stroke={colors.primary} strokeWidth={7} opacity={0.25} fill={colors.transparent} />
        <Path d="M -10 220 Q 120 220 230 180 T 420 145"
          stroke={colors.primary} strokeWidth={3} opacity={0.3} fill={colors.transparent} />
        {showRoute && (
          <G>
            <Path d="M 105 330 L 145 278 L 195 200 L 260 245 L 278 218 L 300 243 L 300 205"
              stroke={colors.primary} strokeWidth={3} strokeLinejoin="round"
              fill={colors.transparent} />
            <Circle cx={300} cy={205} r={8} fill={colors.primary}
              stroke={colors.surface} strokeWidth={3} />
          </G>
        )}
        <G x={driver.x} y={driver.y}>
          <Circle r={19} fill={colors.shadow} opacity={0.08} cy={2} />
          <Circle r={17} fill={colors.surface} stroke={colors.primary} strokeWidth={2} />
          <Path d="M 0 -9 L 7 7 L 0 3 L -7 7 Z" fill={colors.primary} />
        </G>
      </Svg>
    </View>
  );
}
