import React from "react";
import { Heading, ScreenWrapper } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";

export default function TripsScreen() {
  const { t } = useAppTranslation();
  return (
    <ScreenWrapper>
      <Heading>{t("tabs.trips")}</Heading>
    </ScreenWrapper>
  );
}
