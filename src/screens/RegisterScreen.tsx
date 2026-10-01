import { authService } from "@/api/authService";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !password || !email) {
      Alert.alert("Hiba", "Kérlek töltsd ki az összes mezőt!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Hiba", "Két jelszó nem egyezik!");
      return;
    }

    try {
      await authService.register(username, email, password);
      Alert.alert("Siker", "Sikeres regisztráció");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Hiba történt a regisztráció során.";
      Alert.alert("Sikertelen register", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        value={username}
        placeholder="username"
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={email}
        placeholder="email"
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        placeholder="password"
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      <TextInput
        style={styles.input}
        value={confirmPassword}
        placeholder="confirm password"
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
      />

      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={styles.button}
      >
        <Text style={styles.linkButton}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkButton: { alignItems: "center", padding: 10 },
  linkText: { color: "#007BFF", fontSize: 16, fontWeight: "600" },
});
