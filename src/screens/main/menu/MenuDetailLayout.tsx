import React, { type PropsWithChildren, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppBackground from "@/components/background/AppBackground";
import { IconButton, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@/utils/fontIcon.utils";
import { fSize, hp, wp } from "@/utils/responsive.utils";

export default function MenuDetailLayout({
  title,
  children,
  footer,
  testID,
}: PropsWithChildren<{
  title: string;
  footer?: ReactNode;
  testID: string;
}>) {
  const colors = useThemeColor();
  const navigation = useNavigation();
  const { t } = useAppTranslation();
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel={t("ui.back")}
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.transparent }}
          icon={
            <Ionicons
              name="arrow-back"
              size={wp("5.5%")}
              color={colors.textPrimary}
            />
          }
        />
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <View
        testID={testID}
        style={[styles.body, { backgroundColor: colors.surfaceRaised }]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </AppBackground>
  );
}

export function DetailCard({ children }: PropsWithChildren) {
  const colors = useThemeColor();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {children}
    </View>
  );
}

export function DetailIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.intro}>
      <Text accessibilityRole="header" style={styles.introTitle}>
        {title}
      </Text>
      <Text tone="secondary" style={styles.description}>
        {description}
      </Text>
    </View>
  );
}

export function ChoiceRow({
  title,
  subtitle,
  selected,
  onPress,
  disabled,
  last = false,
  accessory,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  last?: boolean;
  accessory?: ReactNode;
}) {
  const colors = useThemeColor();
  return (
    <View
      style={[
        styles.choice,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel={title}
        accessibilityState={{ checked: selected, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.choiceButton,
          { opacity: pressed || disabled ? 0.5 : 1 },
        ]}
      >
        <View style={styles.copy}>
          <Text style={styles.choiceTitle}>{title}</Text>
          {subtitle ? (
            <Text tone="secondary" style={styles.description}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={selected ? "radio-button-on" : "radio-button-off"}
          size={wp("5.5%")}
          color={selected ? colors.primary : colors.textSecondary}
        />
      </Pressable>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.5%"),
    gap: wp("1%"),
  },
  title: {
    flex: 1,
    fontSize: fSize(2.1),
    fontWeight: "700",
    paddingRight: wp("4%"),
  },
  body: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: wp("5%"),
    paddingBottom: hp("3%"),
    gap: hp("2.5%"),
  },
  footer: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("2%"),
    gap: hp("1%"),
  },
  card: {
    borderRadius: wp("3.8%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1%"),
    gap: hp("1%"),
  },
  intro: { gap: hp("1%") },
  introTitle: { fontSize: fSize(2), fontWeight: "600" },
  description: { fontSize: fSize(1.5), lineHeight: fSize(2.2) },
  choice: { flexDirection: "row", alignItems: "center", gap: wp("1%") },
  choiceButton: {
    flex: 1,
    minHeight: Math.max(48, hp("7%")),
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    paddingVertical: hp("1.3%"),
  },
  copy: { flex: 1, gap: hp("0.6%") },
  choiceTitle: { fontSize: fSize(1.85), fontWeight: "500" },
});
