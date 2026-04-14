import { Tabs } from "expo-router";
import { Text, View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../src/styles/theme";
import { MaterialIcons } from "@expo/vector-icons";

// Couleur de fond principale de l'app (pour le fondu en bas)
const BG = "236, 226, 241";

interface TabIconProps {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.iconPill,
          focused && styles.iconPillFocused,
        ]}
      >
        <MaterialIcons
          name={icon}
          size={24}
          color={focused ? "#fff" : colors.primary + "70"}
        />
      </View>
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelFocused]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function TabBarBackground() {
  if (Platform.OS !== "ios") {
    return <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />;
  }
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`rgba(${BG}, 1)`, `rgba(${BG}, 0)`]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Accueil" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="work" label="Missions" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" label="Profil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    height: 84,
  },
  tabBarAndroid: {
    backgroundColor: `rgba(${BG}, 0.94)`,
    borderTopColor: colors.primary + "18",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 32,
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
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.primary + "70",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: "700",
  },
});
