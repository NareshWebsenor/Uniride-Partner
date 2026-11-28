import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { DemoTrip } from "@/interface/trip.type";
import { hp, wp } from "@/utils/responsive.utils";
import { TripBadge, TripRoute, TripVehicle } from "./TripParts";
import { tripStyles as s } from "./trip.styles";
import { useTripPresentation } from "./useTripPresentation";

export default function TripCard({
  trip,
  onView,
}: {
  trip: DemoTrip;
  onView: () => void;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useTripPresentation(trip);
  const completed = trip.status === "completed";
  const content = (
    <Card style={[s.card, !completed && styles.compactCard]}>
      <View style={s.between}>
        <View style={[s.flex, s.gap]}>
          <Text tone="secondary" style={s.label}>
            {t(
              completed
                ? "trips.earned"
                : copy.incomplete
                ? "trips.request"
                : "trips.scheduledPickup"
            )}
          </Text>
          <Text style={completed ? s.amount : s.time}>
            {completed ? copy.earnings : copy.time}
          </Text>
        </View>
        <TripBadge status={trip.status} />
      </View>
      <View style={s.between}>
        <View style={s.flex}>
          <TripVehicle trip={trip} />
        </View>
        {completed && <Text style={[s.body, s.strong]}>{copy.time}</Text>}
      </View>
      <View style={[s.divider, { borderColor: colors.border }]} />
      {completed && (
        <View style={styles.metrics}>
          {(
            [
              ["duration", copy.duration],
              ["distance", copy.distance],
              ["cashCollected", copy.fare],
            ] as const
          ).map(([key, value], index) => (
            <View
              key={key}
              style={[
                styles.metric,
                index > 0 && styles.metricBorder,
                { borderColor: colors.border },
              ]}
            >
              <Text tone="secondary" style={s.label}>
                {t(`trips.${key}`)}
              </Text>
              <Text style={[s.caption, s.strong]}>{value}</Text>
            </View>
          ))}
        </View>
      )}
      <TripRoute trip={trip} map={completed} />
      {!completed && (
        <>
          <View style={[s.divider, { borderColor: colors.border }]} />
          <View style={s.between}>
            <View style={[s.flex, s.gap]}>
              <Text tone="secondary" style={s.label}>
                {t(copy.incomplete ? "trips.reason" : "trips.estimatedLabel")}
              </Text>
              <Text style={copy.incomplete ? s.caption : s.amount}>
                {copy.incomplete ? copy.reason : copy.earnings}
              </Text>
            </View>
            <Button
              title={t("trips.viewTrip")}
              onPress={onView}
              testID={`view-${trip.id}`}
              style={s.button}
              textStyle={s.buttonText}
            />
          </View>
        </>
      )}
    </Card>
  );
  return completed ? (
    <Pressable
      testID={`view-${trip.id}`}
      onPress={onView}
      accessibilityRole="button"
      accessibilityLabel={t("trips.viewTrip")}
      accessibilityHint={t("trips.tripId", { id: trip.id })}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  compactCard: { gap: hp("1.2%") },
  metrics: { flexDirection: "row", alignItems: "stretch" },
  metric: { flex: 1, gap: hp("0.5%"), paddingHorizontal: wp("1.5%") },
  metricBorder: { borderLeftWidth: StyleSheet.hairlineWidth },
});
