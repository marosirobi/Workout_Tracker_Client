import { authService } from "@/api/authService";
import { useAuthStore } from "@/store/authStore";
import { tabStyles } from "@/styles/tabScreen";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  };

  const confirmLogout = () => {
    Alert.alert("Kijelentkezés", "Biztosan ki szeretnél jelentkezni?", [
      { text: "Mégse", style: "cancel" },
      { text: "Kijelentkezés", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={tabStyles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={tabStyles.content}>
        <Text style={tabStyles.title}>Profil</Text>

        <View style={styles.card}>
          <Text style={styles.label}>FELHASZNÁLÓNÉV</Text>
          <Text style={styles.value}>{user?.username}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Kijelentkezés</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E1E1E", borderRadius: 12, padding: 16 },
  label: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { color: "#FFF", fontSize: 17, fontWeight: "600" },
  logoutButton: { alignItems: "center", paddingVertical: 18, marginTop: 24 },
  logoutText: { color: "#FF453A", fontSize: 16, fontWeight: "600" },
  otherButton: {
    alignItems: "center",
    paddingVertical: 18,
    marginTop: 24,
    backgroundColor: "#313131",
  },
  otherText: { color: "#f9f9f9", fontSize: 16, fontWeight: "600" },
});
