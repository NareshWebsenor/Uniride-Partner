import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { pick } from '@react-native-documents/picker';
import ImagePicker from 'react-native-image-crop-picker';
import { useRegistrationUpload } from '@/hooks/useRegistrationUpload';
import { uploadRegistrationFile } from '@/service/rest/auth';
import { DriverApiError } from '@/service/rest/driverClient';

jest.mock('react-native-image-crop-picker', () => ({ openCamera: jest.fn(), openPicker: jest.fn() }));
jest.mock('@/service/rest/auth', () => ({ uploadRegistrationFile: jest.fn() }));
jest.mock('@/service/rest/driverClient', () => ({ DriverApiError: class extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message = '') { super(message); this.status = status; this.code = code; }
} }));
const upload = jest.mocked(uploadRegistrationFile);
const choose = jest.mocked(pick);
const onUploaded = jest.fn();
const onApiError = jest.fn();
const onBusyChange = jest.fn();
let tree: Renderer.ReactTestRenderer;
let value: ReturnType<typeof useRegistrationUpload>;
function Harness({ token = 'test-token' }: { token?: string }) {
  value = useRegistrationUpload({ token, onUploaded, onApiError, onBusyChange });
  return null;
}
beforeEach(async () => {
  jest.clearAllMocks();
  upload.mockReset();
  upload.mockResolvedValue({ name: 'server-upload.jpg' });
  choose.mockResolvedValue([{
    uri: 'content://chosen/file', name: 'photo.jpg', type: 'image/jpeg', size: 2000,
    hasRequestedType: true, isVirtual: false, convertibleToMimeTypes: null, nativeType: 'image/jpeg', error: null,
  }]);
  await act(async () => { tree = Renderer.create(<Harness />); });
});
afterEach(async () => { await act(async () => tree.unmount()); });

test('selected file uploads before the server name is committed', async () => {
  let resolve!: (result: { name: string }) => void;
  upload.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  let pending!: Promise<void>;
  await act(async () => { pending = value.choose('document'); });
  expect(value.busy).toBe(true);
  expect(onUploaded).not.toHaveBeenCalled();
  await act(async () => { resolve({ name: 'confirmed.jpg' }); await pending; });
  expect(onUploaded).toHaveBeenCalledWith('confirmed.jpg');
  expect(upload).toHaveBeenCalledWith('test-token', expect.objectContaining({ uri: 'content://chosen/file', mime: 'image/jpeg', size: 2000 }));
  expect(onBusyChange.mock.calls).toEqual([[true], [false]]);
});

test('camera photos are compressed using installed picker before upload', async () => {
  jest.mocked(ImagePicker.openCamera).mockResolvedValue({ path: 'file:///photo.jpg', mime: 'image/jpeg', size: 1000, width: 1600, height: 1200 });
  await act(async () => value.choose('camera'));
  expect(ImagePicker.openCamera).toHaveBeenCalledWith(expect.objectContaining({ compressImageMaxWidth: 1600, compressImageQuality: 0.7 }));
  expect(onUploaded).toHaveBeenCalledWith('server-upload.jpg');
});

test('invalid MIME/size never reaches upload API', async () => {
  const base = (await choose())[0];
  choose.mockResolvedValueOnce([{ ...base, type: 'image/gif' }]);
  await act(async () => value.choose('document'));
  expect(value.error).toBeTruthy();
  choose.mockResolvedValueOnce([{ ...base, size: 5 * 1024 * 1024 + 1 }]);
  await act(async () => value.choose('document'));
  expect(upload).not.toHaveBeenCalled();
});

test('failed upload retries the chosen file without opening picker again', async () => {
  upload.mockRejectedValueOnce(new Error('network'));
  await act(async () => value.choose('document'));
  expect(value.canRetry).toBe(true);
  expect(onApiError).toHaveBeenCalledTimes(1);
  await act(async () => value.retry());
  expect(choose).toHaveBeenCalledTimes(1);
  expect(upload).toHaveBeenCalledTimes(2);
  expect(onUploaded).toHaveBeenCalledTimes(1);
});

test('unknown provider size reaches service raw-byte validation instead of a false size error', async () => {
  const base = (await choose())[0];
  choose.mockResolvedValueOnce([{ ...base, size: null }]);
  await act(async () => value.choose('document'));
  expect(upload).toHaveBeenCalledWith('test-token', expect.objectContaining({ size: 0 }));
  expect(onUploaded).toHaveBeenCalledWith('server-upload.jpg');
});

test('raw-byte size failure displays the limit when there is no backend message', async () => {
  upload.mockRejectedValueOnce(new DriverApiError(413, 'file_too_large'));
  await act(async () => value.choose('document'));
  expect(value.error).toContain('5 MB');
});

test('backend-authored upload errors remain verbatim', async () => {
  upload.mockRejectedValueOnce(new DriverApiError(400, 'validation_failed', 'Please upload the front of your licence.'));
  await act(async () => value.choose('document'));
  expect(value.error).toBe('Please upload the front of your licence.');
});

test('picker cancellation preserves the current answer without an error', async () => {
  choose.mockRejectedValueOnce({ code: 'OPERATION_CANCELED' });
  await act(async () => value.choose('document'));
  expect(value.error).toBe('');
  expect(onUploaded).not.toHaveBeenCalled();
  expect(onApiError).not.toHaveBeenCalled();
});

test('switching applications ignores an old upload result', async () => {
  let resolve!: (result: { name: string }) => void;
  upload.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  let pending!: Promise<void>;
  await act(async () => { pending = value.choose('document'); });
  await act(async () => tree.update(<Harness token="new-application-token" />));
  await act(async () => { resolve({ name: 'old-application.jpg' }); await pending; });
  expect(onUploaded).not.toHaveBeenCalled();
  expect(value.busy).toBe(false);
});
