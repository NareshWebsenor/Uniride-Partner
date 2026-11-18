import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useThemeColor } from '@/hooks/useThemeColor';
import { fSize, wp } from '@/utils/responsive.utils';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const circumference = 2 * Math.PI * 29;

export interface RideRequestCountdownProps {
  expiresAt: number;
  durationMs: number;
  onExpire: () => void;
  accessibilityLabel: string;
}

/** A deadline, not a decrementing counter, keeps background/resume accurate. */
export default function RideRequestCountdown({
  expiresAt,
  durationMs,
  onExpire,
  accessibilityLabel,
}: RideRequestCountdownProps) {
  const colors = useThemeColor();
  const duration = Math.max(1, durationMs);
  const remaining = () => Math.max(0, Math.min(duration, expiresAt - Date.now()));
  const [seconds, setSeconds] = useState(() => Math.ceil(remaining() / 1000));
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [reduceMotion, setReduceMotion] = useState(true);
  const progress = useRef(new Animated.Value(remaining() / duration)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const expireCallback = useRef(onExpire);
  const expiredDeadline = useRef<number | undefined>(undefined);

  useEffect(() => {
    expireCallback.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    }).catch(() => {
      // Keep static feedback when the system setting cannot be read.
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged', setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let expired = expiredDeadline.current === expiresAt;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const tick = () => {
      const left = Math.max(0, Math.min(duration, expiresAt - Date.now()));
      setSeconds(Math.ceil(left / 1000));
      if (left === 0 && !expired) {
        expired = true;
        expiredDeadline.current = expiresAt;
        stop();
        expireCallback.current();
      }
    };
    const start = () => {
      stop();
      tick();
      if (!expired) timer = setInterval(tick, 100);
    };
    start();
    const subscription = AppState.addEventListener('change', (state) => {
      const foreground = state === 'active';
      setActive(foreground);
      if (foreground) start();
      else stop();
    });
    return () => {
      stop();
      subscription.remove();
    };
  }, [duration, expiresAt]);

  useEffect(() => {
    progress.stopAnimation();
    rotation.stopAnimation();
    const left = Math.max(0, Math.min(duration, expiresAt - Date.now()));
    progress.setValue(left / duration);
    rotation.setValue(0);
    if (reduceMotion || !active || left === 0) return;
    const countdown = Animated.timing(progress, {
      toValue: 0, duration: left, easing: Easing.linear, useNativeDriver: false,
    });
    const spin = Animated.loop(Animated.timing(rotation, {
      toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true,
      isInteraction: false,
    }));
    countdown.start();
    spin.start();
    return () => {
      countdown.stop();
      spin.stop();
    };
  }, [active, duration, expiresAt, progress, reduceMotion, rotation]);

  useEffect(() => {
    opacity.stopAnimation();
    opacity.setValue(1);
    if (reduceMotion) {
      progress.setValue(Math.max(0, Math.min(duration, expiresAt - Date.now())) / duration);
      return;
    }
    if (!active || seconds === 0) return;
    const blink = Animated.sequence([
      Animated.timing(opacity, { toValue: 0.35, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]);
    blink.start();
    return () => blink.stop();
  }, [active, duration, expiresAt, opacity, progress, reduceMotion, seconds]);

  return (
    <View
      testID="ride-request-countdown"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: Math.ceil(duration / 1000), now: seconds }}
      style={styles.container}
    >
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, {
          transform: [{ rotate: rotation.interpolate({
            inputRange: [0, 1], outputRange: ['-90deg', '270deg'],
          }) }],
        }]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={29} fill={colors.transparent}
            stroke={colors.error} strokeOpacity={0.15} strokeWidth={3.5} />
          <AnimatedCircle cx={32} cy={32} r={29} fill={colors.transparent}
            stroke={colors.error} strokeWidth={3.5} strokeLinecap="round"
            strokeDasharray={[circumference, circumference]}
            strokeDashoffset={progress.interpolate({
              inputRange: [0, 1], outputRange: [circumference, 0],
            })} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ opacity }} importantForAccessibility="no-hide-descendants">
        <Text accessible={false} style={styles.number}>{seconds}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: wp('16%'), height: wp('16%'), flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  number: { fontSize: fSize(2.5), fontWeight: '700', fontVariant: ['tabular-nums'] },
});
