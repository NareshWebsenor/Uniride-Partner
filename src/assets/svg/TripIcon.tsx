import React from "react";
import Svg, { Circle, Path, type SvgProps } from "react-native-svg";
import { useThemeColor } from "@/hooks/useThemeColor";
import { wp } from "@/utils/responsive.utils";

export type TripIconName =
  | "car"
  | "back"
  | "check"
  | "phone"
  | "message"
  | "navigate"
  | "location";
type Props = SvgProps & { name: TripIconName };

const paths: Record<Exclude<TripIconName, "location">, string> = {
  car: "M5 9l1.4-4.2A1.2 1.2 0 0 1 7.5 4h9a1.2 1.2 0 0 1 1.1.8L19 9M4 10a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7H4ZM5 17v3M19 17v3M7 13h2M15 13h2",
  back: "M19 12H5M11 5l-7 7 7 7",
  check: "M5 12l4.5 4.5L19 7",
  phone:
    "M7.2 3H4.6C3.7 3 3 3.7 3 4.6A16.4 16.4 0 0 0 19.4 21c.9 0 1.6-.7 1.6-1.6v-2.6l-4.5-1.7-2 2a13 13 0 0 1-7.6-7.6l2-2Z",
  message:
    "M21 11.5c0 4.1-4 7.5-9 7.5-.9 0-1.8-.1-2.6-.3L5 21v-4.1c-1.3-1.4-2-3.2-2-5.4C3 7.4 7 4 12 4s9 3.4 9 7.5Z",
  navigate: "M21 3 3 10.5l7.5 3L13.5 21Z",
};

export default function TripIcon({ name, color, ...props }: Props) {
  const colors = useThemeColor();
  const ink = color ?? colors.textPrimary;
  return (
    <Svg
      width={wp("5%")}
      height={wp("5%")}
      viewBox="0 0 24 24"
      accessible={false}
      {...props}
    >
      {name === "location" ? (
        <>
          <Circle
            cx={12}
            cy={12}
            r={8.5}
            fill={colors.transparent}
            stroke={ink}
            strokeWidth={2}
          />
          <Circle cx={12} cy={12} r={3.5} fill={ink} />
        </>
      ) : (
        <Path
          d={paths[name]}
          fill={
            name === "navigate" || name === "message" ? ink : colors.transparent
          }
          stroke={ink}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}
