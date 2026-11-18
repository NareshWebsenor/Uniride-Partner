import React, { useState } from "react";
import OnboardingLayout from "@/components/driverOnboarding/OnboardingLayout";
import { TextInput } from "@/components/ui/TextInput";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import type { OnboardingScreenProps } from "@/interface/driverOnboarding.type";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";

export default function EarningLocationScreen({
  navigation,
}: OnboardingScreenProps<"EarningLocationScreen">) {
  const { t } = useAppTranslation();
  const city = useDriverOnboardingStore((state) => state.city);
  const referral = useDriverOnboardingStore((state) => state.referral);
  const setCity = useDriverOnboardingStore((state) => state.setCity);
  const setReferral = useDriverOnboardingStore((state) => state.setReferral);
  const [attempted, setAttempted] = useState(false);
  return (
    <OnboardingLayout
      testID="earning-location-screen"
      title={t("driverOnboarding.cityTitle")}
      description={t("driverOnboarding.cityDescription")}
      onBack={navigation.goBack}
      onContinue={() => {
        setAttempted(true);
        if (city.trim()) navigation.navigate("ChooseVehicleTypeScreen");
      }}
    >
      <TextInput
        testID="earning-city"
        label={t("driverOnboarding.city")}
        placeholder={t("driverOnboarding.cityPlaceholder")}
        value={city}
        onChangeText={setCity}
        maxLength={80}
        autoCapitalize="words"
        error={
          attempted && !city.trim()
            ? t("driverOnboarding.errors.required")
            : undefined
        }
      />
      <TextInput
        testID="referral-code"
        label={t("driverOnboarding.referral")}
        placeholder={t("driverOnboarding.referralPlaceholder")}
        value={referral}
        onChangeText={setReferral}
        maxLength={40}
        autoCapitalize="characters"
        autoCorrect={false}
      />
    </OnboardingLayout>
  );
}
