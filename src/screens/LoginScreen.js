import React, { useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import LoadingOverlay from "../components/LoadingOverlay";
import AuthLayout from "../components/AuthLayout";
import { AuthContext } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const LoginScreen = ({ navigation }) => {
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!identifier || !password) {
      pushNotification({
        type: "warning",
        message: "Informe usuário/e-mail e senha para acessar."
      });
      return;
    }
    setLoading(true);
    try {
      await login({ identifier, password });
      pushNotification({
        type: "success",
        message: "Login realizado! Carregando suas tarefas."
      });
    } catch (err) {
      pushNotification({
        type: "error",
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footerLinks}>
      <Text style={[styles.footerText, { color: theme.palette.textMuted }]}>Ainda não tem uma conta?</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={[styles.footerLink, { color: theme.palette.accentSoft }]}>Criar agora</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      accent="Seja bem-vindo"
      title="Organize seu dia com estilo"
      subtitle="Controle suas metas com uma experiência futurista e produtiva."
      footer={footer}
    >
      <LoadingOverlay visible={loading} />

      <TextField
        label="Usuário ou e-mail"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="ex: voce@email.com"
        autoCapitalize="none"
      />

      <TextField
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="********"
        secureTextEntry
      />

      <PrimaryButton
        title="Entrar"
        onPress={handleSubmit}
        loading={loading}
        icon={<Ionicons name="sparkles-outline" size={18} color={theme.palette.textPrimary} />}
      />

      <TouchableOpacity style={styles.recover} onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={[styles.recoverText, { color: theme.palette.accent }]}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  recover: {
    alignItems: "center",
    marginBottom: 4
  },
  recoverText: {
    fontWeight: "600"
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center"
  },
  footerText: {
    marginRight: 6
  },
  footerLink: {
    fontWeight: "700"
  }
});

export default LoginScreen;
