import React from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import AppBackground from "@/components/background/AppBackground";
import { Button, IconButton } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Text";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { OnboardingLayoutProps } from "@/interface/driverOnboarding.type";
import type { themeType } from "@/interface/theme.type";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export default function OnboardingLayout({
  title,
  description,
  children,
  onBack,
  onContinue,
  continueLabel,
  disabled,
  testID,
}: OnboardingLayoutProps) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const styles = useThemedStyles(createStyle);
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View style={styles.container} testID={testID}>
        <KeyboardAvoidingView
          behavior="padding"
          automaticOffset
          style={styles.flex}
        >
          <View style={styles.header}>
            <IconButton
              testID="onboarding-back"
              accessibilityLabel={t("ui.back")}
              onPress={onBack}
              style={styles.back}
              icon={
                <Ionicons
                  name="arrow-back"
                  size={wp("5.5%")}
                  color={colors.textPrimary}
                />
              }
            />
            <Button
              title={t("driverOnboarding.help")}
              variant="outline"
              style={styles.help}
              textStyle={styles.helpText}
              onPress={() =>
                Alert.alert(
                  t("driverOnboarding.help"),
                  t("driverOnboarding.helpMessage")
                )
              }
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.heading}>
              <Heading level={3} style={styles.title}>
                {title}
              </Heading>
              {description ? (
                <Text tone="secondary" style={styles.description}>
                  {description}
                </Text>
              ) : null}
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.footer}>
          <Button
            testID="onboarding-continue"
            title={continueLabel ?? t("driverOnboarding.continue")}
            disabled={disabled}
            onPress={onContinue}
            style={styles.continue}
            textStyle={styles.continueText}
          />
        </View>
      </View>
    </AppBackground>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: wp("2%"),
      paddingTop: hp("0.5%"),
    },
    back: { backgroundColor: theme.transparent },
    help: { borderWidth: 0, paddingHorizontal: wp("3%") },
    helpText: { fontSize: fSize(1.6) },
    content: {
      flexGrow: 1,
      paddingHorizontal: wp("5%"),
      paddingTop: hp("2%"),
      paddingBottom: hp("2%"),
      gap: hp("2.4%"),
    },
    heading: { gap: hp("1%") },
    title: { fontSize: fSize(2.4) },
    description: { fontSize: fSize(1.7), lineHeight: fSize(2.5) },
    footer: {
      paddingHorizontal: wp("5%"),
      paddingTop: hp("1%"),
      paddingBottom: hp("2%"),
    },
    continue: { borderRadius: wp("5%"), minHeight: Math.max(48, hp("6.2%")) },
    continueText: { fontSize: fSize(1.65) },
  });
