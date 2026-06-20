import { Tabs } from "expo-router";

import { AppTabBar } from "@/src/components/AppTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Calculate" }} />
      <Tabs.Screen name="procedure" options={{ title: "Procedure" }} />
    </Tabs>
  );
}
