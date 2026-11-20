// Compatibility export for existing consumers. New integrations use ./auth.
export { sendEmailCode, verifyEmailCode, setRegistrationPassword, loadRegistrationForm,
  loadVehicleOptions, submitRegistration, loginDriver, uploadRegistrationFile } from './auth';
