import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";

const STATUS_CORES = {
  pendente: { bg: "#fff3cd", text: "#856404", label: "Pendente" },
  processando: { bg: "#cce5ff", text: "#004085", label: "Processando" },
  preparando: { bg: "#d1ecf1", text: "#0c5460", label: "Preparando" },
  em_rota: { bg: "#d4edda", text: "#155724", label: "Em rota de entrega" },
  entregue: { bg: "#c3e6cb", text: "#155724", label: "Entregue" },
  cancelado: { bg: "#f8d7da", text: "#721c24", label: "Cancelado" },
};

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/orders", {
        headers: { "x-user-id": String(user.id) },
      });
      const data = await res.json();
      if (data.success) setPedidos(data.data || []);
    } catch (e) {
      console.error("Erro ao buscar pedidos:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;
  const formatarData = (iso) => {
    try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; }
  };

  const renderPedido = ({ item }) => {
    const statusInfo = STATUS_CORES[item.status] || { bg: "#eee", text: "#333", label: item.status };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
          </View>
        </View>
        <Text style={styles.data}>{formatarData(item.criado_em)}</Text>
        <View style={styles.valorRow}>
          <Text style={styles.valorLabel}>Total:</Text>
          <Text style={styles.valor}>{formatarPreco(item.valor_total_em_centavos)}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
      <Text style={styles.emptyText}>Suas compras aparecerao aqui.</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.shopBtnText}>Ir as compras</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meus Pedidos</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading && pedidos.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginTop: 40 },
  back: { color: "#111", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "bold", color: "#111" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pedidoId: { fontSize: 16, fontWeight: "700", color: "#111" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "700" },
  data: { fontSize: 12, color: "#888", marginBottom: 12 },
  valorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  valorLabel: { fontSize: 14, color: "#666" },
  valor: { fontSize: 18, fontWeight: "bold", color: "#111" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#111", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666", marginBottom: 24, textAlign: "center" },
  shopBtn: { backgroundColor: "#111", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  shopBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
