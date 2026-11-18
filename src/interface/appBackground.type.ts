import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface AppBackgroundStyleOptions {
  top: number;
  bottom: number;
  left: number;
  right: number;
  backgroundColor?: string;
}

export interface AppBackgroundProps
  extends Pick<AppBackgroundStyleOptions, 'backgroundColor'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  extendUnderStatusBar?: boolean;
}
