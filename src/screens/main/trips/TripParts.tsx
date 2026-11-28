import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "@/components/ui";
import { SVG } from "@/assets";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { DemoTrip, TripStatus } from "@/interface/trip.type";
import { hp, wp } from "@/utils/responsive.utils";
import { tripStyles as s } from "./trip.styles";
import { useTripPresentation } from "./useTripPresentation";

export function TripBadge({ status }: { status: TripStatus }) {
  const colors = useThemeColor();
  const { t } = useAppTranslation();
  const color =
    status === "completed"
      ? colors.success
      : status === "scheduled"
      ? colors.primary
      : colors.error;
  const backgroundColor =
    status === "completed"
      ? colors.successSurface
      : status === "scheduled"
      ? colors.tabActiveBackground
      : colors.errorSurface;
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      {status === "completed" && (
        <SVG.TripIcon
          name="check"
          color={color}
          width={wp("3.5%")}
          height={wp("3.5%")}
        />
      )}
      <Text style={[s.caption, s.strong, { color }]}>
        {t(`trips.${status}`)}
      </Text>
    </View>
  );
}

export function TripVehicle({
  trip,
  detail = false,
}: {
  trip: DemoTrip;
  detail?: boolean;
}) {
  const { t } = useAppTranslation();
  const { incomplete } = useTripPresentation(trip);
  return (
    <View style={s.row}>
      <SVG.TripIcon name="car" width={wp("4%")} height={wp("4%")} />
      <Text tone="secondary" style={[s.caption, s.flex]}>
        {incomplete
          ? t("trips.carNoEarnings")
          : detail && trip.status === "scheduled"
          ? t("trips.carScheduled")
          : t("trips.carCommission", { percent: trip.commissionPercent })}
      </Text>
    </View>
  );
}

export function TripRoute({
  trip,
  map = false,
  detail = false,
}: {
  trip: DemoTrip;
  map?: boolean;
  detail?: boolean;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useTripPresentation(trip);
  return (
    <View style={styles.route}>
      {map && (
        <View style={styles.map}>
          <SVG.TripRouteMap />
        </View>
      )}
      <View style={[styles.addresses, !map && !detail && styles.compactAddresses]}>
        <View
          pointerEvents="none"
          style={[styles.connector, { borderColor: colors.border }]}
        />
        {(
          [
            {
              key: "pickup",
              title: copy.pickup,
              region: copy.pickupRegion,
              color: colors.success,
            },
            {
              key: "dropoff",
              title: copy.dropoff,
              region: copy.dropoffRegion,
              color: colors.error,
            },
          ] as const
        ).map((item, index) => (
          <View key={item.key} style={styles.address}>
            <View style={[styles.marker, { backgroundColor: colors.surface }]}>
              <SVG.TripIcon
                name="location"
                color={item.color}
                width={wp("4%")}
                height={wp("4%")}
              />
            </View>
            <View
              style={[
                s.flex,
                s.gap,
                index === 0 && (map || detail) && styles.addressBorder,
                { borderColor: colors.border },
              ]}
            >
              <Text tone="secondary" style={s.label}>
                {t(`trips.${item.key}`)}
              </Text>
              <Text style={[s.body, detail && s.strong]}>{item.title}</Text>
              {(map || detail) && (
                <Text tone="secondary" style={s.caption}>
                  {item.region}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function TripFare({ trip }: { trip: DemoTrip }) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useTripPresentation(trip);
  return (
    <Card style={s.card}>
      <View style={s.between}>
        <Text style={[s.title, s.flex]}>
          {t(copy.incomplete ? "trips.earningsSummary" : "trips.fareDetails")}
        </Text>
        <Text style={[s.caption, { color: colors.primary }]}>
          {t(copy.incomplete ? "trips.noEarnings" : "trips.cashPayment")}
        </Text>
      </View>
      {!copy.incomplete && (
        <>
          <View style={s.between}>
            <Text tone="secondary" style={s.body}>
              {t("trips.totalFare")}
            </Text>
            <Text style={s.body}>{copy.fare}</Text>
          </View>
          <View style={s.between}>
            <Text tone="secondary" style={[s.body, s.flex]}>
              {t("trips.commission", { percent: trip.commissionPercent })}
            </Text>
            <Text style={s.body}>{copy.commission}</Text>
          </View>
          <View style={[s.divider, { borderColor: colors.border }]} />
        </>
      )}
      <View style={s.between}>
        <Text style={[s.body, s.strong, s.flex]}>
          {t(
            trip.status === "scheduled"
              ? "trips.estimatedEarnings"
              : "trips.finalEarnings"
          )}
        </Text>
        <Text style={s.amount}>{copy.earnings}</Text>
      </View>
      {copy.incomplete ? (
        <Text tone="secondary" style={s.caption}>
          {t("trips.noEarningsNote", { status: t(`trips.${trip.status}`) })}
        </Text>
      ) : (
        trip.status === "scheduled" && (
          <Text tone="secondary" style={s.caption}>
            {t("trips.estimateNote")}
          </Text>
        )
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("1%"),
    borderRadius: 999,
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("0.65%"),
    flexShrink: 1,
  },
  route: { gap: hp("1.5%") },
  map: { overflow: "hidden", borderRadius: wp("2.5%") },
  addresses: { gap: hp("1.3%") },
  compactAddresses: { gap: hp("0.8%") },
  address: { flexDirection: "row", alignItems: "flex-start", gap: wp("2.5%") },
  marker: { paddingVertical: hp("0.2%") },
  addressBorder: {
    paddingBottom: hp("1.4%"),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  connector: {
    position: "absolute",
    top: wp("3%"),
    bottom: wp("3%"),
    left: wp("2%"),
    borderLeftWidth: 1,
    borderStyle: "dashed",
  },
});
