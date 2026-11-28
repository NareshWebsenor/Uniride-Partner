# Module 7 — Inbox aur Chat UI

[Module index aur shared setup](starter-setup.md) ·
[Module 4 — Home aur Bottom Tabs](main-tabs.md)

Status: UI preview with three demo passenger conversations. Messages are local
memory only: no API, socket, persistence, automatic reply or actual delivery is
implemented. The current MainStack launch bypass remains unchanged.

## Inbox and conversation flow

The Inbox bottom tab shows All/Unread filters, a support card and passenger cards
for on-demand or scheduled trips. The Unread count is the number of conversations
with unread messages: the initial fixture has two unread conversations containing
three unread messages. Empty Unread results show an explicit caught-up state.

Opening a card navigates to root `ChatScreen` with `{ conversationId }`, hiding
the bottom tabs. Opening the conversation marks it read, updates the Inbox filter
count and preserves an initial unread divider in the timeline. The header's Back
action returns to Inbox. An unknown conversation ID shows an unavailable state.

Chat displays passenger/driver bubbles, times, a pickup-context card, quick replies
and a text composer. Day separators distinguish Yesterday fixtures from Today
messages. Typed messages are trimmed, must be non-empty and are limited
to 1,000 characters. Quick replies use the same local send path. New outgoing
messages show **Local only**; **Delivered** appears only on initial demo fixtures,
not as a claim that locally composed text reached a passenger.

The timeline and read state survive Back and reopening a conversation during the
same process. They reset to the original fixtures on app restart. Privacy copy
states that behavior explicitly; no post-trip deletion scheduler exists.

Call, Chat with support and View trip details open a translated preview dialog.
They do not call a phone number, contact support, open a real trip or initiate any
external action. Dialog dismissal leaves the conversation unchanged.

## Implementation

- `src/screens/main/tab/InboxScreen.tsx`: All/Unread selection and list composition.
- `src/screens/main/inbox/InboxCards.tsx`, `ChatScreen.tsx`, `ChatBubble.tsx`,
  `ChatComposer.tsx`, `useInboxCopy.ts`, `inbox.styles.ts`: cards, root chat screen,
  timeline, composer, translated copy and responsive styles.
- `src/constants/inbox.ts`: initial demo conversations and message-length limit.
  `src/interface/inbox.type.ts` describes preview conversations, not an API schema.
- `src/store/inboxStore.ts`: the single owner of in-memory messages and read state.
  It has no persist middleware. Structured development logs record safe event
  codes only, excluding messages, names and other personal data.
- `src/interface/navigation.type.ts` and `src/navigations/Application.tsx` register
  the typed `ChatScreen` route.
- `src/assets/svg/InboxIcon.tsx`: theme-aware SVG variants exposed through the
  existing `SVG` export in `src/assets/index.ts`.

Existing AppBackground, text, buttons and modal components are reused. The composer
uses `react-native-keyboard-controller` KeyboardAvoidingView with the app's existing
KeyboardProvider. Safe-area padding, scrolling, multiline input and keyboard
avoidance keep messages and send controls accessible.

Central `chatOutgoing` and `onChatOutgoing` theme tokens style outgoing bubbles in
light and dark modes. All app-authored copy and demo fixtures use the `inbox`
English/Hindi/Spanish namespace, including plural counts and accessibility labels.
User-entered messages remain literal user text. There are no new dependencies,
native permissions or backend changes.

## Verification

Validated with `yarn test --runInBand --watchman=false` targeting inbox-ui,
inbox-store, main-tabs, trips-ui, earnings-ui, theme, language and spanish-resources:
8 suites / 57 tests passed. Inbox coverage includes unread filtering and opening,
local send/quick replies, duplicate typed submission, limits, missing conversations,
preview dialogs, memory-only behavior, day separators and Hindi/dark/large-text
rendering. `yarn check:ui` and `git diff --check` passed.

Android emulator checks reused existing Metro and the installed app: Inbox cards,
Chat layout, unread count after opening, and composer above the visible keyboard.
Session screenshots: `/private/tmp/uniride-inbox.png`,
`/private/tmp/uniride-chat.png`, `/private/tmp/uniride-chat-keyboard.png`.
Send behavior is verified by automated component/store tests; no physical-device
or iOS run was performed. Use the existing device/Metro workflow in
[shared setup](starter-setup.md).

Known repository blockers: `yarn type-check` reports existing errors at
`TextArea.tsx:58` (nullable height) and `CardImageComponent.tsx:30` (image style).
`yarn lint` cannot find an ESLint configuration. No Inbox TypeScript errors were
reported. Initial Jest run hit sandbox Watchman access; the rerun with Watchman
disabled completed successfully.
