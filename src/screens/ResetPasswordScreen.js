import React, { useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import LoadingOverlay from "../components/LoadingOverlay";
import PasswordStrength from "../components/PasswordStrength";
import AuthLayout from "../components/AuthLayout";
import { AuthContext } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const ResetPasswordScreen = ({ navigation }) => {
  const { confirmPasswordReset } = useContext(AuthContext);
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();
  const [form, setForm] = useState({
    email: "",
    token: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const passwordMismatch = useMemo(
    () => form.password && form.confirmPassword && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword]
  );

  const handleSubmit = async () => {
    if (!form.email || !form.token || !form.password || !form.confirmPassword) {
      pushNotification({ type: "warning", message: "Preencha e-mail, token e senha nova." });
      return;
    }
    if (passwordMismatch) {
      pushNotification({ type: "error", message: "As senhas inseridas não são iguais." });
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ email: form.email, code: form.token, password: form.password });
      pushNotification({
        type: "success",
        message: "Senha redefinida! Vamos redirecionar você para o login."
      });
      setForm((prev) => ({ ...prev, token: "", password: "", confirmPassword: "" }));
      globalThis.setTimeout(() => navigation.replace("Login"), 1500);
    } catch (err) {
      pushNotification({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footerLinks}>
      <Text style={[styles.footerText, { color: theme.palette.textMuted }]}>Pronto para voltar?</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={[styles.footerLink, { color: theme.palette.accentSoft }]}>Ir para login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      accent="Token em mãos"
      title="Defina sua nova senha"
      subtitle="Utilize o token recebido por e-mail e escolha uma senha forte para proteger seus dados."
      footer={footer}
    >
      <LoadingOverlay visible={loading} />
      <TextField
        label="E-mail"
        value={form.email}
        onChangeText={updateField("email")}
        keyboardType="email-address"
        placeholder="voce@email.com"
      />
      <TextField
        label="Token de redefinição"
        value={form.token}
        onChangeText={updateField("token")}
        placeholder="Código de 6 dígitos"
        keyboardType="number-pad"
      />
      <TextField
        label="Nova senha"
        value={form.password}
        onChangeText={updateField("password")}
        secureTextEntry
        placeholder="Senha com símbolos, números e letras"
      />
      <PasswordStrength password={form.password} />
      <TextField
        label="Confirmar nova senha"
        value={form.confirmPassword}
        onChangeText={updateField("confirmPassword")}
        secureTextEntry
        placeholder="Repita a nova senha"
        error={passwordMismatch ? "As senhas precisam ser idênticas." : undefined}
      />

      <PrimaryButton
        title="Atualizar senha"
        onPress={handleSubmit}
        loading={loading}
        icon={<Ionicons name="shield-checkmark-outline" size={18} color={theme.palette.textPrimary} />}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
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

export default ResetPasswordScreen;
