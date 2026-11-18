import React, { useState } from "react";
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
import { fSize, hp, wp } from "@/utils/responsive.utils";

export default function TextSizeScreen() {
  const { t } = useAppTranslation();
  const navigation = useNavigation();
  const colors = useThemeColor();
  const size = useTextSizeStore((state) => state.size);
  const setSize = useTextSizeStore((state) => state.setSize);
  const saving = useTextSizeStore((state) => state.saving);
  const error = useTextSizeStore((state) => state.persistenceError);
  const [selected, setSelected] = useState(size);
  const hasDraft = selected !== size;
  const needsApply = hasDraft || error;

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
              <Text
                testID="text-size-sample-message"
                style={{
                  // Shared Text applies the current app scale once. Compensate
                  // here so only this sentence previews the absolute draft size.
                  fontSize:
                    (fSize(2) * TEXT_SIZE_SCALES[selected]) /
                    TEXT_SIZE_SCALES[size],
                }}
              >
                {t("textSize.sampleMessage")}
              </Text>
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
                value={selected === option}
                disabled={saving}
                onValueChange={() => {
                  setSelected(option);
                }}
              />
            ))}
          </Card>
          {error ? (
            <Alert tone="error" message={t("textSize.saveError")} />
          ) : (
            <Text
              tone="secondary"
              variant="caption"
              accessibilityLiveRegion="polite"
            >
              {t(
                saving
                  ? "textSize.saving"
                  : hasDraft
                  ? "textSize.pending"
                  : "textSize.saved"
              )}
            </Text>
          )}
          <Button
            title={t(needsApply ? "textSize.apply" : "textSize.reset")}
            variant={needsApply ? "primary" : "outline"}
            loading={saving}
            disabled={!needsApply && size === "default"}
            onPress={() => {
              if (needsApply) {
                void setSize(selected);
              } else {
                setSelected("default");
                void setSize("default");
              }
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
