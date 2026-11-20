import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown, Text, TextInput } from '@/components/ui';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { FileAnswer, VehicleDraft, VehicleOptions } from '@/interface/driverRegistration.type';
import { hp } from '@/utils/responsive.utils';
import RegistrationFileField from './RegistrationFileField';

type Props = {
  value: VehicleDraft;
  onChange: (value: VehicleDraft) => void;
  options: VehicleOptions;
  token: string;
  errors: Record<string, string>;
  onApiError: (error: unknown) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
};

export default function RegistrationVehicle({ value, onChange, options, token, errors, onApiError, onBusyChange, disabled }: Props) {
  const { t } = useAppTranslation();
  const brands = options.brands.filter(brand => brand.type_id === value.type_id);
  const models = options.models.filter(model => model.type_id === value.type_id && model.brand_id === value.brand_id);
  const selectedModel = models.find(model => model.model_id === value.model_id);
  const update = (patch: Partial<VehicleDraft>) => onChange({ ...value, ...patch });
  const updateDocument = (key: keyof VehicleDraft['documents'], document: FileAnswer | undefined) => {
    const documents = { ...value.documents };
    if (document) documents[key] = document;
    else delete documents[key];
    update({ documents });
  };
  return (
    <View style={styles.fields} testID="registration-vehicle">
      <Text accessibilityRole="header">{t('driverRegistration.vehicleHeading')}</Text>
      {!options.types.length && <Text tone="secondary">{t('driverRegistration.vehicleCatalogEmpty')}</Text>}
      <Dropdown label={t('driverRegistration.vehicleType')} value={value.type_id}
        options={options.types.map(type => ({ label: type.name, value: type.type_id }))}
        disabled={disabled} error={errors.type_id}
        onValueChange={type_id => { if (type_id !== value.type_id) update({ type_id, brand_id: '', model_id: '', fuel_type_id: '' }); }} />
      <Dropdown label={t('driverRegistration.vehicleBrand')} value={value.brand_id}
        options={brands.map(brand => ({ label: brand.name, value: brand.brand_id }))}
        disabled={disabled || !value.type_id} error={errors.brand_id}
        onValueChange={brand_id => { if (brand_id !== value.brand_id) update({ brand_id, model_id: '', fuel_type_id: '' }); }} />
      <Dropdown label={t('driverRegistration.vehicleModel')} value={value.model_id}
        options={models.map(model => ({ label: model.name, value: model.model_id }))}
        disabled={disabled || !value.brand_id} error={errors.model_id}
        onValueChange={model_id => { if (model_id !== value.model_id) update({ model_id, fuel_type_id: '' }); }} />
      {Boolean(selectedModel?.fuel_types.length) && (
        <Dropdown label={t('driverRegistration.vehicleFuel')} value={value.fuel_type_id}
          options={[
            { label: t('driverRegistration.vehicleFuelNone'), value: '' },
            ...(selectedModel?.fuel_types ?? []).map(fuel => ({ label: fuel.name, value: fuel.fuel_type_id })),
          ]}
          disabled={disabled} error={errors.fuel_type_id}
          onValueChange={fuel_type_id => update({ fuel_type_id })} />
      )}
      <TextInput label={t('driverRegistration.vehicleYear')} testID="registration-vehicle-year"
        value={value.year} onChangeText={year => update({ year })} keyboardType="number-pad"
        maxLength={4} editable={!disabled} error={errors.year} />
      <TextInput label={t('driverRegistration.vehicleRegistration')} testID="registration-vehicle-number"
        value={value.registration_number} onChangeText={registration_number => update({ registration_number: registration_number.toUpperCase() })}
        maxLength={20} autoCapitalize="characters" autoCorrect={false} editable={!disabled} error={errors.registration_number} />
      <TextInput label={t('driverRegistration.vehicleColour')} testID="registration-vehicle-colour"
        value={value.colour} onChangeText={colour => update({ colour })}
        maxLength={40} editable={!disabled} error={errors.colour} />
      <RegistrationFileField label={t('driverRegistration.vehicleRc')} value={value.documents.registration_certificate}
        token={token} required onChange={document => updateDocument('registration_certificate', document)}
        error={errors.registration_certificate} onApiError={onApiError} onBusyChange={onBusyChange} disabled={disabled} />
      <RegistrationFileField label={t('driverRegistration.vehicleInsurance')} value={value.documents.insurance}
        token={token} required expiry onChange={document => updateDocument('insurance', document)}
        error={errors.insurance} onApiError={onApiError} onBusyChange={onBusyChange} disabled={disabled} />
      <RegistrationFileField label={t('driverRegistration.vehiclePollution')} value={value.documents.pollution_certificate}
        token={token} expiry onChange={document => updateDocument('pollution_certificate', document)}
        error={errors.pollution_certificate} onApiError={onApiError} onBusyChange={onBusyChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({ fields: { gap: hp('2%') } });
