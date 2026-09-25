import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, Image } from "react-native";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";
import { mostrarAlerta, confirmarAlerta } from "./AlertaGlobal";

const produtoVazio = {
  nome: "",
  marca: "",
  descricao: "",
  numeracao: "",
  cor: "",
  precoReais: "",
  unidadesEmEstoque: "",
  imagemPrincipalId: "",
};

export default function AdminProductsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(produtoVazio);
  const [salvando, setSalvando] = useState(false);

  const isAdminGeral = user?.tipo === "admin_geral";

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/products?limit=100");
      const data = await res.json();
      if (data.success) setProdutos(data.data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm(produtoVazio);
    setModalAberto(true);
  };

  const abrirEdicao = (produto) => {
    setEditando(produto);
    setForm({
      nome: produto.nome,
      marca: produto.marca || "",
      descricao: produto.descricao || "",
      numeracao: produto.numeracao || "",
      cor: produto.cor || "",
      precoReais: (produto.preco_em_centavos / 100).toFixed(2),
      unidadesEmEstoque: String(produto.unidades_em_estoque),
      imagemPrincipalId: produto.imagem_principal_id || "",
    });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.precoReais || form.unidadesEmEstoque === "") {
      mostrarAlerta("Atencao", "Preencha nome, preco e estoque");
      return;
    }
    const precoEmCentavos = Math.round(parseFloat(form.precoReais.replace(",", ".")) * 100);
    if (isNaN(precoEmCentavos) || precoEmCentavos <= 0) {
      mostrarAlerta("Atencao", "Preco invalido");
      return;
    }
    setSalvando(true);
    try {
      const body = {
        nome: form.nome,
        marca: form.marca,
        descricao: form.descricao,
        numeracao: form.numeracao,
        cor: form.cor,
        precoEmCentavos,
        unidadesEmEstoque: parseInt(form.unidadesEmEstoque),
        imagemPrincipalId: form.imagemPrincipalId,
      };
      const url = editando ? `/api/products/${editando.id}` : "/api/products";
      const method = editando ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-user-id": String(user.id) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao salvar");
      setModalAberto(false);
      await carregar();
      mostrarAlerta("Sucesso", editando ? "Produto atualizado" : "Produto cadastrado");
    } catch (e) {
      mostrarAlerta("Erro", e.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (produto) => {
    const ok = await confirmarAlerta("Excluir produto", `Tem certeza que deseja excluir ${produto.nome}?`);
    if (!ok) return;
    try {
      const res = await apiFetch(`/api/products/${produto.id}`, {
        method: "DELETE",
        headers: { "x-user-id": String(user.id) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error?.message || "Falha ao excluir");
      await carregar();
      mostrarAlerta("Sucesso", "Produto excluido");
    } catch (e) {
      mostrarAlerta("Erro", e.message);
    }
  };

  const renderProduto = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagem_principal_id }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={styles.marca}>{item.marca}</Text>
        <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.meta}>Tam: {item.numeracao} | Cor: {item.cor}</Text>
        <Text style={styles.preco}>R$ {(item.preco_em_centavos / 100).toFixed(2)}</Text>
        <Text style={styles.estoque}>Estoque: {item.unidades_em_estoque}</Text>
      </View>
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.editarBtn} onPress={() => abrirEdicao(item)}>
          <Text style={styles.editarText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.excluirBtn} onPress={() => excluir(item)}>
          <Text style={styles.excluirText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isAdminGeral ? (
          <TouchableOpacity onPress={logout}>
            <Text style={styles.back}>Sair</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>Voltar</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Produtos</Text>
        {isAdminGeral ? (
          <View style={styles.headerAcoes}>
            <TouchableOpacity onPress={() => navigation.navigate("AdminOrders")}>
              <Text style={styles.back}>Pedidos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("AdminUsers")}>
              <Text style={styles.back}>Usuarios</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <TouchableOpacity style={styles.novoBtn} onPress={abrirNovo}>
        <Text style={styles.novoBtnText}>+ Novo Produto</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>
      ) : (
        <FlatList
          data={produtos}
          renderItem={renderProduto}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <Modal visible={modalAberto} animationType="slide" onRequestClose={() => setModalAberto(false)}>
        <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitle}>{editando ? "Editar Produto" : "Novo Produto"}</Text>

          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={form.nome} onChangeText={(t) => setForm({ ...form, nome: t })} />

          <Text style={styles.label}>Marca</Text>
          <TextInput style={styles.input} value={form.marca} onChangeText={(t) => setForm({ ...form, marca: t })} />

          <Text style={styles.label}>Descricao</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline value={form.descricao} onChangeText={(t) => setForm({ ...form, descricao: t })} />

          <Text style={styles.label}>Tamanhos</Text>
          <TextInput style={styles.input} value={form.numeracao} onChangeText={(t) => setForm({ ...form, numeracao: t })} placeholder="Ex: 38-44 ou P/M/G/GG" />

          <Text style={styles.label}>Cor</Text>
          <TextInput style={styles.input} value={form.cor} onChangeText={(t) => setForm({ ...form, cor: t })} />

          <Text style={styles.label}>Preco em Reais *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.precoReais} onChangeText={(t) => setForm({ ...form, precoReais: t })} placeholder="Ex: 199.90" />

          <Text style={styles.label}>Estoque *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={form.unidadesEmEstoque} onChangeText={(t) => setForm({ ...form, unidadesEmEstoque: t })} placeholder="Ex: 20" />

          <Text style={styles.label}>URL da Imagem</Text>
          <TextInput style={styles.input} value={form.imagemPrincipalId} onChangeText={(t) => setForm({ ...form, imagemPrincipalId: t })} placeholder="https://..." autoCapitalize="none" />

          <TouchableOpacity style={[styles.salvarBtn, salvando && styles.disabled]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.salvarText}>Salvar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalAberto(false)}>
            <Text style={styles.cancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#fff", marginTop: 40, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  back: { color: "#111", fontSize: 14, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "bold", color: "#111" },
  headerAcoes: { flexDirection: "row", gap: 16 },
  novoBtn: { backgroundColor: "#111", margin: 16, padding: 14, borderRadius: 8, alignItems: "center" },
  novoBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10 },
  thumb: { width: 70, height: 70, borderRadius: 8, backgroundColor: "#eee" },
  info: { flex: 1, marginLeft: 10 },
  marca: { fontSize: 11, color: "#888", fontWeight: "700", textTransform: "uppercase" },
  nome: { fontSize: 15, fontWeight: "700", color: "#111" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  preco: { fontSize: 15, fontWeight: "700", color: "#111", marginTop: 4 },
  estoque: { fontSize: 12, color: "#444" },
  acoes: { justifyContent: "space-between" },
  editarBtn: { backgroundColor: "#111", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginBottom: 4 },
  editarText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  excluirBtn: { backgroundColor: "#FF3B30", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  excluirText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  modal: { flex: 1, backgroundColor: "#fff" },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, marginTop: 20, color: "#111" },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: "#fafafa" },
  salvarBtn: { backgroundColor: "#111", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 24 },
  disabled: { opacity: 0.6 },
  salvarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelarBtn: { padding: 16, alignItems: "center", marginTop: 8, marginBottom: 40 },
  cancelarText: { color: "#666", fontSize: 15 },
});
