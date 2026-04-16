import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getColors } from "@/styles/theme";
import { useTheme } from "@/context/ThemeContext";

export default function HomeScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.title, { color: themeColors.primary }]}>Bienvenue ! 👋</Text>
        <Text style={[styles.subtitle, { color: themeColors.text }]}>
          Découvrez vos missions
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
});
