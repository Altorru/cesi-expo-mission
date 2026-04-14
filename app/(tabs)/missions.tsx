import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../src/styles/theme";

export default function MissionsScreen() {
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Missions</Text>
      </View>
    </SafeAreaView>
  );
}
