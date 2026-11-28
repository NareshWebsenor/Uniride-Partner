import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Linking, StyleSheet, Text as NativeText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import i18n from '@/localizations';
import AppBackground from '@/components/background/AppBackground';
import { IconButton, Modal, TextInput } from '@/components/ui';
import type { TRootStack } from '@/interface/navigation.type';
import InboxScreen from '@/screens/main/tab/InboxScreen';
import ChatScreen from '@/screens/main/inbox/ChatScreen';
import { useInboxStore } from '@/store/inboxStore';
import { resolveTheme, useThemeStore } from '@/store/themeStore';
import { useTextSizeStore } from '@/store/textSizeStore';
import { darkColors } from '@/utils/theme.utils';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'), useNavigation: () => mockNavigation,
}));
type Navigation = NativeStackScreenProps<TRootStack, 'ChatScreen'>['navigation'];
let tree: Renderer.ReactTestRenderer;
const mount = async (screen: React.ReactNode) => act(async () => {
  tree = Renderer.create(<SafeAreaProvider>{screen}</SafeAreaProvider>);
});
const switchScreen = async (screen: React.ReactNode) => act(async () => {
  tree.update(<SafeAreaProvider>{screen}</SafeAreaProvider>);
});
const chat = (conversationId: string) => <ChatScreen
  route={{ key: conversationId, name: 'ChatScreen', params: { conversationId } }}
  navigation={mockNavigation as unknown as Navigation} />;
const action = (testID: string) => tree.root.findAll(node => node.props.testID === testID && typeof node.props.onPress === 'function')[0];
const press = async (testID: string) => act(async () => action(testID).props.onPress());
const visibleCopy = () => tree.root.findAllByType(NativeText).map(node => React.Children.toArray(node.props.children)
  .filter(child => typeof child === 'string' || typeof child === 'number').join('')).join('\n');
const rows = () => Array.from(new Set(tree.root.findAll(node =>
  typeof node.props.testID === 'string' && node.props.testID.startsWith('inbox-chat-')).map(node => node.props.testID)));
const input = () => tree.root.findByType(TextInput);
const sendButton = () => tree.root.findAllByType(IconButton).find(node => node.props.testID === 'chat-send')!;
const messages = () => useInboxStore.getState().conversations.find(item => item.id === 'priya')!.messages;

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
  useThemeStore.setState(resolveTheme('light', 'light'));
  useTextSizeStore.setState({ size: 'default' });
  useInboxStore.getState().reset();
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  useTextSizeStore.setState({ size: 'default' });
  jest.restoreAllMocks();
});

test('All and Unread filter conversations; each card opens the matching chat', async () => {
  await mount(<InboxScreen />);
  expect(rows()).toEqual(['inbox-chat-priya', 'inbox-chat-amit', 'inbox-chat-neha']);
  expect(visibleCopy()).toContain('Unread (2)');
  for (const conversationId of ['priya', 'amit', 'neha']) {
    await press(`inbox-chat-${conversationId}`);
    expect(mockNavigation.navigate).toHaveBeenLastCalledWith('ChatScreen', { conversationId });
  }
  await press('inbox-filter-unread');
  expect(rows()).toEqual(['inbox-chat-priya', 'inbox-chat-amit']);
  await act(async () => { useInboxStore.getState().markRead('priya'); useInboxStore.getState().markRead('amit'); });
  expect(rows()).toEqual([]);
  expect(visibleCopy()).toContain('All caught up');
  expect(visibleCopy()).toContain('Unread (0)');
  await press('inbox-filter-all');
  expect(rows()).toHaveLength(3);
});

test('opening a chat marks it read but keeps its original new-message separator and native back action', async () => {
  await mount(chat('priya'));
  expect(useInboxStore.getState().conversations.find(item => item.id === 'priya')!.unread).toBe(0);
  expect(visibleCopy()).toContain('2 new messages');
  expect(visibleCopy()).toContain(i18n.t('inbox.mainGate'));
  await press('chat-back');
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  await switchScreen(<InboxScreen />);
  await press('inbox-filter-unread');
  expect(rows()).toEqual(['inbox-chat-amit']);
});

test('typed send trims text, blocks whitespace and duplicate callback, then updates Inbox preview', async () => {
  const request = jest.spyOn(global, 'fetch');
  await mount(chat('priya'));
  expect(sendButton().props.disabled).toBe(true);
  await act(async () => input().props.onChangeText('   '));
  await press('chat-send');
  expect(messages()).toHaveLength(3);
  await act(async () => input().props.onChangeText('  Gate 2, please  '));
  const submit = sendButton().props.onPress;
  await act(async () => { submit(); submit(); });
  expect(messages()).toHaveLength(4);
  expect(messages().at(-1)?.content).toEqual({ kind: 'text', text: 'Gate 2, please' });
  expect(input().props.value).toBe('');
  expect(sendButton().props.disabled).toBe(true);
  expect(visibleCopy()).toContain('Local only');
  expect(visibleCopy()).toContain('2 new messages');
  await switchScreen(<InboxScreen />);
  expect(visibleCopy()).toContain('You: Gate 2, please');
  expect(request).not.toHaveBeenCalled();
});

test('quick replies append local messages and keyboard submit shares the typed-send behavior', async () => {
  await mount(chat('priya'));
  await press('chat-quick-onMyWay'); await press('chat-quick-arrived');
  expect(messages().slice(-2).map(message => message.content)).toEqual([
    { kind: 'text', text: i18n.t('inbox.onMyWay') }, { kind: 'text', text: i18n.t('inbox.arrived') },
  ]);
  await act(async () => input().props.onChangeText('Waiting here'));
  await act(async () => input().props.onSubmitEditing());
  expect(messages().at(-1)?.content).toEqual({ kind: 'text', text: 'Waiting here' });
  expect(input().props.value).toBe('');
});

test('a reply to yesterday’s conversation adds a Today divider without relabelling history', async () => {
  await mount(chat('neha'));
  expect(visibleCopy().split('\n')).toContain('Yesterday');
  expect(visibleCopy().split('\n')).not.toContain('Today');
  await press('chat-quick-onMyWay');
  expect(visibleCopy().split('\n')).toContain('Yesterday');
  expect(visibleCopy().split('\n')).toContain('Today');
  const thread = useInboxStore.getState().conversations.find(item => item.id === 'neha')!;
  expect(thread.messages.map(item => item.day)).toEqual(['yesterday', 'today']);
});

test('support, call and trip actions are dismissible previews without links or requests', async () => {
  const request = jest.spyOn(global, 'fetch');
  const openURL = jest.spyOn(Linking, 'openURL');
  await mount(<InboxScreen />);
  await press('inbox-support');
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
  expect(tree.root.findByType(Modal).props.title).toBe('Chat with support');
  await act(async () => tree.root.findByType(Modal).props.onClose());
  expect(tree.root.findByType(Modal).props.visible).toBe(false);
  await switchScreen(chat('priya'));
  const before = messages();
  for (const [id, title] of [['chat-call', 'Call'], ['chat-view-trip', 'View trip details']]) {
    await press(id);
    expect(tree.root.findByType(Modal).props.title).toBe(title);
    expect(tree.root.findByType(Modal).props.visible).toBe(true);
    expect(visibleCopy()).toContain(i18n.t('inbox.previewBody'));
    await act(async () => tree.root.findByType(Modal).props.onClose());
  }
  expect(messages()).toBe(before);
  expect(request).not.toHaveBeenCalled();
  expect(openURL).not.toHaveBeenCalled();
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
});

test('missing conversation shows fallback with back action and no composer', async () => {
  await mount(chat('missing'));
  expect(visibleCopy()).toContain('Chat unavailable');
  expect(visibleCopy()).toContain(i18n.t('inbox.missingBody'));
  expect(tree.root.findAllByType(TextInput)).toHaveLength(0);
  expect(tree.root.findAllByProps({ testID: 'chat-call' })).toHaveLength(0);
  await press('chat-back'); expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
});

test('Hindi, dark theme and enlarged text update fixtures while preserving user text verbatim', async () => {
  await mount(chat('priya'));
  await act(async () => input().props.onChangeText('inbox.arrived'));
  await press('chat-send');
  const header = () => tree.root.findAllByType(NativeText).find(node => node.props.accessibilityRole === 'header')!;
  const fontSize = StyleSheet.flatten(header().props.style).fontSize;
  await act(async () => {
    await i18n.changeLanguage('hi');
    useThemeStore.setState(resolveTheme('dark', 'dark'));
    useTextSizeStore.setState({ size: 'extraLarge' });
  });
  expect(visibleCopy()).toContain(i18n.t('inbox.mainGate'));
  expect(visibleCopy()).toContain('inbox.arrived');
  expect(visibleCopy()).toContain(i18n.t('inbox.localOnly'));
  expect(input().props.placeholder).toBe(i18n.t('inbox.placeholder'));
  expect(StyleSheet.flatten(header().props.style).fontSize).toBeGreaterThan(fontSize!);
  expect(tree.root.findByType(AppBackground).props.backgroundColor).toBe(darkColors.surface);
});
