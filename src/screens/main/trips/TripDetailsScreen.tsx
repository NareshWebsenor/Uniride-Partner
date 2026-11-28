import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AppBackground from "@/components/background/AppBackground";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Modal,
  Text,
} from "@/components/ui";
import { SVG } from "@/assets";
import { DEMO_TRIPS } from "@/constants/trips";
import {
  useAppTranslation,
  type TranslationKey,
} from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import type { DemoTrip } from "@/interface/trip.type";
import { hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";
import { TripBadge, TripFare, TripRoute, TripVehicle } from "./TripParts";
import { tripStyles as s } from "./trip.styles";
import { useTripPresentation } from "./useTripPresentation";

type Props = NativeStackScreenProps<TRootStack, "TripDetailsScreen">;
type PreviewAction =
  | "help"
  | "messagePassenger"
  | "callPassenger"
  | "cancelTrip"
  | "navigatePickup"
  | "contactSupport";

export default function TripDetailsScreen({ route, navigation }: Props) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const trip = DEMO_TRIPS.find((item) => item.id === route.params.tripId);
  const [preview, setPreview] = useState<TranslationKey | null>(null);
  const showPreview = (action: PreviewAction) => {
    logger.debug("trips.preview_action", { scope: "trips", code: action });
    setPreview(`trips.${action}`);
  };
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t("ui.back")}
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.transparent }}
          icon={<SVG.TripIcon name="back" />}
        />
        <Text accessibilityRole="header" style={[s.title, s.flex]}>
          {t("trips.details")}
        </Text>
        <Button
          title={t("trips.help")}
          variant="outline"
          onPress={() => showPreview("help")}
          style={{ borderColor: colors.transparent }}
          textStyle={s.buttonText}
        />
      </View>
      {trip ? (
        <TripDetailsContent trip={trip} onAction={showPreview} />
      ) : (
        <EmptyState
          title={t("trips.unavailableTitle")}
          message={t("trips.unavailableBody")}
        />
      )}
      <Modal
        visible={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? t(preview) : t("trips.previewTitle")}
      >
        <Text>{t("trips.previewBody")}</Text>
      </Modal>
    </AppBackground>
  );
}

function TripDetailsContent({
  trip,
  onAction,
}: {
  trip: DemoTrip;
  onAction: (action: PreviewAction) => void;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useTripPresentation(trip);
  const scheduled = trip.status === "scheduled";
  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.surfaceRaised }}
        contentContainerStyle={styles.content}
        testID={`trip-details-${trip.status}`}
        showsVerticalScrollIndicator={false}
      >
        <Card style={s.card}>
          <View style={s.between}>
            <Text tone="secondary" style={[s.label, s.flex]}>
              {copy.incomplete
                ? t("trips.request")
                : t("trips.tripId", { id: trip.id })}
            </Text>
            <TripBadge status={trip.status} />
          </View>
          <View style={s.gap}>
            <Text tone="secondary" style={s.body}>
              {t("trips.demoFullDate")}
            </Text>
            <Text style={s.amount}>{copy.time}</Text>
          </View>
          <TripVehicle trip={trip} detail />
        </Card>
        {copy.incomplete && (
          <Card style={s.card}>
            <Text style={s.title}>
              {t(
                trip.status === "missed"
                  ? "trips.missedDetails"
                  : "trips.cancellationDetails"
              )}
            </Text>
            <View
              style={[styles.reason, { backgroundColor: colors.errorSurface }]}
            >
              <Text style={[s.label, { color: colors.error }]}>
                {t("trips.reason")}
              </Text>
              <Text style={[s.body, s.strong]}>{copy.reason}</Text>
            </View>
            <Text style={s.body}>
              {t(
                trip.status === "missed"
                  ? "trips.missedNote"
                  : "trips.cancelledNote"
              )}
            </Text>
          </Card>
        )}
        <Card style={s.card}>
          <View style={s.between}>
            <Text style={[s.title, s.flex]}>
              {t(copy.incomplete ? "trips.plannedRoute" : "trips.route")}
            </Text>
            <Text tone="secondary" style={s.caption}>
              {copy.incomplete
                ? t("trips.notTravelled")
                : t("trips.routeSummary", {
                    distance: copy.distance,
                    minutes: Math.round(trip.durationSeconds / 60),
                  })}
            </Text>
          </View>
          <TripRoute trip={trip} map detail />
        </Card>
        {scheduled && (
          <Card style={s.card}>
            <View style={s.between}>
              <View style={[s.flex, s.gap]}>
                <Text tone="secondary" style={s.label}>
                  {t("trips.passenger")}
                </Text>
                <Text style={[s.body, s.strong]}>
                  {t("trips.demoPassenger")}
                </Text>
              </View>
              <View style={s.row}>
                {(["message", "phone"] as const).map((name) => {
                  const action =
                    name === "message" ? "messagePassenger" : "callPassenger";
                  return (
                    <IconButton
                      key={name}
                      testID={`trip-${action}`}
                      accessibilityLabel={t(`trips.${action}`)}
                      onPress={() => onAction(action)}
                      style={[
                        styles.contact,
                        { backgroundColor: colors.tabActiveBackground },
                      ]}
                      icon={<SVG.TripIcon name={name} color={colors.primary} />}
                    />
                  );
                })}
              </View>
            </View>
            <Text tone="secondary" style={s.caption}>
              {t("trips.passengerHint")}
            </Text>
          </Card>
        )}
        <TripFare trip={trip} />
        {scheduled && (
          <Button
            title={t("trips.cancelTrip")}
            testID="trip-cancel"
            onPress={() => onAction("cancelTrip")}
            style={{ backgroundColor: colors.error }}
            textStyle={s.buttonText}
          />
        )}
      </ScrollView>
      {(scheduled || copy.incomplete) && (
        <View style={styles.footer}>
          <Button
            testID="trip-primary-action"
            title={t(
              scheduled ? "trips.navigatePickup" : "trips.contactSupport"
            )}
            onPress={() =>
              onAction(scheduled ? "navigatePickup" : "contactSupport")
            }
            textStyle={s.buttonText}
            icon={
              scheduled ? (
                <SVG.TripIcon name="navigate" color={colors.onPrimary} />
              ) : undefined
            }
          />
          <Text tone="secondary" style={[s.caption, styles.center]}>
            {t(scheduled ? "trips.navigateHint" : "trips.supportHint")}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("1%"),
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.5%"),
  },
  content: {
    padding: wp("4.5%"),
    gap: hp("1.8%"),
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  reason: { padding: wp("3%"), gap: hp("0.6%"), borderRadius: wp("2.5%") },
  contact: { borderRadius: 999 },
  footer: {
    paddingHorizontal: wp("4.5%"),
    paddingVertical: hp("1.5%"),
    gap: hp("1%"),
  },
  center: { textAlign: "center" },
});
