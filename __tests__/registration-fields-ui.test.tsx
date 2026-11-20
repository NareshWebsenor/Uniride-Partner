import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import RegistrationFields from '@/components/driverOnboarding/RegistrationFields';
import RegistrationFileField from '@/components/driverOnboarding/RegistrationFileField';
import OnboardingDateField from '@/components/driverOnboarding/OnboardingDateField';
import { Dropdown, TextInput, Checkbox } from '@/components/ui';
import type { RegistrationField } from '@/interface/driverRegistration.type';

jest.mock('@/hooks/useRegistrationUpload', () => ({ useRegistrationUpload: () => ({ busy: false, error: '', canRetry: false, choose: jest.fn(), retry: jest.fn() }) }));
const field = (value: Partial<RegistrationField>): RegistrationField => ({ key: 'name', label: 'Name from workspace', type: 'text', required: false, enabled: true, options: [], expiry: false, ...value });
let tree: Renderer.ReactTestRenderer;
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
