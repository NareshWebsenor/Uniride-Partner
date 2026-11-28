import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import RegistrationFields from '@/components/driverOnboarding/RegistrationFields';
import RegistrationFileField from '@/components/driverOnboarding/RegistrationFileField';
import OnboardingDateField from '@/components/driverOnboarding/OnboardingDateField';
import { Button, Dropdown, TextInput, Checkbox } from '@/components/ui';
import type { RegistrationField } from '@/interface/driverRegistration.type';

const mockChoose = jest.fn();
jest.mock('@/hooks/useRegistrationUpload', () => ({
  useRegistrationUpload: () => ({
    busy: false,
    error: '',
    canRetry: false,
    choose: mockChoose,
    retry: jest.fn(),
  }),
}));
const field = (value: Partial<RegistrationField>): RegistrationField => ({ key: 'name', label: 'Name from workspace', type: 'text', required: false, enabled: true, options: [], expiry: false, ...value });
let tree: Renderer.ReactTestRenderer;
beforeEach(() => jest.clearAllMocks());
afterEach(async () => { await act(async () => tree?.unmount()); });

test('server order/labels, disabled schema fields and verified email are respected', async () => {
  const change = jest.fn();
  await act(async () => {
    tree = Renderer.create(<RegistrationFields fields={[
      field({ key: 'hidden', enabled: false }), field({ key: 'email', type: 'email', label: 'Email from workspace' }), field({}),
    ]} answers={{ email: 'tampered@example.test', name: 'Ravi' }} email="verified@example.test" token="test-token"
      onChange={change} errors={{}} onApiError={jest.fn()} />);
  });
  const inputs = tree.root.findAllByType(TextInput);
  expect(inputs).toHaveLength(2);
  expect(inputs[0].props.label).toBe('Email from workspace');
  expect(inputs[0].props.value).toBe('verified@example.test');
  expect(inputs[0].props.editable).toBe(false);
  expect(inputs[1].props.value).toBe('Ravi');
  await act(async () => inputs[1].props.onChangeText('New name'));
  expect(change).toHaveBeenCalledWith('name', 'New name');
});

test('date, select, checkbox and file preserve API values and expiry behavior', async () => {
  const change = jest.fn();
  await act(async () => {
    tree = Renderer.create(<RegistrationFields fields={[
      field({ key: 'birth_date', type: 'date' }), field({ key: 'licence_expiry', type: 'date' }),
      field({ key: 'shift', type: 'select', options: ['Night', 'Day'] }),
      field({ key: 'terms', type: 'checkbox', required: true }),
      field({ key: 'licence', type: 'file', expiry: true }),
    ]} answers={{ shift: 'Day', terms: true, licence: { name: 'server.jpg' } }} email="verified@example.test" token="test-token"
      onChange={change} errors={{}} onApiError={jest.fn()} disabled />);
  });
  const dates = tree.root.findAllByType(OnboardingDateField);
  expect(dates[0].props.allowPast).toBe(true);
  expect(dates[1].props.allowPast).toBe(false);
  const dropdown = tree.root.findByType(Dropdown);
  expect(dropdown.props.options).toEqual([{ label: 'Night', value: 'Night' }, { label: 'Day', value: 'Day' }]);
  expect(dropdown.props.value).toBe('Day');
  expect(tree.root.findByType(Checkbox).props.value).toBe(true);
  expect(tree.root.findByType(RegistrationFileField).props.value).toEqual({ name: 'server.jpg' });
  expect(dates.every(date => date.props.disabled)).toBe(true);
});

test('address country normalizes to alpha-2 and postcode remains text', async () => {
  const change = jest.fn();
  await act(async () => {
    tree = Renderer.create(<RegistrationFields fields={[field({ key: 'home', type: 'address' })]}
      answers={{ home: { line1: 'Road', city: 'Dubai', country: 'AE', postcode: '00000' } }}
      email="verified@example.test" token="test-token" onChange={change} errors={{}} onApiError={jest.fn()} />);
  });
  const inputs = tree.root.findAllByType(TextInput);
  expect(inputs[4].props.value).toBe('00000');
  await act(async () => inputs[5].props.onChangeText('in'));
  expect(change).toHaveBeenCalledWith('home', { line1: 'Road', city: 'Dubai', country: 'IN', postcode: '00000' });
});

test('upload bottom sheet shows Camera, Gallery, Cancel, and Delete Photo when file exists', async () => {
  const change = jest.fn();
  await act(async () => {
    tree = Renderer.create(
      <RegistrationFileField
        label="RC"
        token="test-token"
        onChange={change}
        onApiError={jest.fn()}
      />,
    );
  });
  const pressable = (id: string) =>
    tree.root
      .findAll(node => node.props.testID === id && typeof node.props.onPress === 'function');
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(pressable('upload-option-camera')).toHaveLength(1);
  expect(pressable('upload-option-gallery')).toHaveLength(1);
  expect(pressable('upload-option-delete')).toHaveLength(0);
  expect(pressable('upload-option-cancel')).toHaveLength(1);

  await act(async () => pressable('upload-option-camera')[0].props.onPress());
  expect(mockChoose).toHaveBeenCalledWith('camera');

  await act(async () => {
    tree.update(
      <RegistrationFileField
        label="RC"
        value={{ name: 'rc.jpg' }}
        token="test-token"
        onChange={change}
        onApiError={jest.fn()}
      />,
    );
  });
  await act(async () => tree.root.findAllByType(Button)[0].props.onPress());
  expect(pressable('upload-option-delete')).toHaveLength(1);
  await act(async () => pressable('upload-option-delete')[0].props.onPress());
  expect(change).toHaveBeenCalledWith(undefined);
});

test('shows upload error without rendering Retry upload button', async () => {
  await act(async () => {
    tree = Renderer.create(
      <RegistrationFileField
        label="RC"
        token="test-token"
        error="Could not upload the file. Please try again."
        onChange={jest.fn()}
        onApiError={jest.fn()}
      />,
    );
  });
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Could not upload the file. Please try again.');
  expect(json).not.toContain('Retry upload');
});
