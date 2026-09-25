import { useState, useEffect, useCallback, memo } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal, Platform } from "react-native";
import { useAuth } from "./AuthContext";
import { useCarrinho } from "./CartContext";
import { apiFetch } from "./api";
import { mostrarAlerta } from "./AlertaGlobal";

function parseTamanhos(numeracao) {
  if (!numeracao) return ["Unico"];
  const n = String(numeracao).trim();
  const rangeMatch = n.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const inicio = parseInt(rangeMatch[1]);
    const fim = parseInt(rangeMatch[2]);
    const lista = [];
    for (let i = inicio; i <= fim; i++) lista.push(String(i));
    return lista;
  }
  if (n.includes("/")) return n.split("/").map(s => s.trim()).filter(Boolean);
  if (n.includes(",")) return n.split(",").map(s => s.trim()).filter(Boolean);
  return [n];
}

const Header = memo(({ logout, quantidadeItensCarrinho, isAdmin, search, setSearch, onSearch, navigation }) => (
  <View style={styles.header}>
    <View style={styles.headerButtons}>
      <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("Orders")}>
        <Text style={styles.ordersButtonText}>Pedidos</Text>
      </TouchableOpacity>
      {isAdmin && (
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("AdminProducts")}>
          <Text style={styles.ordersButtonText}>Gerenciar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate("Cart")}>
        <Text style={styles.cartButtonText}>Carrinho</Text>
        {quantidadeItensCarrinho > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{quantidadeItensCarrinho}</Text></View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.searchRow}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nome, marca ou numeracao"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
        <Text style={styles.searchButtonText}>Buscar</Text>
      </TouchableOpacity>
    </View>
  </View>
));

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [addingToCart, setAddingToCart] = useState({});
  const [modalProduto, setModalProduto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const { logout, user } = useAuth();
  const { adicionarAoCarrinho, quantidadeItensCarrinho } = useCarrinho();

  const fetchProducts = useCallback(async (query) => {
    try {
      setLoading(true);
      const url = query ? `/api/products?q=${encodeURIComponent(query)}` : "/api/products";
      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) setProducts(data.data.products || []);
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts("");
  }, [fetchProducts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchProducts(search);
    });
    return unsubscribe;
  }, [navigation, search, fetchProducts]);

  const handleSearch = useCallback(() => fetchProducts(search), [fetchProducts, search]);

  const formatarPreco = (centavos) => `R$ ${(centavos / 100).toFixed(2)}`;

  const abrirModal = (produto) => {
    setModalProduto(produto);
    setTamanhoSelecionado(null);
  };

  const fecharModal = () => {
    setModalProduto(null);
    setTamanhoSelecionado(null);
  };

  const confirmarAdicao = async () => {
    if (!modalProduto || !tamanhoSelecionado) {
      mostrarAlerta("Atencao", "Escolha um tamanho");
      return;
    }
    const produtoId = modalProduto.id;
    setAddingToCart((p) => ({ ...p, [produtoId]: true }));
    const result = await adicionarAoCarrinho(produtoId, 1, tamanhoSelecionado);
    setAddingToCart((p) => ({ ...p, [produtoId]: false }));
    fecharModal();
    if (result.success) {
      mostrarAlerta("Sucesso", `Produto (tam. ${tamanhoSelecionado}) adicionado ao carrinho!`);
    } else {
      mostrarAlerta("Erro", result.error);
    }
  };

  const isAdmin = user?.tipo === "admin" || user?.tipo === "lojista" || user?.tipo === "admin_geral";

  const renderProduct = ({ item }) => {
    const isOut = item.unidades_em_estoque === 0;
    const isAdding = addingToCart[item.id];
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imagem_principal_id }} style={styles.image} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.brandLabel}>{item.marca}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.meta}>Tam: {item.numeracao} | Cor: {item.cor}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.price}>{formatarPreco(item.preco_em_centavos)}</Text>
            <Text style={styles.stock}>{isOut ? "Esgotado" : `${item.unidades_em_estoque} em estoque`}</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, (isAdding || isOut) && styles.addButtonDisabled]}
            onPress={() => abrirModal(item)}
            disabled={isAdding || isOut}
          >
            {isAdding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addButtonText}>{isOut ? "Esgotado" : "Adicionar ao carrinho"}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && products.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>;
  }

  const tamanhosDisponiveis = modalProduto ? parseTamanhos(modalProduto.numeracao) : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <Header
            logout={logout}
            quantidadeItensCarrinho={quantidadeItensCarrinho}
            isAdmin={isAdmin}
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            navigation={navigation}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(search); }} />}
      />

      <Modal visible={!!modalProduto} animationType="fade" transparent onRequestClose={fecharModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Escolha o tamanho</Text>
            {modalProduto && (
              <Text style={styles.modalProdutoNome} numberOfLines={2}>{modalProduto.nome}</Text>
            )}
            <View style={styles.chipsWrap}>
              {tamanhosDisponiveis.map((t) => {
                const selecionado = tamanhoSelecionado === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, selecionado && styles.chipSelecionado]}
                    onPress={() => setTamanhoSelecionado(t)}
                  >
                    <Text style={[styles.chipText, selecionado && styles.chipTextSelecionado]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelar} onPress={fecharModal}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmar, !tamanhoSelecionado && styles.modalConfirmarDisabled]}
                onPress={confirmarAdicao}
                disabled={!tamanhoSelecionado}
              >
                <Text style={styles.modalConfirmarText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#fff", padding: 16, marginTop: 40, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  headerButtons: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  ordersButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#111", minWidth: 90, alignItems: "center" },
  ordersButtonText: { color: "#111", fontSize: 13, fontWeight: "700" },
  cartButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: "#111", position: "relative", minWidth: 110, alignItems: "center" },
  cartButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  badge: { position: "absolute", top: -6, right: -6, backgroundColor: "#FF3B30", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  logoutButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#111", minWidth: 80, alignItems: "center" },
  logoutText: { color: "#111", fontSize: 13, fontWeight: "700" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: "#fafafa" },
  searchButton: { backgroundColor: "#111", paddingHorizontal: 16, justifyContent: "center", borderRadius: 8 },
  searchButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  listContent: { paddingBottom: 16 },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 12, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  image: { width: "100%", height: 220, backgroundColor: "#f0f0f0" },
  info: { padding: 16 },
  brandLabel: { fontSize: 12, color: "#888", textTransform: "uppercase", fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  name: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
  meta: { fontSize: 13, color: "#666", marginBottom: 10 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  price: { fontSize: 22, fontWeight: "bold", color: "#111" },
  stock: { fontSize: 12, color: "#666" },
  addButton: { backgroundColor: "#111", padding: 14, borderRadius: 8, alignItems: "center" },
  addButtonDisabled: { backgroundColor: "#ccc" },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 8, textAlign: "center" },
  modalProdutoNome: { fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: "#ccc", backgroundColor: "#fff", minWidth: 50, alignItems: "center" },
  chipSelecionado: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#333" },
  chipTextSelecionado: { color: "#fff" },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelar: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1.5, borderColor: "#ccc", alignItems: "center" },
  modalCancelarText: { color: "#666", fontSize: 15, fontWeight: "600" },
  modalConfirmar: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: "#111", alignItems: "center" },
  modalConfirmarDisabled: { backgroundColor: "#ccc" },
  modalConfirmarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
