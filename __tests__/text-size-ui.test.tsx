import React from "react";
import Renderer, { act } from "react-test-renderer";
import {
  Text as NativeText,
  TextInput as NativeInput,
  StyleSheet,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/localizations";
import { Text, Button, TextInput, RadioButton, Modal } from "@/components/ui";
import { ScaledText } from "@/components/ui/Typography";
import TextSizeScreen from "@/screens/settings/TextSizeScreen";
import { useTextSizeStore } from "@/store/textSizeStore";
import { fSize } from "@/utils/responsive.utils";

const mockBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockBack }),
}));

let tree: Renderer.ReactTestRenderer;
beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("en");
  useTextSizeStore.setState({
    size: "default",
    persistenceError: false,
    saving: false,
  });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
});

test("static style overrides, inputs, buttons and nested text scale once without losing input", async () => {
  const baseStyle = StyleSheet.create({
    copy: { fontSize: fSize(2), lineHeight: fSize(3) },
  });
  let mounts = 0;
  function Form() {
    const [value, setValue] = React.useState("");
    React.useEffect(() => {
      mounts += 1;
    }, []);
    return (
      <>
        <Text testID="copy" style={baseStyle.copy}>
          Sample
        </Text>
        <Button title="Button" onPress={() => {}} />
        <TextInput testID="field" value={value} onChangeText={setValue} />
        <ScaledText style={baseStyle.copy}>
          <ScaledText testID="inherited">Nested</ScaledText>
          <ScaledText testID="explicit" style={{ fontSize: fSize(1) }}>
            Small
          </ScaledText>
        </ScaledText>
      </>
    );
  }
  await act(async () => {
    tree = Renderer.create(<Form />);
  });
  const copy = (id: string) =>
    tree.root
      .findAllByType(NativeText)
      .find((node) => node.props.testID === id)!;
  const field = () => tree.root.findByType(NativeInput);
  await act(async () => field().props.onChangeText("kept draft"));
  await act(async () => {
    await useTextSizeStore.getState().setSize("extraLarge");
  });
  expect(StyleSheet.flatten(copy("copy").props.style).fontSize).toBeCloseTo(
    fSize(2) * 1.3
  );
  expect(StyleSheet.flatten(copy("copy").props.style).lineHeight).toBeCloseTo(
    fSize(3) * 1.3
  );
  expect(
    StyleSheet.flatten(copy("inherited").props.style).fontSize
  ).toBeUndefined();
  expect(StyleSheet.flatten(copy("explicit").props.style).fontSize).toBeCloseTo(
    fSize(1) * 1.3
  );
  expect(StyleSheet.flatten(field().props.style).fontSize).toBeCloseTo(
    fSize(2) * 1.3
  );
  expect(field().props.value).toBe("kept draft");
  expect(field().props.allowFontScaling).not.toBe(false);
  expect(mounts).toBe(1);
  const buttonText = tree.root
    .findAllByType(NativeText)
    .find((node) => node.props.children === "Button")!;
  expect(StyleSheet.flatten(buttonText.props.style).fontSize).toBeCloseTo(
    fSize(2) * 1.3
  );
  await act(async () => {
    await useTextSizeStore.getState().setSize("default");
  });
  expect(StyleSheet.flatten(copy("copy").props.style).fontSize).toBe(fSize(2));
});

test("screen previews selection live, saves it, translates and resets to default", async () => {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <TextSizeScreen />
      </SafeAreaProvider>
    );
  });
  await act(async () =>
    tree.root.findAllByType(RadioButton)[3].props.onValueChange()
  );
  expect(useTextSizeStore.getState().size).toBe("extraLarge");
  const preview = tree.root
    .findAllByType(NativeText)
    .find((node) => node.props.children === i18n.t("textSize.sampleBody"))!;
  expect(StyleSheet.flatten(preview.props.style).fontSize).toBeCloseTo(
    fSize(2) * 1.3
  );
  expect(
    JSON.parse((await AsyncStorage.getItem("text-size-preference"))!).size
  ).toBe("extraLarge");
  await act(async () => {
    await i18n.changeLanguage("hi");
  });
  expect(tree.root.findAllByType(RadioButton)[3].props.label).toBe(
    "बहुत बड़ा (130%)"
  );
  await act(async () =>
    tree.root
      .findAllByType(Button)
      .find((node) => node.props.title === i18n.t("textSize.reset"))!
      .props.onPress()
  );
  expect(useTextSizeStore.getState().size).toBe("default");
});

test("already open modal text reacts to size changes", async () => {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <Modal visible onClose={() => {}} title="Preview">
          <Text testID="modal-text">Message</Text>
        </Modal>
      </SafeAreaProvider>
    );
  });
  await act(async () => {
    await useTextSizeStore.getState().setSize("large");
  });
  const text = tree.root
    .findAllByType(NativeText)
    .find((node) => node.props.testID === "modal-text")!;
  expect(StyleSheet.flatten(text.props.style).fontSize).toBeCloseTo(
    fSize(2) * 1.15
  );
});
