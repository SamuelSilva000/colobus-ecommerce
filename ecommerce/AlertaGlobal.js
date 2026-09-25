import { createContext, useState, useContext, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

const AlertaContext = createContext(null);

let _handler = null;

export function mostrarAlerta(titulo, mensagem) {
  if (_handler) _handler.mostrar(titulo, mensagem);
  else if (typeof window !== "undefined") window.alert(`${titulo}\n\n${mensagem}`);
}

export function confirmarAlerta(titulo, mensagem) {
  if (_handler) return _handler.confirmar(titulo, mensagem);
  if (typeof window !== "undefined") return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return Promise.resolve(false);
}

export function AlertaProvider({ children }) {
  const [visivel, setVisivel] = useState(false);
  const [config, setConfig] = useState({ titulo: "", mensagem: "", tipo: "alerta", onConfirm: null, onCancel: null });
  const [resolver, setResolver] = useState(null);

  const mostrar = (titulo, mensagem) => {
    setConfig({ titulo, mensagem, tipo: "alerta", onConfirm: null, onCancel: null });
    setVisivel(true);
  };

  const confirmar = (titulo, mensagem) => {
    return new Promise((resolve) => {
      setResolver(() => resolve);
      setConfig({
        titulo,
        mensagem,
        tipo: "confirmacao",
        onConfirm: () => {
          setVisivel(false);
          resolve(true);
        },
        onCancel: () => {
          setVisivel(false);
          resolve(false);
        },
      });
      setVisivel(true);
    });
  };

  useEffect(() => {
    _handler = { mostrar, confirmar };
    return () => { _handler = null; };
  }, []);

  const handleOk = () => {
    if (config.tipo === "confirmacao" && config.onConfirm) {
      config.onConfirm();
    } else {
      setVisivel(false);
    }
  };

  const handleCancelar = () => {
    if (config.tipo === "confirmacao" && config.onCancel) {
      config.onCancel();
    } else {
      setVisivel(false);
    }
  };

  return (
    <AlertaContext.Provider value={{ mostrar, confirmar }}>
      {children}
      <Modal visible={visivel} transparent animationType="fade" onRequestClose={handleCancelar}>
        <View style={styles.overlay}>
          <View style={styles.box}>
            <Text style={styles.titulo}>{config.titulo}</Text>
            <Text style={styles.mensagem}>{config.mensagem}</Text>
            <View style={styles.acoes}>
              {config.tipo === "confirmacao" && (
                <TouchableOpacity style={styles.btnCancelar} onPress={handleCancelar}>
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnOk} onPress={handleOk}>
                <Text style={styles.btnOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AlertaContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  box: { backgroundColor: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 400 },
  titulo: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 10 },
  mensagem: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 22 },
  acoes: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  btnCancelar: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
  btnCancelarText: { color: "#666", fontSize: 14, fontWeight: "600" },
  btnOk: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 8, backgroundColor: "#111" },
  btnOkText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
