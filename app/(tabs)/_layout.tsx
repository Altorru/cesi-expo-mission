/**
 * Layout des Tabs - Navigation par onglets
 *
 * Ce fichier configure la barre de navigation inférieure (Tab Bar).
 * Les parenthèses dans "(tabs)" créent un groupe de routes sans affecter l'URL.
 */

import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "../../src/styles/theme";
import { MaterialIcons } from "@expo/vector-icons";
/**
 * Icône personnalisée pour les onglets
 *
 * Note: Dans une vraie app, on utiliserait @expo/vector-icons
 * Pour l'instant, on utilise des emojis pour simplifier
 */
interface TabIconProps {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <MaterialIcons
        name={icon}
        size={24}
        color={focused ? colors.primary : colors.text}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * TabsLayout - Configuration de la navigation par onglets
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Accueil" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="work" label="Missions" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
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
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    height: 80,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "300%",
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.5,
    marginTop: 4,
  },
  tabLabelFocused: {
    opacity: 1,
    color: colors.primary,
  },
});
