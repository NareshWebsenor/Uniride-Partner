import React from "react";
import OnboardingLayout from "@/components/driverOnboarding/OnboardingLayout";
import OnboardingChoiceCard from "@/components/driverOnboarding/OnboardingChoiceCard";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import type { OnboardingScreenProps } from "@/interface/driverOnboarding.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";

export default function ChooseVehicleTypeScreen({
  navigation,
}: OnboardingScreenProps<"ChooseVehicleTypeScreen">) {
  const { t } = useAppTranslation();
  const vehicleType = useDriverOnboardingStore((state) => state.vehicleType);
  const setVehicleType = useDriverOnboardingStore(
    (state) => state.setVehicleType
  );
  return (
    <OnboardingLayout
      testID="choose-vehicle-type-screen"
      title={t("driverOnboarding.vehicleTypeTitle")}
      onBack={navigation.goBack}
      disabled={!vehicleType}
      onContinue={() => {
        if (vehicleType)
          navigation.navigate("ProfileScreen", { stage: "driver" });
      }}
    >
      <OnboardingChoiceCard
        testID="vehicle-car"
        title={t("driverOnboarding.car")}
        description={t("driverOnboarding.carDescription")}
        badges={[t("driverOnboarding.rides"), t("driverOnboarding.fleetBadge")]}
        variant="car"
        image={require("@/assets/images/onboarding/commercial-car.png")}
        selected={vehicleType === "car"}
        onPress={() => setVehicleType("car")}
      />
      <OnboardingChoiceCard
        testID="vehicle-bike"
        title={t("driverOnboarding.bike")}
        description={t("driverOnboarding.bikeDescription")}
        badges={[t("driverOnboarding.rides")]}
        variant="bike"
        image={require("@/assets/images/onboarding/scooter.png")}
        selected={vehicleType === "bike"}
        onPress={() => setVehicleType("bike")}
      />
    </OnboardingLayout>
  );
}
