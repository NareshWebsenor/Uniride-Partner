import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import AppBackground from "@/components/background/AppBackground";
import { EmptyState, Modal, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { TRootStack } from "@/interface/navigation.type";
import { useInboxStore } from "@/store/inboxStore";
import { fSize, hp, wp } from "@/utils/responsive.utils";
import { logger } from "@/utils/logger";
import { ConversationCard, SupportCard } from "../inbox/InboxCards";
import { inboxStyles as s } from "../inbox/inbox.styles";

export default function InboxScreen() {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const navigation = useNavigation<NavigationProp<TRootStack>>();
  const conversations = useInboxStore((state) => state.conversations);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [support, setSupport] = useState(false);
  const unread = conversations.filter((item) => item.unread > 0);
  const visible = unreadOnly ? unread : conversations;
  return (
    <AppBackground backgroundColor={colors.surface}>
      <View style={styles.header} testID="inbox-screen">
        <Text accessibilityRole="header" style={styles.title}>
          {t("inbox.title")}
        </Text>
        <Text tone="secondary" style={s.body}>
          {t("inbox.subtitle")}
        </Text>
        <View style={styles.filters} accessibilityRole="tablist">
          {[false, true].map((selected) => (
            <Pressable
              key={String(selected)}
              testID={selected ? "inbox-filter-unread" : "inbox-filter-all"}
              accessibilityRole="tab"
              accessibilityState={{ selected: unreadOnly === selected }}
              onPress={() => setUnreadOnly(selected)}
              style={[
                styles.filter,
                {
                  backgroundColor:
                    unreadOnly === selected
                      ? colors.primary
                      : colors.surfaceRaised,
                },
              ]}
            >
              <Text
                style={[
                  s.body,
                  {
                    color:
                      unreadOnly === selected
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                {selected
                  ? t("inbox.unread", { count: unread.length })
                  : t("inbox.all")}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.surfaceRaised }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <SupportCard
              onPress={() => {
                setSupport(true);
                logger.debug("inbox.preview_support", { scope: "inbox" });
              }}
            />
            <View style={styles.section}>
              <Text tone="secondary" style={[s.body, s.bold, s.flex]}>
                {t("inbox.passengerMessages")}
              </Text>
              <Text tone="secondary" style={s.caption}>
                {t("inbox.chats", { count: visible.length })}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() =>
              navigation.navigate("ChatScreen", { conversationId: item.id })
            }
          />
        )}
        ItemSeparatorComponent={ConversationSeparator}
        ListEmptyComponent={
          <EmptyState
            title={t("inbox.emptyTitle")}
            message={t("inbox.emptyBody")}
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text tone="secondary" style={[s.body, s.bold]}>
              {t("inbox.footerTitle")}
            </Text>
            <Text tone="secondary" style={s.caption}>
              {t("inbox.footerBody")}
            </Text>
          </View>
        }
      />
      <Modal
        visible={support}
        onClose={() => setSupport(false)}
        title={t("inbox.support")}
      >
        <Text>{t("inbox.previewBody")}</Text>
      </Modal>
    </AppBackground>
  );
}

function ConversationSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: wp("5%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("0.8%"),
    gap: hp("0.8%"),
  },
  title: { fontSize: fSize(2.7), fontWeight: "700" },
  filters: { flexDirection: "row", gap: wp("2.5%"), paddingTop: hp("0.7%") },
  filter: {
    minHeight: Math.max(48, hp("4.5%")),
    paddingHorizontal: wp("6%"),
    paddingVertical: hp("0.7%"),
    borderRadius: wp("2.5%"),
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: wp("5%"),
    paddingTop: hp("2%"),
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("2%"),
    paddingTop: hp("2.5%"),
    paddingBottom: hp("1.5%"),
  },
  separator: { height: hp("1.5%") },
  footer: { paddingTop: hp("3%"), paddingBottom: hp("2%"), gap: hp("0.7%") },
});
