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

const RegisterScreen = ({ navigation }) => {
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({
    username: "",
    email: "",
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
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      pushNotification({ type: "warning", message: "Complete todos os campos para continuar." });
      return;
    }
    if (passwordMismatch) {
      pushNotification({ type: "error", message: "As senhas não conferem. Revise os campos." });
      return;
    }
    setLoading(true);
    try {
      const { email, username } = await register(form);
      pushNotification({
        type: "success",
        message: "Cadastro realizado! Verifique seu e-mail para validar."
      });
      navigation.navigate("VerifyEmail", { email, username });
    } catch (err) {
      pushNotification({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footerLinks}>
      <Text style={[styles.footerText, { color: theme.palette.textMuted }]}>Já possui conta?</Text>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={[styles.footerLink, { color: theme.palette.accentSoft }]}>Faça login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      accent="Cadastro futurista"
      title="Construa sua experiência DataCake"
      subtitle="Usuário e e-mail são exclusivos. Senhas fortes liberam funcionalidades avançadas."
      footer={footer}
    >
      <LoadingOverlay visible={loading} />
      <TextField
        label="Usuário"
        value={form.username}
        onChangeText={updateField("username")}
        placeholder="ex: maria.souza"
        autoCapitalize="none"
      />
      <Text style={[styles.helper, { color: theme.palette.textMuted }]}>
        Use 3-30 caracteres. Não reutilize usuários existentes.
      </Text>

      <TextField
        label="E-mail"
        value={form.email}
        onChangeText={updateField("email")}
        keyboardType="email-address"
        placeholder="voce@email.com"
        autoCapitalize="none"
      />
      <Text style={[styles.helper, { color: theme.palette.textMuted }]}>
        Cada e-mail é único. Validaremos em instantes.
      </Text>

      <TextField
        label="Senha"
        value={form.password}
        onChangeText={updateField("password")}
        secureTextEntry
        placeholder="senha forte"
      />

      <PasswordStrength password={form.password} />

      <TextField
        label="Confirmar senha"
        value={form.confirmPassword}
        onChangeText={updateField("confirmPassword")}
        secureTextEntry
        placeholder="repita a senha"
        error={passwordMismatch ? "As senhas precisam ser idênticas." : undefined}
      />

      <PrimaryButton
        title="Cadastrar"
        onPress={handleSubmit}
        loading={loading}
        icon={<Ionicons name="planet-outline" size={18} color={theme.palette.textPrimary} />}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  helper: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 14
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

export default RegisterScreen;
