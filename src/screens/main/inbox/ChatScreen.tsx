import React, { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SVG } from "@/assets";
import AppBackground from "@/components/background/AppBackground";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Modal,
  Text,
} from "@/components/ui";
import {
  useAppTranslation,
  type TranslationKey,
} from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import type { DemoConversation, DemoMessage } from "@/interface/inbox.type";
import { useInboxStore } from "@/store/inboxStore";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";
import { ConversationBadge } from "./InboxCards";
import ChatBubble from "./ChatBubble";
import ChatComposer from "./ChatComposer";
import { inboxStyles as s } from "./inbox.styles";
import { useInboxCopy } from "./useInboxCopy";

type Props = NativeStackScreenProps<TRootStack, "ChatScreen">;

export default function ChatScreen({ route, navigation }: Props) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const conversation = useInboxStore((state) =>
    state.conversations.find((item) => item.id === route.params.conversationId)
  );
  const [preview, setPreview] = useState<TranslationKey | null>(null);
  const showPreview = (action: "call" | "viewTrip") => {
    setPreview(`inbox.${action}`);
    logger.debug("inbox.preview_action", { scope: "inbox", code: action });
  };
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View style={styles.header}>
        <IconButton
          testID="chat-back"
          accessibilityLabel={t("ui.back")}
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.transparent }}
          icon={<SVG.InboxIcon name="back" />}
        />
        <View style={[s.flex, s.gap]}>
          <Text accessibilityRole="header" style={styles.name}>
            {conversation ? t(conversation.nameKey) : t("inbox.missingTitle")}
          </Text>
          {conversation && (
            <Text tone="secondary" style={s.caption}>
              {t("inbox.passenger")}
            </Text>
          )}
        </View>
        {conversation && (
          <Button
            testID="chat-call"
            title={t("inbox.call")}
            variant="secondary"
            onPress={() => showPreview("call")}
            style={{ backgroundColor: colors.tabActiveBackground }}
            textStyle={[s.body, { color: colors.primary }]}
          />
        )}
      </View>
      {conversation ? (
        <KeyboardAvoidingView style={s.flex} behavior="padding" automaticOffset>
          <ConversationContent
            key={conversation.id}
            conversation={conversation}
            onTrip={() => showPreview("viewTrip")}
          />
        </KeyboardAvoidingView>
      ) : (
        <EmptyState
          title={t("inbox.missingTitle")}
          message={t("inbox.missingBody")}
        />
      )}
      <Modal
        visible={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? t(preview) : t("inbox.previewTitle")}
      >
        <Text>{t("inbox.previewBody")}</Text>
      </Modal>
    </AppBackground>
  );
}

function ConversationContent({
  conversation,
  onTrip,
}: {
  conversation: DemoConversation;
  onTrip: () => void;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useInboxCopy();
  const markRead = useInboxStore((state) => state.markRead);
  const list = useRef<FlatList<DemoMessage>>(null);
  const unread = useRef(conversation.unread).current;
  const firstUnread = useRef(
    unread > 0
      ? conversation.messages
          .filter((item) => item.sender === "passenger")
          .slice(-unread)[0]?.id
      : undefined
  ).current;
  const latest = conversation.messages[conversation.messages.length - 1];
  useEffect(() => {
    markRead(conversation.id);
  }, [conversation.id, markRead]);
  return (
    <>
      <FlatList
        ref={list}
        testID="chat-messages"
        data={conversation.messages}
        keyExtractor={(message) => message.id}
        style={{ backgroundColor: colors.surfaceRaised }}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (latest?.local) list.current?.scrollToEnd({ animated: true });
        }}
        ListHeaderComponent={
          <>
            <Card style={s.card}>
              <View style={s.between}>
                <Text style={[s.name, s.flex]}>
                  {copy.schedule(conversation)}
                </Text>
                <ConversationBadge kind={conversation.kind} />
              </View>
              <Text tone="secondary" style={s.body}>
                {t(
                  conversation.kind === "onDemand"
                    ? "inbox.waitingPickup"
                    : "inbox.scheduledHint"
                )}
              </Text>
              <Button
                testID="chat-view-trip"
                variant="outline"
                title={t("inbox.viewTrip")}
                onPress={onTrip}
                icon={
                  <SVG.InboxIcon
                    name="chevronRight"
                    width={wp("4%")}
                    height={wp("4%")}
                  />
                }
                style={[styles.tripAction, { borderColor: colors.transparent }]}
                textStyle={[s.caption, { color: colors.primary }]}
              />
            </Card>
            <Text tone="secondary" style={[s.caption, styles.notice]}>
              {t("inbox.privacyNote")}
            </Text>
          </>
        }
        ItemSeparatorComponent={MessageSeparator}
        renderItem={({ item, index }) => (
          <>
            {(index === 0 ||
              conversation.messages[index - 1].day !== item.day) && (
              <Text tone="secondary" style={[s.caption, styles.day]}>
                {t(`inbox.${item.day}`)}
              </Text>
            )}
            {item.id === firstUnread && (
              <Text
                style={[
                  s.caption,
                  styles.newMessages,
                  { color: colors.primary },
                ]}
              >
                {t("inbox.newMessages", { count: unread })}
              </Text>
            )}
            <ChatBubble message={item} />
          </>
        )}
      />
      <ChatComposer conversationId={conversation.id} />
    </>
  );
}

function MessageSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("1%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1%"),
  },
  name: { fontSize: fSize(2.2), fontWeight: "600" },
  messages: {
    paddingHorizontal: wp("5%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("2%"),
    flexGrow: 1,
  },
  tripAction: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  notice: {
    textAlign: "center",
    marginHorizontal: wp("3%"),
    marginTop: hp("3%"),
    marginBottom: hp("2.5%"),
  },
  day: { textAlign: "center", paddingBottom: hp("2.5%") },
  newMessages: {
    textAlign: "center",
    paddingTop: hp("0.5%"),
    paddingBottom: hp("2%"),
  },
  separator: { height: hp("1.5%") },
});
