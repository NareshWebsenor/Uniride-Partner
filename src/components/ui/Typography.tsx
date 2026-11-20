import React, { createContext, forwardRef, useContext } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { useTextSizeStore } from "@/store/textSizeStore";
import { TEXT_SIZE_SCALES } from "@/interface/textSize.type";
import { useThemeColor } from "@/hooks/useThemeColor";

const InsideText = createContext(false);

function scaledStyle(
  style: TextStyle | undefined,
  scale: number,
  nested = false
): TextStyle {
  const result: TextStyle = {};
  // 14 is React Native's default font size, retained for unstyled legacy text.
  // Nested text without its own size inherits its already-scaled parent.
  if (style?.fontSize !== undefined || !nested) {
    result.fontSize = (style?.fontSize ?? 14) * scale;
  }
  if (style?.lineHeight !== undefined)
    result.lineHeight = style.lineHeight * scale;
  if (style?.letterSpacing !== undefined)
    result.letterSpacing = style.letterSpacing * scale;
  return result;
}

/** Lowest text boundary: scale once after all caller style overrides. */
export type ScaledText = NativeText;
export const ScaledText = forwardRef<NativeText, TextProps>(function ScaledText(
  { style, children, ...props },
  ref
) {
  const scale = useTextSizeStore((state) => TEXT_SIZE_SCALES[state.size]);
  const nested = useContext(InsideText);
  return (
    <InsideText.Provider value>
      <NativeText
        {...props}
        ref={ref}
        style={[style, scaledStyle(StyleSheet.flatten(style), scale, nested)]}
      >
        {children}
      </NativeText>
    </InsideText.Provider>
  );
});

/** Refs, native accessibility scaling and input values remain intact. */
export type ScaledTextInput = NativeTextInput;
export const ScaledTextInput = forwardRef<NativeTextInput, TextInputProps>(
  function ScaledTextInput({ style, ...props }, ref) {
    const scale = useTextSizeStore((state) => TEXT_SIZE_SCALES[state.size]);
    const colors = useThemeColor();
    return (
      <NativeTextInput
        placeholderTextColor={colors.placeHolderColor}
        {...props}
        ref={ref}
        style={[style, scaledStyle(StyleSheet.flatten(style), scale)]}
      />
    );
  }
);
