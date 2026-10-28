import React from 'react';
import { StyleSheet } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { useThemeColor } from '@/hooks/useThemeColor';
import { height } from '@/utils/responsive.utils';
import SafeAreaWrapper from '../hoc/SafeAreaWrapper';

type Props = {
  sheetRef: any;
  sheetHeight?: number;
  children: React.ReactNode;
  backgroundColor?: string;
  draggable?: boolean;
};

const BottomSheet: React.FC<Props> = ({
  sheetRef,
  children,
  sheetHeight = height / 3,
  backgroundColor,
  draggable = true,
}) => {
  const theme = useThemeColor();
  const surface = backgroundColor ?? theme.surface;

  return (
    <RBSheet
      ref={sheetRef}
      height={sheetHeight}
      closeOnPressMask
      closeOnPressBack
      draggable={draggable}
      customStyles={{
        wrapper: {
          backgroundColor: theme.overlay,
        },
        draggableIcon: {
          backgroundColor: theme.textSecondary,
        },
        container: {
          borderTopEndRadius: 10,
          borderTopStartRadius: 10,
          backgroundColor: surface,
        },
      }}
    >
      <SafeAreaWrapper style={{ ...styles.container, backgroundColor: surface }}>
        {children}
      </SafeAreaWrapper>
    </RBSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BottomSheet;
