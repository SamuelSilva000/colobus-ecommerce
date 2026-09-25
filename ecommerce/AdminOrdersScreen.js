import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta } from "./AlertaGlobal";

const STATUS_OPCOES = [
  { valor: "pendente", label: "Pendente", cor: "#856404", bg: "#fff3cd" },
  { valor: "processando", label: "Processando", cor: "#004085", bg: "#cce5ff" },
  { valor: "preparando", label: "Preparando", cor: "#0c5460", bg: "#d1ecf1" },
  { valor: "em_rota", label: "Em rota", cor: "#155724", bg: "#d4edda" },
  { valor: "entregue", label: "Entregue", cor: "#155724", bg: "#c3e6cb" },
  { valor: "cancelado", label: "Cancelado", cor: "#721c24", bg: "#f8d7da" },
];

function infoStatus(status) {
  return STATUS_OPCOES.find((s) => s.valor === status) || STATUS_OPCOES[0];
}

export default function AdminOrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPedido, setModalPedido] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/orders", {
        headers: { "x-user-id": String(user.id) },
      });
      const data = await res.json();
      if (data.success) setPedidos(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;
  const formatarData = (iso) => {
    try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; }
  };

  const alterarStatus = async (pedido, novoStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${pedido.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id),
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao atualizar");
      await carregar();
      setModalPedido(null);
      mostrarAlerta("Sucesso", `Status alterado para ${novoStatus}`);
    } catch (e) {
      mostrarAlerta("Erro", e.message);
    }
  };

  const renderPedido = ({ item }) => {
    const info = infoStatus(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: info.bg }]}>
            <Text style={[styles.statusText, { color: info.cor }]}>{info.label}</Text>
          </View>
        </View>
        <Text style={styles.data}>{formatarData(item.criado_em)}</Text>
        <View style={styles.valorRow}>
          <Text style={styles.valorLabel}>Total:</Text>
          <Text style={styles.valor}>{formatarPreco(item.valor_total_em_centavos)}</Text>
        </View>
        <TouchableOpacity style={styles.alterarBtn} onPress={() => setModalPedido(item)}>
          <Text style={styles.alterarText}>Alterar status</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Todos os Pedidos</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido registrado.</Text>}
        />
      )}

      <Modal visible={!!modalPedido} transparent animationType="fade" onRequestClose={() => setModalPedido(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Alterar status</Text>
            {modalPedido && (
              <Text style={styles.modalSubtitle}>Pedido #{modalPedido.id}</Text>
            )}
            <View style={styles.opcoes}>
              {STATUS_OPCOES.map((s) => {
                const atual = modalPedido?.status === s.valor;
                return (
                  <TouchableOpacity
                    key={s.valor}
                    style={[styles.opcao, atual && styles.opcaoAtual]}
                    onPress={() => alterarStatus(modalPedido, s.valor)}
                  >
                    <View style={[styles.dot, { backgroundColor: s.bg }]} />
                    <Text style={[styles.opcaoText, atual && styles.opcaoTextAtual]}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalPedido(null)}>
              <Text style={styles.cancelarText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", marginTop: 40, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  back: { color: "#111", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "bold", color: "#111" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pedidoId: { fontSize: 16, fontWeight: "700", color: "#111" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "700" },
  data: { fontSize: 12, color: "#888", marginBottom: 12 },
  valorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  valorLabel: { fontSize: 14, color: "#666" },
  valor: { fontSize: 18, fontWeight: "bold", color: "#111" },
  alterarBtn: { backgroundColor: "#111", padding: 12, borderRadius: 8, alignItems: "center" },
  alterarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 6, textAlign: "center" },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" },
  opcoes: { gap: 8, marginBottom: 16 },
  opcao: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#eee" },
  opcaoAtual: { borderColor: "#111", backgroundColor: "#f5f5f5" },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  opcaoText: { fontSize: 15, color: "#333", fontWeight: "600" },
  opcaoTextAtual: { color: "#111", fontWeight: "700" },
  cancelarBtn: { padding: 14, alignItems: "center" },
  cancelarText: { color: "#666", fontSize: 15, fontWeight: "600" },
});
