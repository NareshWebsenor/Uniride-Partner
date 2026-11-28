import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SVG } from "@/assets";
import { Button, IconButton, TextInput } from "@/components/ui";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/constants/inbox";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useInboxStore } from "@/store/inboxStore";
import { hp, wp } from "@/utils/responsive.utils";
import { inboxStyles as s } from "./inbox.styles";

export default function ChatComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const send = useInboxStore((state) => state.send);
  const [draft, setDraft] = useState("");
  const currentDraft = useRef("");
  const change = (value: string) => {
    currentDraft.current = value;
    setDraft(value);
  };
  const submit = () => {
    const text = currentDraft.current;
    if (send(conversationId, text)) change("");
  };
  return (
    <>
      <View
        style={[styles.quickReplies, { backgroundColor: colors.surfaceRaised }]}
      >
        {(["onMyWay", "arrived"] as const).map((key) => (
          <Button
            key={key}
            testID={`chat-quick-${key}`}
            title={t(`inbox.${key}`)}
            variant="outline"
            onPress={() => send(conversationId, t(`inbox.${key}`))}
            style={[styles.quick, { backgroundColor: colors.surface }]}
            textStyle={[s.caption, { color: colors.primary }]}
          />
        ))}
      </View>
      <View style={styles.composer}>
        <TextInput
          testID="chat-input"
          accessibilityLabel={t("inbox.placeholder")}
          placeholder={t("inbox.placeholder")}
          value={draft}
          onChangeText={change}
          multiline
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={submit}
          containerStyle={s.flex}
          style={[s.body, styles.input]}
          fieldStyle={{
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.transparent,
            paddingHorizontal: wp("3.5%"),
          }}
        />
        <IconButton
          testID="chat-send"
          accessibilityLabel={t("inbox.send")}
          onPress={submit}
          disabled={!draft.trim()}
          style={{ backgroundColor: colors.tabActiveBackground }}
          icon={
            <SVG.InboxIcon
              name="send"
              color={colors.primary}
              width={wp("6%")}
              height={wp("6%")}
            />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  quickReplies: {
    flexDirection: "row",
    gap: wp("2.5%"),
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("1.5%"),
  },
  quick: { flex: 1, paddingHorizontal: wp("2%") },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("1.6%"),
    gap: wp("3%"),
  },
  input: { maxHeight: hp("14%"), paddingVertical: hp("1.3%") },
});
