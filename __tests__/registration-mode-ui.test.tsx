import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from '@/localizations';
import DriverRegistrationScreen from '@/screens/driverOnboarding/DriverRegistrationScreen';
import OnboardingChoiceCard from '@/components/driverOnboarding/OnboardingChoiceCard';
import { resolveCatalogImageUrl } from '@/components/driverOnboarding/VehicleCatalogGrid';
import { Button } from '@/components/ui/Button';
import { getRegistrationCredential, saveRegistrationCredential } from '@/service/driverSession';
import { loadRegistrationForm, loadVehicleOptions, setRegistrationDriveMode } from '@/service/rest/auth';
import { clearRegistrationDraft, useRegistrationStore } from '@/store/registrationStore';
import type { RegistrationForm } from '@/interface/driverRegistration.type';

const mockNavigation = { replace: jest.fn(), reset: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));
jest.mock('react-native-image-crop-picker', () => ({
  openCamera: jest.fn(),
  openPicker: jest.fn(),
}));
jest.mock('@/service/config', () => ({
  DRIVER_BASE_URL: 'https://test.invalid',
  DRIVER_API_URL: 'https://test.invalid/v1',
  DRIVER_WORKSPACE: 'test',
}));
jest.mock('@/service/driverSession', () => ({
  getRegistrationCredential: jest.fn(),
  clearRegistrationCredential: jest.fn(),
  saveRegistrationCredential: jest.fn(),
}));
jest.mock('@/service/rest/auth', () => ({
  loadRegistrationForm: jest.fn(),
  loadVehicleOptions: jest.fn(),
  setRegistrationDriveMode: jest.fn(),
  verifyInvitationCode: jest.fn(),
  submitRegistration: jest.fn(),
}));

const credential = {
  passwordSet: true,
  token: 'reg-token',
  applicationId: 'app-1',
  email: 'driver@example.com',
};
const form: RegistrationForm = {
  application_id: 'app-1',
  state: 'invited',
  source: 'self',
  email: 'driver@example.com',
  driver_type: null,
  drive_mode: null,
  vehicle: null,
  form_version: 1,
  expires_at: '2099-01-01T00:00:00Z',
  reason: null,
  answers: {},
  fields: [
    {
      key: 'first_name',
      label: 'First name',
      type: 'text',
      required: true,
      enabled: true,
      options: [],
      expiry: false,
    },
  ],
};

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
  await clearRegistrationDraft();
  useRegistrationStore.setState({ draft: null, storageError: false });
  jest.mocked(getRegistrationCredential).mockResolvedValue(credential);
  jest.mocked(saveRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(loadRegistrationForm).mockResolvedValue(form);
  jest.mocked(loadVehicleOptions).mockResolvedValue({
    types: [
      { type_id: 'car', name: 'Car', image_url: '/v1/driver-registration/catalog-images/car.jpg' },
      { type_id: 'bike', name: 'Motorcycle', image_url: null },
    ],
    brands: [{ brand_id: 'b1', type_id: 'car', name: 'Toyota', image_url: null }],
    models: [
      {
        model_id: 'm1',
        brand_id: 'b1',
        type_id: 'car',
        name: 'Camry',
        passenger_capacity: 0,
        luggage_capacity: 0,
        fuel_types: [{ fuel_type_id: 'f1', name: 'Hybrid', image_url: null }],
      },
    ],
    categories: [{ category_id: 'c1', name: 'Sedan', image_url: null }],
  });
  jest.mocked(setRegistrationDriveMode).mockResolvedValue({
    invitation_code_required: false,
  });
});

test('renders OnboardingChoiceCards and opens Welcome, Partner hub for own_vehicle', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <DriverRegistrationScreen />
      </SafeAreaProvider>,
    );
  });

  expect(JSON.stringify(tree.toJSON())).toContain('How would you like to drive?');
  const cards = tree.root.findAllByType(OnboardingChoiceCard);
  expect(cards).toHaveLength(2);
  expect(cards[0].props.badges).toEqual(['Fleet Partner']);
  expect(cards[0].props.title).toBe('Drive with a chauffeur partner');
  expect(cards[1].props.badges).toEqual(['Own Vehicle']);
  expect(cards[1].props.title).toBe('Drive independently');

  const continueBtn = () =>
    tree.root
      .findAllByType(Button)
      .find(node => node.props.testID === 'onboarding-continue')!;

  expect(continueBtn().props.disabled).toBe(true);
  await act(async () => cards[1].props.onPress());
  expect(continueBtn().props.disabled).toBe(false);

  await act(async () => continueBtn().props.onPress());
  expect(setRegistrationDriveMode).toHaveBeenCalledWith('reg-token', 'own_vehicle');
  expect(loadVehicleOptions).toHaveBeenCalledWith('reg-token');
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Welcome, Partner');
  expect(json).toContain('Vehicle Details');
  expect(json).toContain('User Profile');
  expect(continueBtn().props.title).toBe('Submit Application');
  expect(continueBtn().props.disabled).toBe(true);

  await act(async () =>
    tree.root
      .findAllByProps({ testID: 'open-vehicle-details' })[0]
      .props.onPress(),
  );
  expect(JSON.stringify(tree.toJSON())).toContain('Select vehicle type');
  expect(tree.root.findAllByProps({ testID: 'vehicle-type-grid' }).length).toBeGreaterThan(0);
  expect(
    resolveCatalogImageUrl('/v1/driver-registration/catalog-images/car.jpg'),
  ).toBe('https://test.invalid/v1/driver-registration/catalog-images/car.jpg');
  expect(continueBtn().props.disabled).toBe(true);

  await act(async () =>
    tree.root.findAllByProps({ testID: 'vehicle-type-car' })[0].props.onPress(),
  );
  expect(continueBtn().props.disabled).toBe(false);
  await act(async () => continueBtn().props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Select vehicle brand');

  await act(async () =>
    tree.root.findAllByProps({ testID: 'vehicle-brand-b1' })[0].props.onPress(),
  );
  await act(async () => continueBtn().props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Select vehicle model');

  await act(async () =>
    tree.root.findAllByProps({ testID: 'vehicle-model-m1' })[0].props.onPress(),
  );
  await act(async () => continueBtn().props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Select fuel type');

  await act(async () =>
    tree.root.findAllByProps({ testID: 'vehicle-fuel-f1' })[0].props.onPress(),
  );
  await act(async () => continueBtn().props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Select vehicle category');

  await act(async () =>
    tree.root.findAllByProps({ testID: 'vehicle-category-c1' })[0].props.onPress(),
  );
  await act(async () => continueBtn().props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Vehicle details & documents');

  await act(async () => tree.unmount());
});
