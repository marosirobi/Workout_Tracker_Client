import { BodyWeightModal } from "@/components/BodyWeightModal";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { tabStyles } from "@/styles/tabScreen";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardioTabScreen() {
  const { start, isStarting, bodyWeightModal } = useStartWorkout();

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>Kardió</Text>

        <TouchableOpacity
          style={[tabStyles.primaryButton, isStarting && tabStyles.disabled]}
          onPress={() => start("CARDIO")}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={tabStyles.primaryButtonText}>Kardió indítása</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <BodyWeightModal {...bodyWeightModal} />
    </SafeAreaView>
  );
}
