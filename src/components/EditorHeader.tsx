import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface EditorHeaderProps {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditorHeader({
  title,
  onCancel,
  onSave,
  isSaving,
}: EditorHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.side}
        onPress={onCancel}
        disabled={isSaving}
        hitSlop={12}
      >
        <Text style={styles.action}>Mégse</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <TouchableOpacity
        style={[styles.side, styles.right]}
        onPress={onSave}
        disabled={isSaving}
        hitSlop={12}
      >
        {isSaving ? (
          <ActivityIndicator color="#FC4C02" />
        ) : (
          <Text style={[styles.action, styles.save]}>Mentés</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  side: { width: 80 },
  right: { alignItems: "flex-end" },
  title: {
    flex: 1,
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  action: { color: "#FC4C02", fontSize: 16, fontWeight: "600" },
  save: { fontWeight: "800" },
});
