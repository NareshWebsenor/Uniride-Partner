import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@/utils/fontIcon.utils';
import { fSize, hp, wp } from '@/utils/responsive.utils';
import { Text } from './Text';

export interface SwipeActionProps {
  label: string;
  onComplete: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  resetKey?: string;
}

/** Swipe confirmation with an equivalent screen-reader activation action. */
export default function SwipeAction({
  label,
  onComplete,
  disabled = false,
  accessibilityHint,
  resetKey,
}: SwipeActionProps) {
  const colors = useThemeColor();
  const offset = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);
  const [done, setDone] = useState(false);
  const [width, setWidth] = useState(0);
  const reducedMotion = useRef(false);
  const handleSize = Math.max(48, wp('12%'));
  const inset = wp('1%');
  const travel = Math.max(0, width - handleSize - inset * 2);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) reducedMotion.current = value;
    }).catch(() => {
      if (mounted) reducedMotion.current = true;
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      reducedMotion.current = value;
    });
    return () => { mounted = false; subscription.remove(); offset.stopAnimation(); };
  }, [offset]);

  useEffect(() => {
    completed.current = false;
    setDone(false);
    offset.stopAnimation();
    offset.setValue(0);
  }, [label, resetKey, disabled, offset]);

  const finish = () => {
    if (disabled || completed.current) return;
    completed.current = true;
    setDone(true);
    offset.setValue(travel);
    onComplete();
  };

  const responder = useMemo(() => {
    const returnToStart = () => {
      if (reducedMotion.current) { offset.setValue(0); return; }
      Animated.spring(offset, {
        toValue: 0, useNativeDriver: true, overshootClamping: true,
      }).start();
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !completed.current && travel > 0,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !disabled && !completed.current && travel > 0 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => { offset.stopAnimation(); offset.setValue(0); },
      onPanResponderMove: (_, gesture) => {
        if (!disabled && !completed.current) {
          offset.setValue(Math.max(0, Math.min(travel, gesture.dx)));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (!disabled && travel > 0 && gesture.dx >= travel * 0.85) {
          if (completed.current) return;
          completed.current = true;
          setDone(true);
          offset.setValue(travel);
          onComplete();
        } else returnToStart();
      },
      onPanResponderTerminate: returnToStart,
      onPanResponderTerminationRequest: () => true,
    });
  }, [disabled, offset, onComplete, travel]);

  return (
    <View
      testID="swipe-action"
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || done }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') finish();
      }}
      onAccessibilityTap={finish}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.track,
        {
          backgroundColor: colors.primary,
          minHeight: handleSize + inset * 2,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <Text
        accessible={false}
        style={[
          styles.label,
          { color: colors.onPrimary, paddingHorizontal: handleSize + inset * 2 },
        ]}
      >
        {label}
      </Text>
      <Animated.View
        {...responder.panHandlers}
        testID="swipe-action-handle"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.handle,
          {
            left: inset, width: handleSize, height: handleSize,
            backgroundColor: colors.onPrimary,
            transform: [{ translateX: offset }],
          },
        ]}
      >
        <Ionicons name="chevron-forward-outline" size={wp('5%')} color={colors.primary} />
        <Ionicons name="chevron-forward-outline" size={wp('5%')} color={colors.primary}
          style={styles.secondChevron} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: wp('3%'), justifyContent: 'center', overflow: 'hidden' },
  label: { fontSize: fSize(1.7), textAlign: 'center', paddingVertical: hp('1.5%'), fontWeight: '600' },
  handle: {
    position: 'absolute', borderRadius: wp('2.5%'), alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row',
  },
  secondChevron: { marginLeft: -wp('3%') },
});
