import { useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useCarrinho } from "./CartContext";
import { useAuth } from "./AuthContext";
import { mostrarAlerta, confirmarAlerta } from "./AlertaGlobal";

export default function CartScreen({ navigation }) {
  const { carrinho, loading, valorTotalEmCentavos, removerDoCarrinho, atualizarItemCarrinho, limparCarrinho } = useCarrinho();
  const { user } = useAuth();
  const [updating, setUpdating] = useState({});

  const formatarPreco = (c) => `R$ ${(c / 100).toFixed(2)}`;
  const chaveItem = (item) => `${item.produtoId}-${item.tamanho}`;

  const handleUpdate = async (item, quantidade) => {
    if (quantidade < 1) { handleRemove(item); return; }
    setUpdating((p) => ({ ...p, [chaveItem(item)]: true }));
    const r = await atualizarItemCarrinho(item.produtoId, quantidade, item.tamanho);
    setUpdating((p) => ({ ...p, [chaveItem(item)]: false }));
    if (!r.success) mostrarAlerta("Erro", r.error);
  };

  const handleRemove = async (item) => {
    const ok = await confirmarAlerta("Remover item", `Tem certeza que deseja remover ${item.nomeProduto} (tam ${item.tamanho})?`);
    if (!ok) return;
    setUpdating((p) => ({ ...p, [chaveItem(item)]: true }));
    const r = await removerDoCarrinho(item.produtoId, item.tamanho);
    setUpdating((p) => ({ ...p, [chaveItem(item)]: false }));
    if (!r.success) mostrarAlerta("Erro", r.error);
  };

  const handleClear = async () => {
    const ok = await confirmarAlerta("Limpar carrinho", "Tem certeza que deseja limpar o carrinho?");
    if (!ok) return;
    const r = await limparCarrinho();
    if (!r.success) mostrarAlerta("Erro", r.error);
  };

  const renderItem = ({ item }) => {
    const isUpdating = updating[chaveItem(item)];
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imagemPrincipalId }} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={2}>{item.nomeProduto}</Text>
          <Text style={styles.meta}>{item.marca} | Tam: {item.tamanho}</Text>
          <Text style={styles.price}>{formatarPreco(item.precoEmCentavos)}</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyButton} onPress={() => handleUpdate(item, item.quantidade - 1)} disabled={isUpdating}>
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qty}>{item.quantidade}</Text>
            <TouchableOpacity style={[styles.qtyButton, item.quantidade >= item.unidadesEmEstoque && styles.qtyDisabled]} onPress={() => handleUpdate(item, item.quantidade + 1)} disabled={isUpdating || item.quantidade >= item.unidadesEmEstoque}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.subtotal}>{formatarPreco(item.subtotalEmCentavos)}</Text>
          <TouchableOpacity onPress={() => handleRemove(item)} disabled={isUpdating} style={styles.removeBtn}>
            {isUpdating ? <ActivityIndicator size="small" color="#FF3B30" /> : <Text style={styles.removeText}>Remover</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Seu carrinho esta vazio</Text>
      <Text style={styles.emptyText}>Adicione alguns produtos para comecar!</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.shopBtnText}>Continuar comprando</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !carrinho) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></TouchableOpacity>
        <Text style={styles.title}>Carrinho</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={carrinho?.itens || []}
        renderItem={renderItem}
        keyExtractor={(i) => `${i.produtoId}-${i.tamanho}`}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
      />

      {carrinho?.itens?.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleClear}><Text style={styles.clearText}>Limpar carrinho</Text></TouchableOpacity>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatarPreco(valorTotalEmCentavos)}</Text>
          </View>
          <TouchableOpacity style={styles.checkout} onPress={() => navigation.navigate("Payment")}>
            <Text style={styles.checkoutText}>Ir para o pagamento</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginTop: 40 },
  back: { color: "#111", fontSize: 15, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", color: "#111" },
  card: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 12 },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#f0f0f0" },
  details: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: "600", color: "#111", marginBottom: 2 },
  meta: { fontSize: 12, color: "#888", marginBottom: 6 },
  price: { fontSize: 14, color: "#666", marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#111", justifyContent: "center", alignItems: "center" },
  qtyDisabled: { backgroundColor: "#ccc" },
  qtyText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  qty: { marginHorizontal: 14, fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center", color: "#111" },
  right: { alignItems: "flex-end", justifyContent: "space-between" },
  subtotal: { fontSize: 16, fontWeight: "bold", color: "#111" },
  removeBtn: { padding: 6 },
  removeText: { color: "#FF3B30", fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8, color: "#111" },
  emptyText: { fontSize: 15, color: "#666", marginBottom: 24, textAlign: "center" },
  shopBtn: { backgroundColor: "#111", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  shopBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  footer: { backgroundColor: "#fff", padding: 16, borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  clearText: { color: "#FF3B30", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { fontSize: 18, fontWeight: "600", color: "#111" },
  totalValue: { fontSize: 24, fontWeight: "bold", color: "#111" },
  checkout: { backgroundColor: "#111", padding: 16, borderRadius: 8, alignItems: "center" },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
