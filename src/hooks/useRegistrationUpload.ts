import { useEffect, useRef, useState } from 'react';
import ImagePicker from 'react-native-image-crop-picker';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { uploadRegistrationFile } from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';
import { REGISTRATION_FILE_LIMIT, REGISTRATION_FILE_TYPES } from '@/utils/registrationValidation';
import { logger } from '@/utils/logger';
import type { LocalUpload } from '@/interface/driverOnboarding.type';

type UploadSource = 'camera' | 'gallery' | 'document';
type UploadOptions = {
  token: string;
  onUploaded: (name: string) => void;
  onApiError: (error: unknown) => void;
  onBusyChange?: (busy: boolean) => void;
};

export function useRegistrationUpload(options: UploadOptions) {
  const { t } = useAppTranslation();
  const callbacks = useRef(options);
  callbacks.current = options;
  const active = useRef(true);
  const running = useRef(false);
  const generation = useRef(0);
  const selected = useRef<LocalUpload | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  useEffect(() => {
    active.current = true;
    generation.current += 1;
    selected.current = undefined;
    running.current = false;
    setBusy(false);
    setError('');
    setCanRetry(false);
    return () => {
      active.current = false;
      generation.current += 1;
      if (running.current) callbacks.current.onBusyChange?.(false);
    };
  }, [options.token]);

  const run = async (source?: UploadSource) => {
    if (running.current) return;
    running.current = true;
    const requestGeneration = generation.current;
    const token = options.token;
    const current = () => active.current && generation.current === requestGeneration;
    setBusy(true); setError(''); setCanRetry(false);
    callbacks.current.onBusyChange?.(true);
    let uploading = false;
    try {
      let file = selected.current;
      if (source === 'document') {
        const [result] = await pick({ mode: 'open', type: [types.images, types.pdf], allowMultiSelection: false });
        file = { uri: result.uri, mime: result.type ?? '', name: result.name ?? '', size: result.size ?? 0 };
      } else if (source) {
        const imageOptions = {
          mediaType: 'photo' as const, multiple: false as const, cropping: false,
          compressImageMaxWidth: 1600, compressImageMaxHeight: 1600,
          compressImageQuality: 0.7, forceJpg: true, includeExif: false,
        };
        const image = source === 'camera'
          ? await ImagePicker.openCamera(imageOptions)
          : await ImagePicker.openPicker(imageOptions);
        const rawPath = image.path || image.sourceURL || '';
        const uri = !rawPath || /^(file|content):\/\//.test(rawPath)
          ? rawPath
          : `file://${rawPath}`;
        const rawMime = (image.mime || 'image/jpeg').toLowerCase();
        const mime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
        file = {
          uri,
          mime,
          name: image.filename ?? 'upload.jpg',
          size: Number.isFinite(image.size) ? image.size : 0,
        };
      }
      if (!current() || !file) return;
      if (!REGISTRATION_FILE_TYPES.includes(file.mime)) {
        setError(t('driverRegistration.uploads.unsupported')); return;
      }
      // Some content providers omit size. The service validates the raw Blob
      // before it sends anything; zero here means metadata is unavailable.
      if (!Number.isFinite(file.size) || file.size < 0 || file.size > REGISTRATION_FILE_LIMIT) {
        setError(t('driverRegistration.uploads.tooLarge')); return;
      }
      selected.current = file;
      uploading = true;
      const result = await uploadRegistrationFile(token, file);
      if (!current()) return;
      selected.current = undefined;
      callbacks.current.onUploaded(result.name);
    } catch (failure) {
      if (!current()) return;
      const cancelled = isErrorWithCode(failure) && (
        failure.code === errorCodes.OPERATION_CANCELED || failure.code === 'E_PICKER_CANCELLED'
      );
      if (cancelled) return;
      logger.warn('registration_upload.failed', {
        scope: uploading ? 'upload' : 'pick',
        status: failure instanceof DriverApiError ? failure.status : 0,
        code: failure instanceof DriverApiError ? failure.code : 'unknown',
      });
      setCanRetry(uploading && Boolean(selected.current));
      const baseMessage = failure instanceof DriverApiError && failure.message
        ? failure.message : failure instanceof DriverApiError && failure.status === 413
          ? t('driverRegistration.uploads.tooLarge')
          : t(uploading ? 'driverRegistration.uploads.failed' : 'driverRegistration.uploads.pickFailed');
      const devHint =
        __DEV__ &&
        failure instanceof DriverApiError &&
        !failure.message &&
        failure.status !== 413
          ? ` (${failure.code}:${failure.status})`
          : '';
      setError(`${baseMessage}${devHint}`);
      if (uploading) callbacks.current.onApiError(failure);
    } finally {
      if (current()) { running.current = false; setBusy(false); callbacks.current.onBusyChange?.(false); }
    }
  };
  return { busy, error, canRetry, choose: (source: UploadSource) => run(source), retry: () => run() };
}
