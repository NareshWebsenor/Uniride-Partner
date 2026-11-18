import React from "react";
import OnboardingLayout from "@/components/driverOnboarding/OnboardingLayout";
import OnboardingChoiceCard from "@/components/driverOnboarding/OnboardingChoiceCard";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import type { OnboardingScreenProps } from "@/interface/driverOnboarding.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";

export default function DrivingPreferenceScreen({
  navigation,
}: OnboardingScreenProps<"DrivingPreferenceScreen">) {
  const { t } = useAppTranslation();
  const preference = useDriverOnboardingStore((state) => state.preference);
  const setPreference = useDriverOnboardingStore(
    (state) => state.setPreference
  );
  return (
    <OnboardingLayout
      testID="driving-preference-screen"
      title={t("driverOnboarding.driveTitle")}
      onBack={() =>
        navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] })
      }
      disabled={!preference}
      onContinue={() => {
        if (preference === "fleet")
          navigation.navigate("ProfileScreen", { stage: "driver" });
        else if (preference === "own")
          navigation.navigate("EarningLocationScreen");
      }}
    >
      <OnboardingChoiceCard
        testID="preference-fleet"
        title={t("driverOnboarding.fleetTitle")}
        description={t("driverOnboarding.fleetDescription")}
        badges={[t("driverOnboarding.fleetPartnerBadge")]}
        image={require("@/assets/images/onboarding/rider.png")}
        selected={preference === "fleet"}
        onPress={() => setPreference("fleet")}
      />
      <OnboardingChoiceCard
        testID="preference-own"
        title={t("driverOnboarding.ownTitle")}
        description={t("driverOnboarding.ownDriveDescription")}
        badges={[t("driverOnboarding.ownBadge")]}
        image={require("@/assets/images/onboarding/driver.png")}
        selected={preference === "own"}
        onPress={() => setPreference("own")}
      />
    </OnboardingLayout>
  );
}
