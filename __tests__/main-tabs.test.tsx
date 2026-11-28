import React from "react";
import Renderer, { act } from "react-test-renderer";
import { StyleSheet, Text, View } from "react-native";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import i18n from "@/localizations";
import MainTabs from "@/navigations/MainTabs";
import BottomTabBar from "@/components/ui/BottomTabBar";
import type { TMainTabs } from "@/interface/navigation.type";
import { resolveTheme, useThemeStore } from "@/store/themeStore";
import { darkColors, lightColors } from "@/utils/theme.utils";

beforeEach(async () => {
  await i18n.changeLanguage("en");
  useThemeStore.setState(resolveTheme("light", "light"));
});

test("opens Home, switches all five tabs and returns Home on back", async () => {
  const navigation = createNavigationContainerRef<TMainTabs>();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <NavigationContainer ref={navigation}>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  });
  const tabs = () =>
    tree.root.findByType(BottomTabBar).findAll(
      (node) =>
        node.props.accessibilityRole === "tab" &&
        typeof node.props.onPress === "function"
    );
  expect(tabs().map((tab) => tab.props.accessibilityLabel)).toEqual([
    "Home",
    "Trips",
    "Earnings",
    "Inbox",
    "Menu",
  ]);
  expect(navigation.getCurrentRoute()?.name).toBe("Home");
  for (const [index, name] of [
    "Home",
    "Trips",
    "Earnings",
    "Inbox",
    "Menu",
  ].entries()) {
    await act(async () => tabs()[index].props.onPress());
    expect(navigation.getCurrentRoute()?.name).toBe(name);
    expect(tabs()[index].props.accessibilityState.selected).toBe(true);
    if (name === "Menu") {
      expect(
        tree.root.findAllByProps({ testID: "menu-screen" }).length
      ).toBeGreaterThan(0);
    } else if (name === 'Home') {
      expect(tree.root.findAllByProps({ testID: 'home-screen' }).length).toBeGreaterThan(0);
    } else if (name === 'Trips') {
      expect(tree.root.findAllByProps({ testID: 'trips-screen' }).length).toBeGreaterThan(0);
    } else if (name === 'Earnings') {
      expect(tree.root.findAllByProps({ testID: 'earnings-screen' }).length).toBeGreaterThan(0);
    } else if (name === 'Inbox') {
      expect(tree.root.findAllByProps({ testID: 'inbox-screen' }).length).toBeGreaterThan(0);
    } else {
      expect(
        tree.root
          .findAllByProps({ accessibilityRole: "header" })
          .some((header) => header.props.children === name)
      ).toBe(true);
    }
  }
  await act(async () => navigation.goBack());
  expect(navigation.getCurrentRoute()?.name).toBe("Home");
  await act(async () => tree.unmount());
});

test("honors prevented tab presses, long presses and live language/theme changes", async () => {
  const navigation = createNavigationContainerRef<TMainTabs>();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <NavigationContainer ref={navigation}>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  });
  const bar = () => tree.root.findByType(BottomTabBar);
  const tabs = () =>
    bar().findAll(
      (node) =>
        node.props.accessibilityRole === "tab" &&
        typeof node.props.onPress === "function"
    );
  const events: string[] = [];
  const unsubscribe = bar().props.descriptors[
    bar().props.state.routes[2].key
  ].navigation.addListener(
    "tabPress",
    (event: { preventDefault: () => void }) => {
      event.preventDefault();
    }
  );
  const unsubscribeLong = bar().props.descriptors[
    bar().props.state.routes[2].key
  ].navigation.addListener("tabLongPress", () => {
    events.push("long");
  });
  await act(async () => tabs()[2].props.onPress());
  expect(navigation.getCurrentRoute()?.name).toBe("Home");
  await act(async () => tabs()[2].props.onLongPress());
  expect(events).toEqual(["long"]);
  unsubscribe();
  unsubscribeLong();
  await act(async () => {
    await i18n.changeLanguage("hi");
    useThemeStore.setState(resolveTheme("dark", "dark"));
  });
  expect(tabs()[2].props.accessibilityLabel).toBe("कमाई");
  expect(StyleSheet.flatten(tabs()[0].findByType(Text).props.style).color).toBe(
    darkColors.primary
  );
  expect(
    StyleSheet.flatten(bar().findAllByType(View)[0].props.style).backgroundColor
  ).toBe(darkColors.surface);
  await act(async () => {
    await i18n.changeLanguage("en");
    useThemeStore.setState(resolveTheme("light", "light"));
  });
  expect(tabs()[2].props.accessibilityLabel).toBe("Earnings");
  expect(StyleSheet.flatten(tabs()[0].findByType(Text).props.style).color).toBe(
    lightColors.primary
  );
  await act(async () => tree.unmount());
});
