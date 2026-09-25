import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Linking, Platform } from "react-native";
import { useCarrinho } from "./CartContext";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta } from "./AlertaGlobal";

export default function PaymentScreen({ navigation }) {
  const { carrinho, valorTotalEmCentavos, buscarCarrinho } = useCarrinho();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;

  const finalizar = async () => {
    if (!carrinho?.itens?.length) {
      mostrarAlerta("Carrinho vazio", "Adicione itens antes de pagar.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/payments/mercadopago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao gerar pagamento");

      await buscarCarrinho();

      const url = data.init_point || data.url;
      const mode = data.data?.mode;
      const pedidoId = data.data?.pedidoId;

      if (url && mode === "live") {
        if (Platform.OS === "web") {
          window.open(url, "_blank");
        } else {
          await Linking.openURL(url);
        }
        mostrarAlerta(
          "Pedido #" + pedidoId + " criado",
          "Finalize o pagamento na aba que abriu. Seu pedido ja esta registrado e aparecera em Pedidos."
        );
      } else {
        mostrarAlerta(
          "Pedido #" + pedidoId + " registrado",
          "Modo mock (sem token configurado). O pedido foi salvo no banco com status 'processando'."
        );
      }
      navigation.navigate("Products");
    } catch (e) {
      mostrarAlerta("Erro no pagamento", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pagamento</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Resumo do pedido</Text>
        {carrinho?.itens?.map((item) => (
          <View key={`${item.produtoId}-${item.tamanho}`} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={2}>{item.nomeProduto} x{item.quantidade} (tam {item.tamanho})</Text>
            <Text style={styles.itemPrice}>{formatarPreco(item.subtotalEmCentavos)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatarPreco(valorTotalEmCentavos)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.mpButton, loading && styles.disabled]}
          onPress={finalizar}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mpText}>Pagar com Mercado Pago</Text>}
        </TouchableOpacity>
        <Text style={styles.note}>
          Ao confirmar, o pedido e registrado no banco, o carrinho e limpo, o estoque e reduzido e o checkout do Mercado Pago abre em nova aba.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", flexGrow: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40, marginBottom: 20 },
  back: { color: "#111", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", color: "#111" },
  summary: { backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: "#111" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee", gap: 8 },
  itemName: { flex: 1, fontSize: 14, color: "#333" },
  itemPrice: { fontWeight: "600", color: "#333", fontSize: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 14 },
  totalLabel: { fontSize: 18, fontWeight: "700", color: "#111" },
  totalValue: { fontSize: 20, fontWeight: "700", color: "#111" },
  actions: { marginTop: 24 },
  mpButton: { backgroundColor: "#009EE3", padding: 16, borderRadius: 8, alignItems: "center" },
  disabled: { opacity: 0.6 },
  mpText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  note: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 12 },
});
