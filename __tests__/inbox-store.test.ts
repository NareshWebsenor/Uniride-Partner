import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDemoConversations, MAX_CHAT_MESSAGE_LENGTH } from '@/constants/inbox';
import { useInboxStore } from '@/store/inboxStore';
import { logger } from '@/utils/logger';

const conversation = (id: string) => useInboxStore.getState().conversations.find(item => item.id === id)!;
beforeEach(() => { useInboxStore.getState().reset(); jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

test('read clears only the selected unread count; repeat or missing chat is a no-op', () => {
  const before = useInboxStore.getState().conversations;
  useInboxStore.getState().markRead('priya');
  expect(conversation('priya').unread).toBe(0);
  expect(conversation('priya').messages).toBe(before[0].messages);
  expect(conversation('amit').unread).toBe(1);
  const read = useInboxStore.getState().conversations;
  useInboxStore.getState().markRead('priya');
  useInboxStore.getState().markRead('missing');
  expect(useInboxStore.getState().conversations).toBe(read);
});

test.each(['', ' \n\t ', 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1)])('invalid body is rejected without changing the chat', body => {
  const before = useInboxStore.getState().conversations;
  expect(useInboxStore.getState().send('priya', body)).toBe(false);
  expect(useInboxStore.getState().conversations).toBe(before);
});

test('unknown chat rejects sends and accepts no accidental new conversation', () => {
  const before = useInboxStore.getState().conversations;
  expect(useInboxStore.getState().send('missing', 'hello')).toBe(false);
  expect(useInboxStore.getState().conversations).toBe(before);
});

test('sending trims outer whitespace, preserves raw text, and adds a local-only message', () => {
  const amit = conversation('amit');
  const raw = '<b>inbox.arrived</b> {{name}}\nGate 2';
  expect(useInboxStore.getState().send('priya', `  ${raw}  `)).toBe(true);
  expect(conversation('priya').messages.at(-1)).toMatchObject({
    sender: 'driver', content: { kind: 'text', text: raw }, local: true, day: 'today',
  });
  expect(conversation('priya').age).toBe('now');
  expect(conversation('priya').unread).toBe(0);
  expect(conversation('amit')).toBe(amit);
  expect(useInboxStore.getState().send('priya', 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH))).toBe(true);
});

test('messages have distinct IDs even within the same millisecond and reset restores fresh fixtures', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-05T09:45:00Z'));
  const original = useInboxStore.getState().conversations;
  useInboxStore.getState().send('priya', 'first');
  useInboxStore.getState().send('priya', 'second');
  const ids = conversation('priya').messages.map(message => message.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(conversation('priya').messages).toHaveLength(5);
  useInboxStore.getState().reset();
  expect(useInboxStore.getState().conversations).toEqual(createDemoConversations());
  expect(useInboxStore.getState().conversations).not.toBe(original);
  expect(conversation('priya').unread).toBe(2);
});

test('preview messages never reach persistence, transport, or log metadata', () => {
  const request = jest.spyOn(global, 'fetch');
  const log = jest.spyOn(logger, 'debug');
  const body = 'Private pickup instructions for testing';
  useInboxStore.getState().send('priya', body);
  expect(request).not.toHaveBeenCalled();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith('inbox.preview_message_added', { scope: 'inbox' });
  expect(JSON.stringify(log.mock.calls)).not.toContain(body);
});
