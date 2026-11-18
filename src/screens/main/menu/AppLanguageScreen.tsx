import React, { useState } from "react";
import { Alert, Button, Text } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { supportedLanguages } from "@/localizations";
import { useLanguageStore } from "@/store/languageStore";
import MenuDetailLayout, {
  ChoiceRow,
  DetailCard,
  DetailIntro,
} from "./MenuDetailLayout";

export default function AppLanguageScreen() {
  const { t } = useAppTranslation();
  const { language, changeLanguage, error } = useLanguage();
  const [selected, setSelected] = useState(language);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await changeLanguage(selected);
      setSaved(useLanguageStore.getState().error === null);
    } finally {
      setSaving(false);
    }
  };
  return (
    <MenuDetailLayout
      title={t("menu.appLanguage")}
      testID="app-language-screen"
      footer={
        <>
          {error ? <Alert tone="error" message={t(error)} /> : null}
          {saved ? (
            <Text tone="success" accessibilityLiveRegion="polite">
              {t("menuDetails.saved")}
            </Text>
          ) : null}
          <Button
            title={t("menuDetails.saveLanguage")}
            loading={saving}
            onPress={() => {
              void save();
            }}
          />
        </>
      }
    >
      <DetailIntro
        title={t("menuDetails.chooseLanguage")}
        description={t("menuDetails.languageDescription")}
      />
      <DetailCard>
        {supportedLanguages.map((value, index) => (
          <ChoiceRow
            key={value}
            title={t(`language.${value}`)}
            subtitle={
              language === value
                ? t("menuDetails.currentLanguage")
                : t(`menuDetails.languageNames.${value}`)
            }
            selected={selected === value}
            disabled={saving}
            last={index === supportedLanguages.length - 1}
            onPress={() => {
              setSelected(value);
              setSaved(false);
            }}
          />
        ))}
      </DetailCard>
      <Text tone="secondary" variant="caption">
        {t("menuDetails.languageNote")}
      </Text>
    </MenuDetailLayout>
  );
}
