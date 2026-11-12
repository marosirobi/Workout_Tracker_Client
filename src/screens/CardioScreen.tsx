import { BodyWeightModal } from "@/components/BodyWeightModal";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { tabStyles } from "@/styles/tabScreen";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CardioTabScreen() {
  const { t } = useTranslation();
  const { start, isStarting, bodyWeightModal } = useStartWorkout();

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>{t("cardioTab.title")}</Text>

        <TouchableOpacity
          style={[tabStyles.primaryButton, isStarting && tabStyles.disabled]}
          onPress={() => start("CARDIO")}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={tabStyles.primaryButtonText}>
              {t("cardioTab.start")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <BodyWeightModal {...bodyWeightModal} />
    </SafeAreaView>
  );
}
