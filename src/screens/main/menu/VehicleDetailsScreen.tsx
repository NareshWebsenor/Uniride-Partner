import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Modal, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { hasMenuVehicle } from "@/utils/menuDocuments";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import MenuDetailLayout, { DetailCard } from "./MenuDetailLayout";
import DocumentCard from "./DocumentCard";

export default function VehicleDetailsScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation();
  const vehicle = useDriverOnboardingStore((state) => state.vehicle);
  const vehicleType = useDriverOnboardingStore((state) => state.vehicleType);
  const documents = useDriverOnboardingStore((state) => state.documents);
  const available = hasMenuVehicle(vehicle);

  return (
    <MenuDetailLayout title={t("menu.vehicle")} testID="vehicle-details-screen">
      {available ? (
        <>
          <DetailCard>
            <View style={styles.identity}>
              <View
                style={[styles.icon, { backgroundColor: colors.surfaceRaised }]}
              >
                <Ionicons
                  name={
                    vehicleType === "bike" ? "bicycle-outline" : "car-outline"
                  }
                  size={wp("5.5%")}
                  color={colors.textPrimary}
                />
              </View>
              <View style={styles.copy}>
                <Text
                  style={styles.vehicleName}
                >{`${vehicle.make} ${vehicle.model}`}</Text>
                {documents.rc.number ? (
                  <Text style={styles.value}>{documents.rc.number}</Text>
                ) : null}
                <Text style={[styles.caption, { color: colors.primary }]}>
                  {t("menuDocuments.yourVehicle")}
                </Text>
              </View>
            </View>
          </DetailCard>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {t("menuDocuments.vehicleInformation")}
            </Text>
            <DetailCard>
              <View style={styles.grid}>
                {(["make", "model", "variant", "year"] as const).map((key) => (
                  <View key={key} style={styles.field}>
                    <Text tone="secondary" style={styles.caption}>
                      {t(`menuDocuments.${key}`)}
                    </Text>
                    <Text style={styles.value}>
                      {vehicle[key] || t("menuDocuments.notProvided")}
                    </Text>
                  </View>
                ))}
                <View style={styles.field}>
                  <Text tone="secondary" style={styles.caption}>
                    {t("menuDocuments.vehicleType")}
                  </Text>
                  <Text style={styles.value}>
                    {vehicleType
                      ? t(`menuDocuments.${vehicleType}`)
                      : t("menuDocuments.notProvided")}
                  </Text>
                </View>
              </View>
            </DetailCard>
          </View>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {t("menuDocuments.vehicleDocuments")}
            </Text>
            {(["rc", "insurance", "pollution"] as const).map((kind) => (
              <DocumentCard key={kind} kind={kind} document={documents[kind]} />
            ))}
          </View>
          <Text tone="secondary" style={styles.note}>
            {t("driverOnboarding.upload.limit")}
          </Text>
        </>
      ) : (
        <Modal
          visible
          onClose={() => navigation.goBack()}
          title={t("menu.vehicle")}
        >
          <Text>{t("menuDocuments.addVehicleFirst")}</Text>
        </Modal>
      )}
    </MenuDetailLayout>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: wp("3%"),
    paddingVertical: hp("1%"),
  },
  icon: { padding: wp("2.5%"), borderRadius: wp("2%") },
  copy: { flex: 1, gap: hp("0.7%") },
  vehicleName: { fontSize: fSize(1.9), fontWeight: "600" },
  value: { fontSize: fSize(1.6) },
  caption: { fontSize: fSize(1.3) },
  section: { gap: hp("1.2%") },
  sectionTitle: { fontSize: fSize(1.7), fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp("4%"),
    paddingVertical: hp("0.5%"),
  },
  field: { width: "46%", gap: hp("0.4%") },
  note: { textAlign: "center", fontSize: fSize(1.3) },
});
