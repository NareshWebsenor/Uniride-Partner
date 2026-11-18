import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, SearchInput, Text } from "@/components/ui";
import {
  useAppTranslation,
  type TranslationKey,
} from "@/hooks/useAppTranslation";
import { hp, wp } from "@/utils/responsive.utils";
import MenuDetailLayout, { DetailIntro } from "./MenuDetailLayout";
import { MenuRow, MenuSection, type MenuIcon } from "./MenuSection";

const topics: {
  id: "trips" | "earnings" | "account" | "documents";
  icon: MenuIcon;
}[] = [
  { id: "trips", icon: "car-outline" },
  { id: "earnings", icon: "wallet-outline" },
  { id: "account", icon: "shield-checkmark-outline" },
  { id: "documents", icon: "document-text-outline" },
];
const questions = ["trip", "payout", "documents"] as const;

export default function HelpSupportScreen() {
  const { t } = useAppTranslation();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{
    title: TranslationKey;
    message: TranslationKey;
  } | null>(null);
  const matches = (value: string) =>
    value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const visibleTopics = topics.filter(({ id }) =>
    matches(
      `${t(`menuHelp.topics.${id}.title`)} ${t(
        `menuHelp.topics.${id}.description`
      )}`
    )
  );
  const visibleQuestions = questions.filter((id) =>
    matches(t(`menuHelp.faq.${id}.question`))
  );
  const pending = (title: TranslationKey) =>
    setDialog({ title, message: "menu.comingSoon" });
  return (
    <>
      <MenuDetailLayout title={t("menu.help")} testID="help-support-screen">
        <DetailIntro
          title={t("menuHelp.title")}
          description={t("menuHelp.description")}
        />
        <SearchInput
          accessibilityLabel={t("menuHelp.search")}
          placeholder={t("menuHelp.search")}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          fieldStyle={styles.search}
        />
        {visibleTopics.length ? (
          <MenuSection title={t("menuHelp.browse")}>
            {visibleTopics.map(({ id, icon }, index) => (
              <MenuRow
                key={id}
                icon={icon}
                title={t(`menuHelp.topics.${id}.title`)}
                subtitle={t(`menuHelp.topics.${id}.description`)}
                onPress={() => pending(`menuHelp.topics.${id}.title`)}
                last={index === visibleTopics.length - 1}
              />
            ))}
          </MenuSection>
        ) : null}
        {visibleQuestions.length ? (
          <MenuSection title={t("menuHelp.commonQuestions")}>
            {visibleQuestions.map((id, index) => (
              <MenuRow
                key={id}
                icon="help-circle-outline"
                title={t(`menuHelp.faq.${id}.question`)}
                last={index === visibleQuestions.length - 1}
                onPress={() =>
                  setDialog({
                    title: `menuHelp.faq.${id}.question`,
                    message: `menuHelp.faq.${id}.answer`,
                  })
                }
              />
            ))}
          </MenuSection>
        ) : null}
        {!visibleTopics.length && !visibleQuestions.length ? (
          <Text tone="secondary" accessibilityLiveRegion="polite">
            {t("menuHelp.noResults")}
          </Text>
        ) : null}
        <View style={styles.support}>
          <MenuSection title={t("menuHelp.moreHelp")}>
            <MenuRow
              icon="headset-outline"
              title={t("menuHelp.contact")}
              subtitle={t("menuHelp.contactDescription")}
              onPress={() => pending("menuHelp.contact")}
            />
            <MenuRow
              icon="document-text-outline"
              title={t("menuHelp.requests")}
              subtitle={t("menuHelp.requestsDescription")}
              onPress={() => pending("menuHelp.requests")}
              last
            />
          </MenuSection>
        </View>
      </MenuDetailLayout>
      <Modal
        visible={dialog !== null}
        title={dialog ? t(dialog.title) : undefined}
        onClose={() => setDialog(null)}
      >
        <Text>{dialog ? t(dialog.message) : ""}</Text>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  search: { borderWidth: 0, borderRadius: wp("3%") },
  support: { marginTop: hp("0.5%") },
});
