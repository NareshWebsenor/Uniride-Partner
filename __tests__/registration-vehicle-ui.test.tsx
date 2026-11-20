import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Dropdown } from '@/components/ui';
import RegistrationVehicle from '@/components/driverOnboarding/RegistrationVehicle';
import type { VehicleOptions } from '@/interface/driverRegistration.type';
import { emptyVehicleDraft } from '@/utils/registrationVehicle';

jest.mock('@/components/driverOnboarding/RegistrationFileField', () => () => null, { virtual: true });

const catalog: VehicleOptions = {
  types: [{ type_id: 'car', name: 'Car' }, { type_id: 'van', name: 'Van' }],
  brands: [{ brand_id: 'toyota', type_id: 'car', name: 'Toyota' }, { brand_id: 'ford', type_id: 'van', name: 'Ford' }],
  models: [
    { model_id: 'innova', brand_id: 'toyota', type_id: 'car', name: 'Innova', passenger_capacity: 6, luggage_capacity: 3, fuel_types: [{ fuel_type_id: 'diesel', name: 'Diesel' }] },
    { model_id: 'transit', brand_id: 'ford', type_id: 'van', name: 'Transit', passenger_capacity: 8, luggage_capacity: 4, fuel_types: [] },
  ],
};
let tree: Renderer.ReactTestRenderer;
afterEach(async () => { await act(async () => tree?.unmount()); });

test('catalog cascade filters and clears downstream choices; hides empty fuel step', async () => {
  let value = { ...emptyVehicleDraft(), type_id: 'car', brand_id: 'toyota', model_id: 'innova', fuel_type_id: 'diesel' };
  const onChange = jest.fn(next => { value = next; });
  const render = () => <RegistrationVehicle value={value} onChange={onChange} options={catalog} token="test-token" errors={{}} onApiError={jest.fn()} />;
  await act(async () => { tree = Renderer.create(render()); });
  let dropdowns = tree.root.findAllByType(Dropdown);
  expect(dropdowns[1].props.options).toEqual([{ label: 'Toyota', value: 'toyota' }]);
  expect(dropdowns[2].props.options).toEqual([{ label: 'Innova', value: 'innova' }]);
  expect(dropdowns).toHaveLength(4);
  await act(async () => dropdowns[0].props.onValueChange('van'));
  expect(value).toEqual(expect.objectContaining({ type_id: 'van', brand_id: '', model_id: '', fuel_type_id: '' }));
  await act(async () => tree.update(render()));
  dropdowns = tree.root.findAllByType(Dropdown);
  expect(dropdowns).toHaveLength(3);
  expect(dropdowns[1].props.options).toEqual([{ label: 'Ford', value: 'ford' }]);
  await act(async () => dropdowns[1].props.onValueChange('ford'));
  await act(async () => tree.update(render()));
  dropdowns = tree.root.findAllByType(Dropdown);
  expect(dropdowns[2].props.options).toEqual([{ label: 'Transit', value: 'transit' }]);
  await act(async () => dropdowns[2].props.onValueChange('transit'));
  await act(async () => tree.update(render()));
  expect(tree.root.findAllByType(Dropdown)).toHaveLength(3);
});
