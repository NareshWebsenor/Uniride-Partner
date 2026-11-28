import i18n from '@/localizations';
import type {
  Answers,
  FileAnswer,
  Vehicle,
  VehicleDraft,
  VehicleOptions,
} from '@/interface/driverRegistration.type';
import { isCurrentDate } from './driverOnboarding';
import { isFileAnswer, validateAnswers } from './registrationValidation';

export function emptyVehicleDraft(): VehicleDraft {
  return {
    type_id: '',
    brand_id: '',
    model_id: '',
    fuel_type_id: '',
    year: '',
    registration_number: '',
    colour: '',
    documents: {},
  };
}

export function validateVehicle(
  value: VehicleDraft,
  options: VehicleOptions,
  answers: Answers = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  const required = i18n.t('driverRegistration.vehicleRequired');
  const invalid = i18n.t('driverRegistration.vehicleInvalidChoice');
  if (!options.types.some(type => type.type_id === value.type_id)) {
    errors.type_id = invalid;
  }
  if (
    !options.brands.some(
      brand => brand.brand_id === value.brand_id && brand.type_id === value.type_id,
    )
  ) {
    errors.brand_id = invalid;
  }
  const model = options.models.find(
    item =>
      item.model_id === value.model_id &&
      item.brand_id === value.brand_id &&
      item.type_id === value.type_id,
  );
  if (!model) errors.model_id = invalid;
  if (
    value.fuel_type_id &&
    !model?.fuel_types.some(fuel => fuel.fuel_type_id === value.fuel_type_id)
  ) {
    errors.fuel_type_id = invalid;
  }
  if (
    options.categories?.length &&
    !options.categories.some(cat => cat.category_id === value.category_id)
  ) {
    errors.category_id = invalid;
  }
  const year = Number(value.year);
  if (
    !/^\d{4}$/.test(value.year) ||
    !Number.isInteger(year) ||
    year < 1980 ||
    year > new Date().getFullYear() + 1
  ) {
    errors.year = i18n.t('driverRegistration.vehicleYearError', {
      year: new Date().getFullYear() + 1,
    });
  }
  const registration = value.registration_number.trim();
  if (registration.length < 2 || registration.length > 20) {
    errors.registration_number = i18n.t(
      'driverRegistration.vehicleRegistrationError',
    );
  }
  if (!value.colour.trim() || value.colour.trim().length > 40) {
    errors.colour = i18n.t('driverRegistration.vehicleColourError');
  }
  if (options.fields?.length) {
    return { ...errors, ...validateAnswers(options.fields, answers, '') };
  }
  const validateDocument = (
    key: keyof VehicleDraft['documents'],
    compulsory: boolean,
    expiry: boolean,
  ) => {
    const document = value.documents[key];
    if (!document) {
      if (compulsory) errors[key] = required;
      return;
    }
    if (!document.name?.trim()) errors[key] = required;
    else if (
      (expiry || document.expires_on) &&
      !isCurrentDate(document.expires_on ?? '')
    ) {
      errors[key] = i18n.t('driverRegistration.vehicleExpiryError');
    }
  };
  validateDocument('registration_certificate', true, false);
  validateDocument('insurance', true, true);
  validateDocument('pollution_certificate', false, true);
  return errors;
}

function cleanFile(file: FileAnswer): FileAnswer {
  return {
    name: file.name,
    ...(file.expires_on ? { expires_on: file.expires_on } : {}),
  };
}

/** Invoke after validateVehicle; only backend-accepted keys cross this boundary. */
export function buildVehicle(
  value: VehicleDraft,
  options?: VehicleOptions | null,
  answers: Answers = {},
): Vehicle {
  let { registration_certificate, insurance, pollution_certificate } =
    value.documents;
  if (options?.fields?.length) {
    const rc = answers.vehicle_registration_certificate_rc;
    const ins = answers.vehicle_insurance;
    const insExpiry = answers.insurance_expiry;
    const pol = answers.pollution_certificate;
    const polExpiry = answers.pollution_certificate_expiry;
    if (!registration_certificate && isFileAnswer(rc)) {
      registration_certificate = rc;
    }
    if (!insurance && isFileAnswer(ins)) {
      insurance = {
        ...ins,
        ...(typeof insExpiry === 'string' && insExpiry
          ? { expires_on: insExpiry }
          : {}),
      };
    }
    if (!pollution_certificate && isFileAnswer(pol)) {
      pollution_certificate = {
        ...pol,
        ...(typeof polExpiry === 'string' && polExpiry
          ? { expires_on: polExpiry }
          : {}),
      };
    }
  }
  if (!registration_certificate || !insurance) {
    throw new Error('vehicle_documents_missing');
  }
  return {
    model_id: value.model_id,
    ...(value.category_id ? { category_id: value.category_id } : {}),
    ...(value.fuel_type_id ? { fuel_type_id: value.fuel_type_id } : {}),
    year: Number(value.year),
    registration_number: value.registration_number.trim().toUpperCase(),
    colour: value.colour.trim(),
    documents: {
      registration_certificate: cleanFile(registration_certificate),
      insurance: cleanFile(insurance),
      ...(pollution_certificate
        ? { pollution_certificate: cleanFile(pollution_certificate) }
        : {}),
    },
  };
}

export function vehicleToDraft(
  vehicle: Vehicle | null,
  options: VehicleOptions,
): VehicleDraft {
  if (!vehicle) return emptyVehicleDraft();
  const model = options.models.find(item => item.model_id === vehicle.model_id);
  return {
    type_id: model?.type_id ?? '',
    brand_id: model?.brand_id ?? '',
    model_id: vehicle.model_id,
    ...(vehicle.category_id ? { category_id: vehicle.category_id } : {}),
    fuel_type_id: vehicle.fuel_type_id ?? '',
    year: String(vehicle.year),
    registration_number: vehicle.registration_number,
    colour: vehicle.colour,
    documents: {
      registration_certificate: cleanFile(
        vehicle.documents.registration_certificate,
      ),
      insurance: cleanFile(vehicle.documents.insurance),
      ...(vehicle.documents.pollution_certificate
        ? {
            pollution_certificate: cleanFile(
              vehicle.documents.pollution_certificate,
            ),
          }
        : {}),
    },
  };
}
