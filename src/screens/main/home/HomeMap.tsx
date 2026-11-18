import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_API_KEY } from '@/service/config';
import { useTheme } from '@/hooks/useTheme';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useDrivingRoute } from '@/hooks/useDrivingRoute';
import { Button, Text } from '@/components/ui';
import { Ionicons } from '@/utils/fontIcon.utils';
import { wp, hp } from '@/utils/responsive.utils';
import { HOME_DRIVER, HOME_MAP_REGION, HOME_PICKUP } from '@/constants/homeMap';
import DemoMap from './DemoMap';

export default function HomeMap({ showRoute }: { showRoute: boolean }) {
  const { colors, resolvedTheme } = useTheme();
  const { t } = useAppTranslation();
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const configured = Platform.OS === 'ios' || Boolean(GOOGLE_API_KEY?.trim());
  const route = useDrivingRoute(HOME_DRIVER, HOME_PICKUP, configured && showRoute);

  useEffect(() => {
    if (!configured || loaded) return;
    const timeout = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(timeout);
  }, [configured, loaded, mapAttempt]);

  useEffect(() => {
    if (!ready) return;
    if (showRoute) {
      map.current?.fitToCoordinates(route.points.length ? route.points : [HOME_DRIVER, HOME_PICKUP], {
        edgePadding: { top: hp('12%'), bottom: hp('6%'), left: wp('15%'), right: wp('15%') },
        animated: true,
      });
    } else {
      map.current?.animateToRegion(HOME_MAP_REGION, 400);
    }
  }, [showRoute, ready, route.points]);

  const demo = !configured;
  const retryMap = () => {
    setReady(false); setLoaded(false); setTimedOut(false);
    setMapAttempt(value => value + 1);
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceRaised }]} testID="home-map">
      {demo ? <DemoMap showRoute={showRoute} /> : (
        <MapView
          key={mapAttempt}
          ref={map}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={HOME_MAP_REGION}
          userInterfaceStyle={resolvedTheme}
          customMapStyle={[
            { elementType: 'geometry', stylers: [{ color: colors.surfaceRaised }] },
            { elementType: 'labels.text.fill', stylers: [{ color: colors.textSecondary }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: colors.surface }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: colors.surface }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: colors.tabActiveBackground }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          ]}
          toolbarEnabled={false}
          showsCompass={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          loadingEnabled
          loadingBackgroundColor={colors.surfaceRaised}
          loadingIndicatorColor={colors.primary}
          onMapReady={() => setReady(true)}
          onMapLoaded={() => { setLoaded(true); setTimedOut(false); }}
        >
          <Marker coordinate={HOME_DRIVER} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.driver, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <Ionicons name="navigate" size={wp('4.5%')} color={colors.primary} />
            </View>
          </Marker>
          {showRoute && (
            <>
              {route.status === 'success' && (
                <Polyline coordinates={route.points} strokeColor={colors.primary} strokeWidth={3} />
              )}
              <Marker coordinate={HOME_PICKUP} pinColor={colors.primary} />
            </>
          )}
        </MapView>
      )}
      {demo && (
        <View pointerEvents="none" style={[styles.demoLabel, { backgroundColor: colors.surface }]}>
          <Text variant="caption" tone="secondary">
            {t('homeRide.demoMap')}
          </Text>
        </View>
      )}
      {!demo && (timedOut || route.status === 'loading' || route.status === 'error') && (
        <View style={[styles.feedback, { backgroundColor: colors.surface }]}>
          <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">
            {t(timedOut ? 'homeRide.mapLoadFailed' : route.status === 'error'
              ? 'homeRide.routeUnavailable' : 'homeRide.routeLoading')}
          </Text>
          {(timedOut || route.status === 'error') && (
            <Button title={t('homeRide.retryMap')} variant="secondary"
              onPress={timedOut ? retryMap : route.retry} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: hp('22%') },
  driver: {
    width: wp('9%'), height: wp('9%'), borderRadius: 999, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  demoLabel: {
    position: 'absolute', bottom: hp('2%'), left: wp('4%'),
    paddingHorizontal: wp('2%'), paddingVertical: hp('0.4%'), borderRadius: wp('2%'),
  },
  feedback: {
    position: 'absolute', bottom: hp('5%'), left: wp('4%'), right: wp('4%'),
    padding: wp('3%'), borderRadius: wp('3%'), gap: hp('0.5%'),
  },
});
