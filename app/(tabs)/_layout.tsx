import { Tabs } from "expo-router";
import { Text, View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { getColors } from "../../src/styles/theme";
import { useTheme } from "../../src/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";

// Hauteur standard de la tab bar (sans insets)
const TAB_BAR_HEIGHT = 56;

interface TabIconProps {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  focused: boolean;
  primaryColor: string;
}

function TabIcon({ icon, label, focused, primaryColor }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.iconPill,
          focused && { backgroundColor: primaryColor },
          focused && styles.iconPillFocused,
        ]}
      >
        <MaterialIcons
          name={icon}
          size={24}
          color={focused ? "#fff" : primaryColor + "70"}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          focused && { color: primaryColor, fontWeight: "600" },
          !focused && { color: primaryColor + "80" },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function TabBarBackground({ bgColor, borderColor }: { bgColor: string; borderColor: string }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {Platform.OS === "ios" && (
        <>
          <BlurView intensity={95} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[bgColor + "66", bgColor + "1a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      )}
      {Platform.OS === "android" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor + "f2", borderTopColor: borderColor, borderTopWidth: StyleSheet.hairlineWidth }]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <TabBarBackground bgColor={themeColors.cardBackground} borderColor={themeColors.border} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Accueil" focused={focused} primaryColor={themeColors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="work" label="Missions" focused={focused} primaryColor={themeColors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" label="Profil" focused={focused} primaryColor={themeColors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    paddingTop: 12,
  },
  tabIconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 3,
    minWidth: 72,
  },
  iconPill: {
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconPillFocused: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
