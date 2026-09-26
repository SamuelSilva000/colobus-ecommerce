import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { mostrarAlerta } from "./AlertaGlobal";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      mostrarAlerta("Atencao", "Preencha email e senha");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) mostrarAlerta("Falha no login", result.error);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.brand}>COLOBUS</Text>
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Faca login na sua conta</Text>
          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@exemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
              editable={!loading}
            />
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Digite sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((v) => !v)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <MaterialIcons
                  name={passwordVisible ? "visibility-off" : "visibility"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Nao tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")} disabled={loading}>
                <Text style={styles.link}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  brand: { fontFamily: "Montserrat_900Black", fontSize: 52, color: "#111", marginBottom: 8, letterSpacing: 4, textAlign: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8, color: "#1a1a1a", textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 32, textAlign: "center" },
  form: { gap: 16, width: "100%" },
  label: { fontSize: 13, fontWeight: "600", color: "#1a1a1a", marginBottom: -8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 16, fontSize: 15, backgroundColor: "#fafafa" },
  inputContainer: { position: "relative" },
  inputWithIcon: { paddingRight: 48 },
  eyeButton: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center", alignItems: "center", padding: 8 },
  button: { backgroundColor: "#111", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 8 },
  buttonDisabled: { backgroundColor: "#999" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
  footerText: { fontSize: 14, color: "#666" },
  link: { fontSize: 14, color: "#111", fontWeight: "700" },
});
