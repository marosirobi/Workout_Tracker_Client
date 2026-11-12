import { TemplateResponse, templateService } from "@/api/templateService";
import { BodyWeightModal } from "@/components/BodyWeightModal";
import { TemplateCard } from "@/components/workout/TemplateCard";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { tabStyles } from "@/styles/tabScreen";
import { logger } from "@/utils/logger";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          logger.error("Hiba a sablonok betöltésekor", error);
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
          {t("workoutTab.loadFailed")}
        </Text>
      );
    }
    if (templates.length === 0) {
      return <Text style={tabStyles.mutedText}>{t("workoutTab.empty")}</Text>;
    }
    return templates.map((template) => (
      <TemplateCard
        key={template.id}
        template={template}
        onPress={() => startFromTemplate(template)}
        onEdit={() => router.push(`/templates/${template.id}`)}
        isStarting={startingTemplateId === template.id}
        disabled={isStarting}
      />
    ));
  };

  const isStartingEmpty = isStarting && startingTemplateId === null;

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>{t("workoutTab.title")}</Text>

        <TouchableOpacity
          style={[tabStyles.primaryButton, isStarting && tabStyles.disabled]}
          onPress={() => startEmpty()}
          disabled={isStarting}
        >
          {isStartingEmpty ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={tabStyles.primaryButtonText}>
              {t("workoutTab.startEmpty")}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[tabStyles.sectionTitle, styles.sectionTitle]}>
            {t("workoutTab.templates")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/templates/new")}
            disabled={isStarting}
            hitSlop={10}
          >
            <Text style={styles.newTemplate}>{t("workoutTab.newTemplate")}</Text>
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
