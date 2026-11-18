import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import {
  pick,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import i18n from '@/localizations';
import UploadField from '@/components/driverOnboarding/UploadField';
import OnboardingDateField from '@/components/driverOnboarding/OnboardingDateField';

const file: DocumentPickerResponse = {
  uri: 'file:///example.png',
  name: 'example.png',
  type: 'image/png',
  size: 1024,
  error: null,
  nativeType: 'image/png',
  isVirtual: false,
  convertibleToMimeTypes: null,
  hasRequestedType: true,
};
let tree: Renderer.ReactTestRenderer;
const onChange = jest.fn();
const mount = async (imagesOnly = false) =>
  act(async () => {
    tree = Renderer.create(
      <UploadField
        label="Photo"
        actionLabel="Upload"
        testID="upload"
        onChange={onChange}
        imagesOnly={imagesOnly}
      />,
    );
  });
const choose = async () =>
  act(async () => {
    await tree.root
      .findAll(
        node =>
          node.props.testID === 'upload' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});

test('valid local file is returned without network upload or permanent file access', async () => {
  jest.mocked(pick).mockResolvedValueOnce([file]);
  await mount();
  await choose();
  expect(pick).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: 'open',
      requestLongTermAccess: false,
      allowMultiSelection: false,
    }),
  );
  expect(onChange).toHaveBeenCalledWith({
    uri: file.uri,
    name: file.name,
    mime: file.type,
    size: file.size,
  });
});

test.each([
  [{ ...file, size: 10 * 1024 * 1024 + 1 }, 'Choose a file up to 10 MB.'],
  [{ ...file, type: 'text/plain' }, 'Choose an image or PDF file.'],
  [{ ...file, size: null }, 'This file could not be read.'],
])(
  'invalid file is rejected with visible feedback',
  async (picked, message) => {
    jest.mocked(pick).mockResolvedValueOnce([picked]);
    await mount();
    await choose();
    expect(onChange).not.toHaveBeenCalled();
    expect(JSON.stringify(tree.toJSON())).toContain(message);
  },
);

test('profile rejects PDF; cancelling picker preserves the existing selection', async () => {
  jest
    .mocked(pick)
    .mockResolvedValueOnce([{ ...file, type: 'application/pdf' }]);
  await mount(true);
  await choose();
  expect(JSON.stringify(tree.toJSON())).toContain('Choose an image file.');
  jest.mocked(pick).mockRejectedValueOnce({ code: 'OPERATION_CANCELED' });
  await choose();
  expect(onChange).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).not.toContain('Could not open files.');
});

test('repeat taps launch one picker; native errors are actionable', async () => {
  let rejectSelection: (error: Error) => void = () => {};
  jest.mocked(pick).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectSelection = reject;
      }),
  );
  await mount();
  let pending: Promise<void>;
  await act(async () => {
    const button = tree.root.findAll(
      node =>
        node.props.testID === 'upload' &&
        typeof node.props.onPress === 'function',
    )[0];
    pending = button.props.onPress();
    button.props.onPress();
  });
  expect(pick).toHaveBeenCalledTimes(1);
  await act(async () => {
    rejectSelection(new Error('native failure'));
    await pending;
  });
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Could not open files. Please try again.',
  );
});

test('date field saves the selected local date and cancel does not change the draft', async () => {
  await act(async () => {
    tree = Renderer.create(
      <OnboardingDateField
        label="Valid Until"
        value=""
        onChange={onChange}
        testID="expiry"
      />,
    );
  });
  await act(async () =>
    tree.root
      .findAll(
        node =>
          node.props.testID === 'expiry' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress(),
  );
  expect(tree.root.findByType(DateTimePickerModal).props.isVisible).toBe(true);
  await act(async () =>
    tree.root.findByType(DateTimePickerModal).props.onCancel(),
  );
  expect(onChange).not.toHaveBeenCalled();
  await act(async () =>
    tree.root
      .findByType(DateTimePickerModal)
      .props.onConfirm(new Date(2027, 4, 7, 0, 1)),
  );
  expect(onChange).toHaveBeenCalledWith('2027-05-07');
});
