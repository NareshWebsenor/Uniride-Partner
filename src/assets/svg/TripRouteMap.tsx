import React from "react";
import Svg, { Circle, G, Path, Rect, type SvgProps } from "react-native-svg";
import { useThemeColor } from "@/hooks/useThemeColor";
import { hp } from "@/utils/responsive.utils";

const neighbourhoods = [
  "M-10 18 53 1 72 38 20 60Z",
  "M83 3 124-5 134 28 98 37Z",
  "M139-4 190-4 181 36 147 31Z",
  "M210 2 260-6 247 43 199 38Z",
  "M268-5 319-3 324 39 257 42Z",
  "M-8 78 30 65 55 108 3 125Z",
  "M61 58 102 52 116 96 67 114Z",
  "M126 48 170 52 159 97 137 91Z",
  "M181 60 221 64 208 112 166 106Z",
  "M240 60 290 59 278 105 226 118Z",
  "M302 57 328 55 329 127 290 127Z",
];
const smallStreets =
  "M0 28 31 19 42 44 10 55M15 14l20 42M43 10l19 31M3 41l41-12M83 10l37-6M90 24l35-6M104 0l10 33M145 7l38 5M143 21l37 5M158 0l-3 32M174 0l-4 33M210 12l37 4M204 26l39 4M225 3l-9 35M239 0l-10 39M270 9h44M264 25h55M282 0l-9 42M300 0l-4 42M0 85l31-10M9 102l33-11M18 70l21 40M63 71l38-7M69 88l39-7M79 56l12 47M97 53l12 46M130 61l35 5M134 78l26 5M148 50l-7 44M183 75l33 5M177 91l34 5M199 64l-12 43M240 74h44M233 91h45M252 62l-12 49M269 62l-13 47M303 71h24M297 91h30M313 58l-9 64";
const car =
  "M5 9l1.4-4.2A1.2 1.2 0 0 1 7.5 4h9a1.2 1.2 0 0 1 1.1.8L19 9M4 10a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7H4ZM5 17v3M19 17v3M7 13h2M15 13h2";

/** Decorative route preview; no location access, external tiles or map requests. */
export default function TripRouteMap(props: SvgProps) {
  const colors = useThemeColor();
  return (
    <Svg
      width="100%"
      height={hp("13%")}
      viewBox="0 0 320 120"
      preserveAspectRatio="xMidYMid slice"
      accessible={false}
      {...props}
    >
      <Rect width={320} height={120} fill={colors.surfaceRaised} />
      <G fill={colors.border} opacity={0.3}>
        {neighbourhoods.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      <Path
        d={smallStreets}
        fill={colors.transparent}
        stroke={colors.surface}
        strokeWidth={1.3}
      />
      <Path
        d="M48-10 78 41 118 52 132 100 153 130M-10 73 55 49 80 45 125 39 192 49 247 51 330 46M201-10 186 48 160 130M267-10 251 47 216 130"
        fill={colors.transparent}
        stroke={colors.surface}
        strokeWidth={4.5}
        strokeLinejoin="round"
      />
      <Path
        d="M20-10 33 32 52 71 80 130"
        fill={colors.transparent}
        stroke={colors.border}
        strokeWidth={6}
      />
      <Path
        d="M20-10 33 32 52 71 80 130"
        fill={colors.transparent}
        stroke={colors.surface}
        strokeWidth={3}
      />
      {[
        { x: 117, y: 46, fill: colors.error },
        { x: 205, y: 76, fill: colors.success },
      ].map((marker) => (
        <G key={marker.x}>
          <Circle
            cx={marker.x}
            cy={marker.y + 2}
            r={14}
            fill={colors.textSecondary}
            opacity={0.08}
          />
          <Circle
            cx={marker.x}
            cy={marker.y}
            r={14}
            fill={marker.fill}
            stroke={colors.surface}
            strokeWidth={2}
          />
          <G
            transform={`translate(${marker.x - 7.2} ${
              marker.y - 7.2
            }) scale(0.6)`}
          >
            <Path
              d={car}
              fill={colors.transparent}
              stroke={colors.onPrimary}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        </G>
      ))}
    </Svg>
  );
}
