import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import type { TMainTabs } from "@/interface/navigation.type";
import { useThemeColor } from "@/hooks/useThemeColor";

type Props = { name: keyof TMainTabs; color: string; size: number };

const paths: Record<keyof TMainTabs, string> = {
  Home: "M3 21V10a3 3 0 0 1 1-2l6-5a3 3 0 0 1 4 0l6 5a3 3 0 0 1 1 2v11h-6v-8H9v8Z",
  Trips:
    "M8 8h5a3 3 0 0 1 0 6H7a3.5 3.5 0 0 0 0 7h9 M7 4c0 2-3 5-3 5S1 6 1 4a3 3 0 1 1 6 0Z M23 17c0 2-3 5-3 5s-3-3-3-5a3 3 0 1 1 6 0Z",
  Earnings: "M21 8V4H3v17h18v-5 M22 8h-6a4 4 0 0 0 0 8h6Z",
  Inbox:
    "M3 5h18a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M2 7l10 6L22 7",
  Menu: "M3 5h18 M3 12h18 M3 19h18",
};

export default function MainTabIcon({ name, color, size }: Props) {
  const colors = useThemeColor();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d={paths[name]}
        fill={colors.transparent}
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {name === "Earnings" && <Circle cx={17} cy={12} r={1} fill={color} />}
      {name === "Trips" && (
        <>
          <Circle cx={4} cy={4} r={0.8} fill={color} />
          <Circle cx={20} cy={17} r={0.8} fill={color} />
        </>
      )}
    </Svg>
  );
}
