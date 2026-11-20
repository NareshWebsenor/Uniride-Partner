import type { VehicleDraft, VehicleOptions } from '@/interface/driverRegistration.type';
import { buildVehicle, emptyVehicleDraft, validateVehicle, vehicleToDraft } from '@/utils/registrationVehicle';
import { localDateString } from '@/utils/driverOnboarding';

const options: VehicleOptions = {
  types: [{ type_id: 'car', name: 'Car' }, { type_id: 'van', name: 'Van' }],
  brands: [{ brand_id: 'toyota', type_id: 'car', name: 'Toyota' }, { brand_id: 'ford', type_id: 'van', name: 'Ford' }],
  models: [
    { model_id: 'innova', brand_id: 'toyota', type_id: 'car', name: 'Innova', passenger_capacity: 6, luggage_capacity: 3, fuel_types: [{ fuel_type_id: 'diesel', name: 'Diesel' }] },
    { model_id: 'transit', brand_id: 'ford', type_id: 'van', name: 'Transit', passenger_capacity: 8, luggage_capacity: 4, fuel_types: [] },
  ],
};
const draft = (): VehicleDraft => ({
  ...emptyVehicleDraft(), type_id: 'car', brand_id: 'toyota', model_id: 'innova',
  year: '2022', registration_number: 'dl 01 ab 1234', colour: ' White ',
  documents: { registration_certificate: { name: 'rc.jpg' }, insurance: { name: 'insurance.pdf', expires_on: '2099-12-31' } },
});

test('accepts optional omitted fuel and pollution, builds only allowed API keys', () => {
  const value = draft();
  expect(validateVehicle(value, options)).toEqual({});
  expect(buildVehicle(value)).toEqual({
    model_id: 'innova', year: 2022, registration_number: 'DL 01 AB 1234', colour: 'White',
    documents: value.documents,
  });
});

test('catalog references must match type, brand and model and fuel belongs to selected model', () => {
  expect(validateVehicle({ ...draft(), type_id: 'van' }, options)).toHaveProperty('brand_id');
  expect(validateVehicle({ ...draft(), model_id: 'transit' }, options)).toHaveProperty('model_id');
  expect(validateVehicle({ ...draft(), fuel_type_id: 'gasoline' }, options)).toHaveProperty('fuel_type_id');
  expect(validateVehicle({ ...draft(), fuel_type_id: 'diesel' }, options)).toEqual({});
});

test.each(['1979', '2022.5', '', String(new Date().getFullYear() + 2)])('rejects invalid year %s', year => {
  expect(validateVehicle({ ...draft(), year }, options)).toHaveProperty('year');
});

test.each(['1980', String(new Date().getFullYear() + 1)])('accepts year boundary %s', year => {
  expect(validateVehicle({ ...draft(), year }, options)).toEqual({});
});

test('enforces number and colour lengths', () => {
  expect(validateVehicle({ ...draft(), registration_number: 'x' }, options)).toHaveProperty('registration_number');
  expect(validateVehicle({ ...draft(), registration_number: 'x'.repeat(21) }, options)).toHaveProperty('registration_number');
  expect(validateVehicle({ ...draft(), colour: ' ' }, options)).toHaveProperty('colour');
  expect(validateVehicle({ ...draft(), colour: 'x'.repeat(41) }, options)).toHaveProperty('colour');
});

test('required papers and optional pollution expiry are validated', () => {
  expect(validateVehicle({ ...draft(), documents: {} }, options)).toEqual(expect.objectContaining({ registration_certificate: expect.any(String), insurance: expect.any(String) }));
  const value = draft();
  value.documents.insurance = { name: 'insurance.pdf' };
  value.documents.pollution_certificate = { name: 'puc.pdf' };
  expect(validateVehicle(value, options)).toEqual(expect.objectContaining({ insurance: expect.any(String), pollution_certificate: expect.any(String) }));
  value.documents.insurance.expires_on = localDateString(new Date());
  value.documents.pollution_certificate.expires_on = '2099-12-31';
  expect(validateVehicle(value, options)).toEqual({});
});

test('rejects malformed or past dates including optional RC expiry', () => {
  const value = draft();
  value.documents.registration_certificate = { name: 'rc.jpg', expires_on: '2020-01-01' };
  value.documents.insurance = { name: 'insurance.pdf', expires_on: '2099-02-30' };
  expect(validateVehicle(value, options)).toEqual(expect.objectContaining({ registration_certificate: expect.any(String), insurance: expect.any(String) }));
});

test('resume restores catalog references and uploaded papers without requiring new uploads', () => {
  const payload = buildVehicle(draft());
  expect(vehicleToDraft(payload, options)).toEqual({ ...draft(), registration_number: 'DL 01 AB 1234', colour: 'White' });
  const changedCatalog = { ...options, models: [] };
  const resumed = vehicleToDraft(payload, changedCatalog);
  expect(resumed.documents).toEqual(payload.documents);
  expect(validateVehicle(resumed, changedCatalog)).toHaveProperty('model_id');
  expect(vehicleToDraft(null, options)).toEqual(emptyVehicleDraft());
});
