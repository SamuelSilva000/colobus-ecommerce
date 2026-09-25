import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta, confirmarAlerta } from "./AlertaGlobal";

export default function AdminUsersScreen({ navigation }) {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/users", {
        headers: { "x-user-id": String(user.id) },
      });
      const data = await res.json();
      if (data.success) setUsuarios(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const excluir = async (usuario) => {
    const ok = await confirmarAlerta("Excluir usuario", `Tem certeza que deseja excluir ${usuario.nome_completo} (${usuario.email})?`);
    if (!ok) return;
    try {
      const res = await apiFetch(`/api/users/${usuario.id}`, {
        method: "DELETE",
        headers: { "x-user-id": String(user.id) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao excluir");
      await carregar();
      mostrarAlerta("Sucesso", "Usuario excluido");
    } catch (e) {
      mostrarAlerta("Erro", e.message);
    }
  };

  const renderUsuario = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome_completo}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.tipoBadge}>
          <Text style={styles.tipoText}>{item.tipo}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.excluirBtn} onPress={() => excluir(item)}>
        <Text style={styles.excluirText}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Usuarios</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>
      ) : (
        <FlatList
          data={usuarios}
          renderItem={renderUsuario}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuario cadastrado.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", marginTop: 40, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  back: { color: "#111", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "bold", color: "#111" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, alignItems: "center" },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: "700", color: "#111" },
  email: { fontSize: 13, color: "#666", marginTop: 2 },
  tipoBadge: { alignSelf: "flex-start", backgroundColor: "#eee", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  tipoText: { fontSize: 11, fontWeight: "700", color: "#333", textTransform: "uppercase" },
  excluirBtn: { backgroundColor: "#FF3B30", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  excluirText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
});
