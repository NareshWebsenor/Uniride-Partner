import React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";
import { useThemeColor } from "@/hooks/useThemeColor";
import { wp } from "@/utils/responsive.utils";

export type EarningsIconName =
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "rateCard";
type Props = SvgProps & { name: EarningsIconName };

const paths: Record<EarningsIconName, string> = {
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  chevronDown: "M5 9l7 7 7-7",
  rateCard:
    "M6 3h12a1 1 0 0 1 1 1v17l-2-1.5-2 1.5-3-1.5-3 1.5-2-1.5L5 21V4a1 1 0 0 1 1-1ZM9 7h6M9 11h6M9 15h3",
};

export default function EarningsIcon({ name, color, ...props }: Props) {
  const colors = useThemeColor();
  return (
    <Svg
      width={wp("5%")}
      height={wp("5%")}
      viewBox="0 0 24 24"
      accessible={false}
      {...props}
    >
      <Path
        d={paths[name]}
        fill={colors.transparent}
        stroke={color ?? colors.textPrimary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
