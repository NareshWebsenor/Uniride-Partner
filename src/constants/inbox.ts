import type {
  DemoConversation,
  DemoMessage,
  DemoMessageKey,
} from "@/interface/inbox.type";

export const MAX_CHAT_MESSAGE_LENGTH = 1000;
const message = (
  id: string,
  sender: DemoMessage["sender"],
  key: DemoMessageKey,
  minute: number,
  day: DemoMessage["day"] = "today"
): DemoMessage => ({
  id,
  sender,
  content: { kind: "translation", key },
  time: { hour: 9, minute, period: "am" },
  day,
  local: false,
});

/** Fresh fixtures for the memory-only UI preview; no contact details or session tokens. */
export function createDemoConversations(): DemoConversation[] {
  return [
    {
      id: "priya",
      nameKey: "inbox.priya",
      kind: "onDemand",
      schedule: "now",
      pickupTime: { hour: 9, minute: 40, period: "am" },
      age: 2,
      unread: 2,
      messages: [
        message("priya-1", "driver", "inbox.pickupGreeting", 33),
        message("priya-2", "passenger", "inbox.waitingOutside", 38),
        message("priya-3", "passenger", "inbox.mainGate", 39),
      ],
    },
    {
      id: "amit",
      nameKey: "inbox.amit",
      kind: "scheduled",
      schedule: "today",
      pickupTime: { hour: 2, minute: 0, period: "pm" },
      age: 15,
      unread: 1,
      messages: [message("amit-1", "passenger", "inbox.bags", 25)],
    },
    {
      id: "neha",
      nameKey: "inbox.neha",
      kind: "scheduled",
      schedule: "tomorrow",
      pickupTime: { hour: 8, minute: 0, period: "am" },
      age: "yesterday",
      unread: 0,
      messages: [
        message("neha-1", "driver", "inbox.pickupReply", 20, "yesterday"),
      ],
    },
  ];
}
