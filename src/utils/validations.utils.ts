import i18n from '@/localizations';
import * as Yup from 'yup';
import { EMissingChannel } from '@/interface/user.type';

// Common validation patterns
const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const BUSINESS_EMAIL_REGEX =
  /^[A-Z0-9._%+-]+@(?!gmail.com)(?!yahoo.com)(?!hotmail.com)(?!.*\.com)[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const ACCOUNT_NUMBER_REGEX = /^[0-9]{9,18}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PRICE_REGEX = /^[0-9]+$/; // only whole numbers
const LICENSE_REGEX = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
const AADHAAR_REGEX = /^[0-9]{12}$/;
export const IMAGE_MAX_SIZE = 10;

// Reusable field validations
export const ValidationFields = {
  email: Yup.string()
    .test(
      'trimmed',
      i18n.t('errors.emailRequired'),
      (value: any) => value?.trim().length > 0,
    )
    .matches(EMAIL_REGEX, i18n.t('errors.emailInvalid'))
    .email(i18n.t('errors.emailInvalid'))
    .required(i18n.t('errors.emailRequired')),

  phone: Yup.string()
    .test(
      'trimmed',
      i18n.t('errors.phoneRequired'),
      (value: any) => value?.trim().length > 0,
    )
    .matches(PHONE_REGEX, i18n.t('errors.invalidPhone'))
    .required(i18n.t('errors.phoneRequired')),

  email_phone: Yup.string()
    .required(i18n.t('errors.emailOrPhoneRequired'))
    .test(
      'email-or-phone',
      i18n.t('errors.invalidEmailOrPhone'),
      function (value) {
        if (!value) return false;

        const isValidEmail = EMAIL_REGEX.test(value);
        const isValidPhone = PHONE_REGEX.test(value);

        if (isValidEmail || isValidPhone) {
          return true;
        }

        // Custom error message
        return this.createError({
          message: value.includes('@')
            ? i18n.t('errors.invalidEmailOrPhone')
            : i18n.t('errors.invalidEmailOrPhone'),
        });
      },
    ),

  name: Yup.string().test(
    'trimmed',
    i18n.t('errors.nameRequired'),
    (value: any) => value?.trim().length > 0,
  ),
  referralCode: Yup.string().test(
    'trimmed',
    i18n.t('errors.referralCodeRequired'),
    (value: any) => value?.trim().length > 0,
  ),

  description: Yup.string()
    .test(
      'trimmed',
      i18n.t('errors.descriptionRequired'),
      (value: any) => value?.trim().length > 0,
    )
    // .min(2, 'Name too short')
    .max(500, i18n.t('errors.descriptionMaxLength'))
    .required(i18n.t('errors.descriptionRequired')),
  user_type: Yup.string().required(i18n.t('errors.selectUserType')),
  image: Yup.object()
    .shape({
      url: Yup.string().required(i18n.t('errors.imageRequired')),
    })
    .required(i18n.t('errors.imageRequired')),

  fullName: Yup.string()
    .test(
      'trimmed',
      i18n.t('errors.fullNameRequired'),
      (value: any) => value?.trim().length > 0,
    )
    .required(i18n.t('errors.fullNameRequired')),

  aadhaar: Yup.string()
    .matches(AADHAAR_REGEX, i18n.t('errors.invalidAadhaar'))
    .required(i18n.t('errors.aadhaarRequired')),

  bankAccount: Yup.string()
    .matches(ACCOUNT_NUMBER_REGEX, i18n.t('errors.bankAccountRequired'))
    .required(i18n.t('errors.bankAccountRequired')),

  ifsc: Yup.string()
    .matches(IFSC_REGEX, i18n.t('errors.invalidIfsc'))
    .required(i18n.t('errors.ifscRequired')),
};

// Schemas using reusable fields
export const LoginSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(PHONE_REGEX, i18n.t('errors.invalidPhone'))
    .required(i18n.t('errors.phoneRequired')),
});

export const OtpSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, i18n.t('errors.otpInvalid'))
    .required(i18n.t('errors.otpRequired')),
});

export const KycPersonalSchema = Yup.object().shape({
  fullName: Yup.string().required(i18n.t('errors.fullNameRequired')),
  phone: Yup.string()
    .matches(PHONE_REGEX, i18n.t('errors.invalidPhone'))
    .required(i18n.t('errors.phoneRequired')),
  email: Yup.string()
    .email(i18n.t('errors.emailInvalid'))
    .required(i18n.t('errors.emailRequired')),
  address: Yup.string().required(i18n.t('errors.addressRequired')),
});

export const KycDocumentSchema = Yup.object().shape({
  aadhaarNumber: Yup.string()
    .matches(AADHAAR_REGEX, i18n.t('errors.invalidAadhaar'))
    .required(i18n.t('errors.aadhaarRequired')),
  bankAccountNumber: Yup.string().required(
    i18n.t('errors.bankAccountRequired'),
  ),
  ifscCode: Yup.string()
    .matches(IFSC_REGEX, i18n.t('errors.invalidIfsc'))
    .required(i18n.t('errors.ifscRequired')),
  frontId: Yup.string().required(i18n.t('errors.idProofRequired')),
  backId: Yup.string().required(i18n.t('errors.idProofRequired')),
});
