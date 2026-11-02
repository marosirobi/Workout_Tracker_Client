import { useStartWorkout } from "@/hooks/useStartWorkout";
import { tabStyles } from "@/styles/tabScreen";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutTabScreen() {
  const { start, isStarting } = useStartWorkout();

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>Edzés</Text>

        <TouchableOpacity
          style={[tabStyles.primaryButton, isStarting && tabStyles.disabled]}
          onPress={() => start("STRENGTH")}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={tabStyles.primaryButtonText}>Üres edzés indítása</Text>
          )}
        </TouchableOpacity>

        <Text style={tabStyles.sectionTitle}>SABLONOK</Text>
        <Text style={tabStyles.mutedText}>
          Itt jelennek majd meg a sablonjaid.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
