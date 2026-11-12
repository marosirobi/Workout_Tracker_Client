import { TemplateResponse } from "@/api/templateService";
import { muscleGroupLabel, MuscleGroup } from "@/utils/muscleGroups";
import { Ionicons } from "@expo/vector-icons";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TemplateCardProps {
  template: TemplateResponse;
  onPress: () => void;
  isStarting: boolean;
  disabled: boolean;
  onEdit: () => void;
}

function describeTemplate(template: TemplateResponse, t: TFunction): string {
  const groups = new Set<MuscleGroup>();
  for (const ex of template.exercises) {
    if (ex.muscleGroup) groups.add(ex.muscleGroup);
  }

  const text = t("units.exercises", { count: template.exercises.length });
  const groupText = [...groups].map((g) => muscleGroupLabel(g, t)).join(", ");

  return groupText ? `${text} · ${groupText}` : text;
}

export function TemplateCard({
  template,
  onPress,
  isStarting,
  disabled,
  onEdit,
}: TemplateCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.card, disabled && !isStarting && styles.dimmed]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {template.templateName}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {describeTemplate(template, t)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onEdit}
        disabled={disabled}
        hitSlop={10}
        style={styles.editButton}
      >
        <Ionicons name="create-outline" size={20} color="#8E8E93" />
      </TouchableOpacity>

      {isStarting ? (
        <ActivityIndicator color="#FC4C02" />
      ) : (
        <Text style={styles.action}>{t("workoutTab.start")}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  editButton: { marginRight: 16 },
  dimmed: { opacity: 0.5 },
  texts: { flex: 1, marginRight: 12 },
  name: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  description: { color: "#8E8E93", fontSize: 13, marginTop: 4 },
  action: { color: "#FC4C02", fontSize: 15, fontWeight: "700" },
});
