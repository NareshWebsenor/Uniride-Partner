import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Alert,
  BackHandler,
  Keyboard,
  ScrollView,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Button from "@/components/buttons/CustomButton";
import Checkbox from "@/components/inputs/Checkbox/Checkbox";
import AppBackground from "@/components/background/AppBackground";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import { passwordRules } from "@/utils/authPreview";
import { logger } from "@/utils/logger";
import AuthEntry, { RegistrationDraft } from "./LoginRegisterScreen";
import {
  countries,
  Country,
  EmailStep,
  MobileStep,
  PasswordStep,
  TermsStep,
} from "./OtpVerificationSteps";
import type { themeType } from "@/interface/theme.type";
import { hp, wp } from "@/utils/responsive.utils";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";

type Step = "entry" | "email" | "mobile" | "password" | "terms";
const previous: Record<Exclude<Step, "entry">, Step> = {
  email: "entry",
  mobile: "email",
  password: "mobile",
  terms: "password",
};

export default function LoginScreen({
  navigation,
}: NativeStackScreenProps<TRootStack, "LoginScreen">) {
  const [step, setStep] = useState<Step>("entry");
  const [registerMode, setRegisterMode] = useState(false);
  const [draft, setDraft] = useState<RegistrationDraft>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<Country>(countries[0]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const finished = useRef(false);
  const { t } = useAppTranslation();
  const styles = useThemedStyles(createStyle);
  const colors = useThemeColor();
  const go = useCallback((next: Step) => {
    Keyboard.dismiss();
    setStep(next);
    logger.debug("auth.preview.step", { scope: next });
  }, []);
  const back = useCallback(() => {
    if (step === "entry") return false;
    go(previous[step]);
    return true;
  }, [go, step]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      back
    );
    return () => subscription.remove();
  }, [back]);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [remaining]);
  const unavailable = () =>
    Alert.alert(
      t("partnerAuth.unavailableTitle"),
      t("partnerAuth.unavailableMessage")
    );
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Keyboard.dismiss();
    logger.info("auth.preview.completed", { scope: "ui" });
    if (registerMode) {
      useDriverOnboardingStore.getState().start(draft.firstName);
      navigation.reset({
        index: 0,
        routes: [{ name: "DrivingPreferenceScreen" }],
      });
    } else {
      useDriverOnboardingStore.getState().clear();
      navigation.reset({ index: 0, routes: [{ name: "MainStack" }] });
    }
  };
  const valid =
    step === "email"
      ? /^\d{4}$/.test(code)
      : step === "mobile"
      ? /^\d{10}$/.test(phone)
      : step === "password"
      ? Object.values(passwordRules(password)).every(Boolean) &&
        password === confirm
      : step === "terms" && agreed;
  const next = () => {
    if (!valid) return;
    if (step === "terms") finish();
    else if (step === "email") go("mobile");
    else if (step === "mobile") go("password");
    else if (step === "password") go("terms");
  };
  if (step === "entry") {
    return (
      <AppBackground backgroundColor={colors.surface} extendUnderStatusBar>
        <View style={styles.content}>
          <AuthEntry
            register={registerMode}
            onModeChange={setRegisterMode}
            draft={draft}
            onChange={(value) => {
              if (value.email !== draft.email) {
                setCode("");
                setRemaining(0);
              }
              setDraft(value);
            }}
            onRegister={() => go("email")}
            onLogin={finish}
            onUnavailable={unavailable}
          />
        </View>
      </AppBackground>
    );
  }
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View style={styles.content}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          automaticOffset
        >
          <ScrollView
            key={step}
            testID={`auth-${step}`}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.step}>
              {step === "email" && (
                <EmailStep
                  email={draft.email}
                  code={code}
                  onChange={setCode}
                  remaining={remaining}
                  onResend={() => {
                    setRemaining(30);
                    setCode("");
                    unavailable();
                  }}
                />
              )}
              {step === "mobile" && (
                <MobileStep
                  phone={phone}
                  country={country}
                  onPhone={setPhone}
                  onCountry={setCountry}
                />
              )}
              {step === "password" && (
                <PasswordStep
                  password={password}
                  confirm={confirm}
                  onPassword={setPassword}
                  onConfirm={setConfirm}
                />
              )}
              {step === "terms" && <TermsStep onUnavailable={unavailable} />}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.footer}>
          {step === "terms" && (
            <Checkbox
              value={agreed}
              onChange={setAgreed}
              label={t("partnerAuth.agree")}
              containerStyle={styles.agreement}
            />
          )}
          <View style={styles.footerButtons}>
            <Button
              isGradiantRequired={false}
              title={t("ui.back")}
              onPress={back}
              variant="secondary"
              style={styles.footerAction}
            />
            <Button
              isGradiantRequired={false}
              testID="step-continue"
              title={t("ride.auth.continue")}
              disabled={!valid}
              onPress={next}
              style={styles.footerAction}
            />
          </View>
        </View>
      </View>
    </AppBackground>
  );
}

const createStyle = (theme: themeType) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { flexGrow: 1 },
    content: {
      flex: 1,
      width: "100%",
      maxWidth: 440,
      alignSelf: "center",
    },
    footerAction: {
      flex: 1,
      minHeight: Math.max(48, hp("7%")),
      borderRadius: wp("5%"),
      marginTop: 0,
    },
    step: {
      flex: 1,
      padding: wp("6%"),
      paddingTop: hp("6%"),
      gap: wp("6%"),
    },
    footer: { padding: wp("6%"), gap: wp("6%") },
    footerButtons: { flexDirection: "row", gap: wp("4%") },
    agreement: {
      backgroundColor: theme.surfaceRaised,
      borderRadius: wp("5%"),
      paddingHorizontal: wp("4%"),
      paddingVertical: hp("1%"),
      flexDirection: "row-reverse",
    },
  });
