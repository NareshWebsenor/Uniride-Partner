import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import AppBackground from "@/components/background/AppBackground";
import { useNavigation } from "@react-navigation/native";
import {
  Alert,
  Button,
  Card,
  Header,
  Heading,
  RadioButton,
  Container,
  Text,
} from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTextSizeStore } from "@/store/textSizeStore";
import { TEXT_SIZE_OPTIONS, TEXT_SIZE_SCALES } from "@/interface/textSize.type";
import { hp, wp } from "@/utils/responsive.utils";

export default function TextSizeScreen() {
  const { t } = useAppTranslation();
  const navigation = useNavigation();
  const colors = useThemeColor();
  const size = useTextSizeStore((state) => state.size);
  const setSize = useTextSizeStore((state) => state.setSize);
  const saving = useTextSizeStore((state) => state.saving);
  const error = useTextSizeStore((state) => state.persistenceError);

  return (
    <AppBackground>
      <View style={styles.header}>
        <Header
          title={t("textSize.title")}
          onBack={() => navigation.goBack()}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Container>
          <Text tone="secondary">{t("textSize.description")}</Text>
          <Card testID="text-size-preview">
            <Text variant="caption" tone="secondary">
              {t("textSize.preview")}
            </Text>
            <Heading level={3}>{t("textSize.sampleTitle")}</Heading>
            <Text>{t("textSize.sampleBody")}</Text>
            <View
              style={[
                styles.message,
                { backgroundColor: colors.surfaceRaised },
              ]}
            >
              <Text>{t("textSize.sampleMessage")}</Text>
            </View>
          </Card>
          <Card>
            <Heading level={3}>{t("textSize.chooseSize")}</Heading>
            {TEXT_SIZE_OPTIONS.map((option) => (
              <RadioButton
                key={option}
                label={t("textSize.option", {
                  size: t(`textSize.${option}`),
                  percent: Math.round(TEXT_SIZE_SCALES[option] * 100),
                })}
                value={size === option}
                onValueChange={() => {
                  void setSize(option);
                }}
              />
            ))}
          </Card>
          {error ? (
            <>
              <Alert tone="error" message={t("textSize.saveError")} />
              <Button
                title={t("ui.retry")}
                onPress={() => {
                  void setSize(size);
                }}
                loading={saving}
              />
            </>
          ) : (
            <Text
              tone="secondary"
              variant="caption"
              accessibilityLiveRegion="polite"
            >
              {t(saving ? "textSize.saving" : "textSize.saved")}
            </Text>
          )}
          <Button
            title={t("textSize.reset")}
            variant="outline"
            disabled={size === "default" && !error}
            onPress={() => {
              void setSize("default");
            }}
          />
        </Container>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: wp("4%"),
  },
  message: {
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1.5%"),
    borderRadius: wp("3%"),
  },
});
