import React from "react";
import { Heading, ScreenWrapper } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";

export default function EarningsScreen() {
  const { t } = useAppTranslation();
  return (
    <ScreenWrapper>
      <Heading>{t("tabs.earnings")}</Heading>
    </ScreenWrapper>
  );
}
