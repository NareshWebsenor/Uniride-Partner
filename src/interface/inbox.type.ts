export type DemoMessageKey =
  | "inbox.pickupGreeting"
  | "inbox.waitingOutside"
  | "inbox.mainGate"
  | "inbox.bags"
  | "inbox.pickupReply";
export interface ChatTime {
  hour: number;
  minute: number;
  period: "am" | "pm";
}
export interface DemoMessage {
  id: string;
  sender: "driver" | "passenger";
  content:
    | { kind: "translation"; key: DemoMessageKey }
    | { kind: "text"; text: string };
  time: ChatTime;
  day: "today" | "yesterday";
  local: boolean;
}
export interface DemoConversation {
  id: string;
  nameKey: "inbox.priya" | "inbox.amit" | "inbox.neha";
  kind: "onDemand" | "scheduled";
  schedule: "now" | "today" | "tomorrow";
  pickupTime: ChatTime;
  age: number | "yesterday" | "now";
  unread: number;
  messages: readonly DemoMessage[];
}
