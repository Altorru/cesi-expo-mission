import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "@/styles/theme";

export default function App() {
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Bienvenue !</Text>
      </View>
    </SafeAreaView>
  );
}
