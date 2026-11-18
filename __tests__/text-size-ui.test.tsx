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
  await AsyncStorage.clear();
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

const mountScreen = async () => {
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <TextSizeScreen />
      </SafeAreaProvider>
    );
  });
};
const action = (key: "apply" | "reset") =>
  tree.root
    .findAllByType(Button)
    .find((node) => node.props.title === i18n.t(`textSize.${key}`))!;
const fontFor = (key: string) =>
  StyleSheet.flatten(
    tree.root
      .findAllByType(NativeText)
      .find((node) => node.props.children === i18n.t(key))!.props.style
  ).fontSize;
const choose = async (index: number) => {
  await act(async () =>
    tree.root.findAllByType(RadioButton)[index].props.onValueChange()
  );
};

test("only the message previews a draft; Apply saves all text, subsequent drafts stay isolated and Reset restores default", async () => {
  await mountScreen();
  const bodySize = fontFor("textSize.sampleBody");
  const headingSize = fontFor("textSize.sampleTitle");
  const screenTitleSize = fontFor("textSize.title");
  await choose(3);
  expect(useTextSizeStore.getState().size).toBe("default");
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(fontFor("textSize.sampleMessage")).toBeCloseTo(fSize(2) * 1.3);
  expect(fontFor("textSize.sampleBody")).toBe(bodySize);
  expect(fontFor("textSize.sampleTitle")).toBe(headingSize);
  expect(fontFor("textSize.title")).toBe(screenTitleSize);
  expect(action("apply")).toBeDefined();
  expect(action("reset")).toBeUndefined();
  await act(async () => action("apply").props.onPress());
  expect(useTextSizeStore.getState().size).toBe("extraLarge");
  expect(fontFor("textSize.sampleBody")).toBeCloseTo(fSize(2) * 1.3);
  expect(
    JSON.parse((await AsyncStorage.getItem("text-size-preference"))!).size
  ).toBe("extraLarge");
  expect(action("reset")).toBeDefined();
  jest.mocked(AsyncStorage.setItem).mockClear();
  await choose(0);
  expect(useTextSizeStore.getState().size).toBe("extraLarge");
  expect(fontFor("textSize.sampleMessage")).toBeCloseTo(fSize(2) * 0.85);
  expect(fontFor("textSize.sampleBody")).toBeCloseTo(fSize(2) * 1.3);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  await act(async () => action("apply").props.onPress());
  expect(fontFor("textSize.sampleBody")).toBeCloseTo(fSize(2) * 0.85);
  await act(async () => {
    await i18n.changeLanguage("hi");
  });
  expect(tree.root.findAllByType(RadioButton)[3].props.label).toBe(
    "बहुत बड़ा (130%)"
  );
  await act(async () => action("reset").props.onPress());
  expect(useTextSizeStore.getState().size).toBe("default");
  expect(fontFor("textSize.sampleMessage")).toBeCloseTo(fSize(2));
  expect(action("reset").props.disabled).toBe(true);
});

test("leaving without Apply discards the draft and returning to applied selection restores Reset", async () => {
  await mountScreen();
  await choose(2);
  await choose(1);
  expect(action("apply")).toBeUndefined();
  expect(action("reset")).toBeDefined();
  await choose(3);
  await act(async () => tree.unmount());
  await mountScreen();
  expect(tree.root.findAllByType(RadioButton)[1].props.value).toBe(true);
  expect(useTextSizeStore.getState().size).toBe("default");
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test("failed Apply offers Apply again, blocks changes while saving and retries persistence", async () => {
  await mountScreen();
  await choose(2);
  let rejectWrite: (error: Error) => void = () => {};
  jest.mocked(AsyncStorage.setItem).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectWrite = reject;
      })
  );
  await act(async () => action("apply").props.onPress());
  expect(
    tree.root.findAllByType(RadioButton).every((node) => node.props.disabled)
  ).toBe(true);
  expect(
    tree.root.findAllByType(Button).some((node) => node.props.loading)
  ).toBe(true);
  await act(async () => rejectWrite(new Error("storage unavailable")));
  expect(useTextSizeStore.getState().persistenceError).toBe(true);
  expect(action("apply")).toBeDefined();
  await act(async () => action("apply").props.onPress());
  expect(useTextSizeStore.getState().persistenceError).toBe(false);
  expect(
    JSON.parse((await AsyncStorage.getItem("text-size-preference"))!).size
  ).toBe("large");
  expect(action("reset")).toBeDefined();
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
