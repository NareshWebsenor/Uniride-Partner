import { useAppTranslation } from "@/hooks/useAppTranslation";
import type {
  ChatTime,
  DemoConversation,
  DemoMessage,
} from "@/interface/inbox.type";

export function useInboxCopy() {
  const { t } = useAppTranslation();
  const time = (value: ChatTime) =>
    t("inbox.time", {
      hour: value.hour,
      minute: String(value.minute).padStart(2, "0"),
      period: t(`inbox.${value.period}`),
    });
  const message = (value: DemoMessage) =>
    value.content.kind === "text" ? value.content.text : t(value.content.key);
  return {
    time,
    message,
    schedule: (item: DemoConversation) =>
      item.schedule === "now"
        ? t("inbox.pickupNow")
        : t(item.schedule === "today" ? "inbox.todayAt" : "inbox.tomorrowAt", {
            time: time(item.pickupTime),
          }),
    age: (item: DemoConversation) =>
      typeof item.age === "number"
        ? t("inbox.minutesAgo", { count: item.age })
        : t(`inbox.${item.age}`),
    preview: (item: DemoConversation) => {
      const last = item.messages[item.messages.length - 1];
      if (!last) return "";
      return last.sender === "driver"
        ? t("inbox.you", { message: message(last) })
        : message(last);
    },
  };
}
