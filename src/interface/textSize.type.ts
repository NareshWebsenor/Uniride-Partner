export const TEXT_SIZE_OPTIONS = [
  "small",
  "default",
  "large",
  "extraLarge",
] as const;

export type TextSize = (typeof TEXT_SIZE_OPTIONS)[number];

/** App scaling is additional to the device's accessibility font scale. */
export const TEXT_SIZE_SCALES: Readonly<Record<TextSize, number>> = {
  small: 0.85,
  default: 1,
  large: 1.15,
  extraLarge: 1.3,
};
