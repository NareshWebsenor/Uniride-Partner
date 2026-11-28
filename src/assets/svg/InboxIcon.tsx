import React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";
import { useThemeColor } from "@/hooks/useThemeColor";
import { wp } from "@/utils/responsive.utils";

export type InboxIconName = "support" | "send" | "back" | "chevronRight";
type Props = SvgProps & { name: InboxIconName };

const paths: Record<InboxIconName, string> = {
  support:
    "M4 13v-2a8 8 0 0 1 16 0v2M4 11H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h3v-7ZM20 11h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-3v-7ZM20 18v1a2 2 0 0 1-2 2h-4M11 20h3v2h-3Z",
  send: "M4 12h16M13 5l7 7-7 7",
  back: "M20 12H4M11 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
};

export default function InboxIcon({ name, color, ...props }: Props) {
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
