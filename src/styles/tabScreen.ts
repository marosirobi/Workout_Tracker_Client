import { StyleSheet } from "react-native";

export const tabStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  title: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#FC4C02",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  mutedText: { color: "#8E8E93", fontSize: 15 },
});
