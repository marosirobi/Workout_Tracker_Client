import { TemplateResponse, templateService } from "@/api/templateService";
import { BodyWeightModal } from "@/components/BodyWeightModal";
import { TemplateCard } from "@/components/workout/TemplateCard";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { tabStyles } from "@/styles/tabScreen";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutTabScreen() {
  const { start, isStarting, bodyWeightModal } = useStartWorkout();
  const router = useRouter();

  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [startingTemplateId, setStartingTemplateId] = useState<number | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          const data = await templateService.getMyTemplates();
          if (!active) return;
          setTemplates(
            [...data].sort((a, b) =>
              a.templateName.localeCompare(b.templateName, "hu"),
            ),
          );
          setLoadFailed(false);
        } catch (error) {
          console.error("Hiba a sablonok betöltésekor", error);
          if (active) setLoadFailed(true);
        } finally {
          if (active) setIsLoadingTemplate(false);
        }
      };

      load();
      return () => {
        active = false;
      };
    }, []),
  );

  const startEmpty = () => start("STRENGTH");

  const startFromTemplate = async (template: TemplateResponse) => {
    setStartingTemplateId(template.id);
    await start("STRENGTH", { id: template.id, name: template.templateName });
    setStartingTemplateId(null);
  };

  const renderTemplates = () => {
    if (isLoadingTemplate) {
      return <ActivityIndicator color="#FC4C02" />;
    }
    if (loadFailed) {
      return (
        <Text style={tabStyles.mutedText}>
          Nem sikerült betölteni a sablonokat.
        </Text>
      );
    }
    if (templates.length === 0) {
      return <Text style={tabStyles.mutedText}>Még nincs sablonod</Text>;
    }
    return templates.map((t) => (
      <TemplateCard
        key={t.id}
        template={t}
        onPress={() => startFromTemplate(t)}
        onEdit={() => router.push(`/templates/${t.id}`)}
        isStarting={startingTemplateId === t.id}
        disabled={isStarting}
      />
    ));
  };

  const isStartingEmpty = isStarting && startingTemplateId === null;

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>Edzés</Text>

        <TouchableOpacity
          style={[tabStyles.primaryButton, isStarting && tabStyles.disabled]}
          onPress={() => startEmpty()}
          disabled={isStarting}
        >
          {isStartingEmpty ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={tabStyles.primaryButtonText}>Üres edzés indítása</Text>
          )}
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[tabStyles.sectionTitle, styles.sectionTitle]}>
            SABLONOK
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/templates/new")}
            disabled={isStarting}
            hitSlop={10}
          >
            <Text style={styles.newTemplate}>+ Új sablon</Text>
          </TouchableOpacity>
        </View>
        {renderTemplates()}
      </ScrollView>
      <BodyWeightModal {...bodyWeightModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 10,
  },
  sectionTitle: { marginTop: 0, marginBottom: 0 },
  newTemplate: { color: "#FC4C02", fontSize: 15, fontWeight: "700" },
});
