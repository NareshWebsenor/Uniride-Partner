import React, { type PropsWithChildren } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import BottomTabBar from "@/components/ui/BottomTabBar";
import MainTabIcon from "@/assets/svg/MainTabIcon";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import type { TranslationKey } from "@/hooks/useAppTranslation";
import type { TMainTabs } from "@/interface/navigation.type";
import HomeScreen from "@/screens/main/tab/HomeScreen";
import TripsScreen from "@/screens/main/tab/TripsScreen";
import EarningsScreen from "@/screens/main/tab/EarningsScreen";
import InboxScreen from "@/screens/main/tab/InboxScreen";
import MenuScreen from "@/screens/main/tab/MenuScreen";

const Tab = createBottomTabNavigator<TMainTabs>();
const titles: Record<keyof TMainTabs, TranslationKey> = {
  Home: "tabs.home",
  Trips: "tabs.trips",
  Earnings: "tabs.earnings",
  Inbox: "tabs.inbox",
  Menu: "tabs.menu",
};

function TabScreenLayout({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  // The bar owns the bottom inset; screen backgrounds keep the other edges.
  return (
    <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

export default function MainTabs() {
  const { t } = useAppTranslation();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenLayout={({ children }) => (
        <TabScreenLayout>{children}</TabScreenLayout>
      )}
      screenOptions={({ route }) => ({
        headerShown: false,
        title: t(titles[route.name]),
        tabBarButtonTestID: `main-tab-${route.name}`,
        tabBarIcon: ({ color, size }) => (
          <MainTabIcon name={route.name} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}
