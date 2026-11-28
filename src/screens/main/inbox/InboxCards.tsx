import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SVG } from "@/assets";
import { Card, Text } from "@/components/ui";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { DemoConversation } from "@/interface/inbox.type";
import { hp, wp } from "@/utils/responsive.utils";
import { inboxStyles as s } from "./inbox.styles";
import { useInboxCopy } from "./useInboxCopy";

export function ConversationBadge({
  kind,
}: {
  kind: DemoConversation["kind"];
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  return (
    <View style={[s.badge, { backgroundColor: colors.tabActiveBackground }]}>
      <Text style={[s.small, { color: colors.primary }]}>
        {t(`inbox.${kind}`)}
      </Text>
    </View>
  );
}

export function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: DemoConversation;
  onPress: () => void;
}) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  const copy = useInboxCopy();
  return (
    <Pressable
      testID={`inbox-chat-${conversation.id}`}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Card style={s.card}>
        <View style={s.between}>
          <Text style={[s.name, s.flex]}>{t(conversation.nameKey)}</Text>
          <Text tone="secondary" style={s.small}>
            {copy.age(conversation)}
          </Text>
        </View>
        <View style={s.between}>
          <Text
            tone={conversation.unread ? "primary" : "secondary"}
            style={[s.body, s.flex, conversation.unread > 0 && s.bold]}
            numberOfLines={2}
          >
            {copy.preview(conversation)}
          </Text>
          {conversation.unread > 0 && (
            <View style={[styles.unread, { backgroundColor: colors.primary }]}>
              <Text style={[s.small, { color: colors.onPrimary }]}>
                {conversation.unread}
              </Text>
            </View>
          )}
        </View>
        <View style={[s.between, styles.bottom]}>
          <Text tone="secondary" style={[s.caption, s.flex]}>
            {copy.schedule(conversation)}
          </Text>
          <ConversationBadge kind={conversation.kind} />
        </View>
      </Card>
    </Pressable>
  );
}

export function SupportCard({ onPress }: { onPress: () => void }) {
  const { t } = useAppTranslation();
  const colors = useThemeColor();
  return (
    <Pressable
      testID="inbox-support"
      onPress={onPress}
      accessibilityRole="button"
    >
      <Card style={[s.card, styles.support]}>
        <View
          style={[
            styles.supportIcon,
            { backgroundColor: colors.tabActiveBackground },
          ]}
        >
          <SVG.InboxIcon
            name="support"
            color={colors.primary}
            width={wp("5%")}
            height={wp("5%")}
          />
        </View>
        <View style={[s.flex, s.gap]}>
          <Text style={s.name}>{t("inbox.needHelp")}</Text>
          <Text tone="secondary" style={s.caption}>
            {t("inbox.supportHint")}
          </Text>
          <View style={[s.between, styles.supportLink]}>
            <Text style={[s.body, s.bold, s.flex, { color: colors.primary }]}>
              {t("inbox.support")}
            </Text>
            <SVG.InboxIcon
              name="chevronRight"
              width={wp("4%")}
              height={wp("4%")}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  unread: {
    minWidth: wp("5.5%"),
    minHeight: wp("5.5%"),
    paddingHorizontal: wp("1%"),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: { paddingTop: hp("0.8%") },
  support: { flexDirection: "row", alignItems: "flex-start", gap: wp("3%") },
  supportIcon: { padding: wp("2.5%"), borderRadius: wp("3%") },
  supportLink: { paddingTop: hp("1%"), minHeight: 48 },
});
