import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { DemoMessage } from "@/interface/inbox.type";
import { hp, wp } from "@/utils/responsive.utils";
import { inboxStyles as s } from "./inbox.styles";
import { useInboxCopy } from "./useInboxCopy";

export default function ChatBubble({ message }: { message: DemoMessage }) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useInboxCopy();
  const outgoing = message.sender === "driver";
  return (
    <View
      testID={`chat-message-${message.id}`}
      style={[
        styles.bubble,
        outgoing ? styles.outgoing : styles.incoming,
        { backgroundColor: outgoing ? colors.chatOutgoing : colors.surface },
      ]}
    >
      <Text style={[s.body, outgoing && { color: colors.onChatOutgoing }]}>
        {copy.message(message)}
      </Text>
      <View style={styles.meta}>
        <Text
          tone="secondary"
          style={[s.small, outgoing && { color: colors.onChatOutgoing }]}
        >
          {copy.time(message.time)}
        </Text>
        {outgoing && (
          <Text style={[s.small, { color: colors.onChatOutgoing }]}>
            {t(message.local ? "inbox.localOnly" : "inbox.delivered")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: wp("3.5%"),
    paddingVertical: hp("1.5%"),
    borderRadius: wp("4%"),
    gap: hp("1%"),
  },
  outgoing: { alignSelf: "flex-end", borderBottomRightRadius: wp("1%") },
  incoming: { alignSelf: "flex-start", borderBottomLeftRadius: wp("1%") },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp("1.5%"),
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
});
