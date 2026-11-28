import { create } from "zustand";
import {
  createDemoConversations,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/constants/inbox";
import type { DemoConversation, DemoMessage } from "@/interface/inbox.type";
import { logger } from "@/utils/logger";

interface InboxState {
  conversations: readonly DemoConversation[];
  markRead: (id: string) => void;
  send: (id: string, text: string) => boolean;
  reset: () => void;
}
let sequence = 0;

// Intentionally no persist middleware, API, socket or device contact integration.
export const useInboxStore = create<InboxState>((set, get) => ({
  conversations: createDemoConversations(),
  markRead: (id) => {
    if (!get().conversations.some((item) => item.id === id && item.unread > 0))
      return;
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === id ? { ...item, unread: 0 } : item
      ),
    }));
    logger.debug("inbox.preview_read", { scope: "inbox" });
  },
  send: (id, raw) => {
    const text = raw.trim();
    if (
      !text ||
      text.length > MAX_CHAT_MESSAGE_LENGTH ||
      !get().conversations.some((item) => item.id === id)
    )
      return false;
    const now = new Date();
    const hour = now.getHours();
    const message: DemoMessage = {
      id: `local-${now.getTime()}-${++sequence}`,
      sender: "driver",
      content: { kind: "text", text },
      local: true,
      day: "today",
      time: {
        hour: hour % 12 || 12,
        minute: now.getMinutes(),
        period: hour >= 12 ? "pm" : "am",
      },
    };
    set((state) => ({
      conversations: state.conversations.map((item) =>
        item.id === id
          ? {
              ...item,
              age: "now",
              unread: 0,
              messages: [...item.messages, message],
            }
          : item
      ),
    }));
    logger.debug("inbox.preview_message_added", { scope: "inbox" });
    return true;
  },
  reset: () => set({ conversations: createDemoConversations() }),
}));
