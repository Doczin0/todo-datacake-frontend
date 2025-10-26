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

const ForgotPasswordScreen = ({ navigation }) => {
  const { requestPasswordReset } = useContext(AuthContext);
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      pushNotification({ type: "warning", message: "Informe o e-mail associado à conta." });
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      pushNotification({
        type: "success",
        message: "Enviamos o token de redefinição. Confira seu e-mail (ou o console do backend)."
      });
    } catch (err) {
      pushNotification({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footerLinks}>
      <Text style={[styles.footerText, { color: theme.palette.textMuted }]}>Já tenho o token?</Text>
      <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")}>
        <Text style={[styles.footerLink, { color: theme.palette.accentSoft }]}>Redefinir agora</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      accent="Recupere o acesso"
      title="Vamos reativar sua produtividade"
      subtitle="Utilize o e-mail cadastrado para gerar um novo token de redefinição."
      footer={footer}
    >
      <LoadingOverlay visible={loading} />

      <TextField
        label="E-mail cadastrado"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="voce@email.com"
      />

      <PrimaryButton
        title="Enviar token"
        onPress={handleSubmit}
        loading={loading}
        icon={<Ionicons name="mail-outline" size={18} color={theme.palette.textPrimary} />}
      />

      <TouchableOpacity style={styles.backLogin} onPress={() => navigation.navigate("Login")}>
        <Text style={[styles.backText, { color: theme.palette.textSecondary }]}>Voltar ao login</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  backLogin: {
    alignItems: "center",
    marginTop: 8
  },
  backText: {
    fontWeight: "500"
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

export default ForgotPasswordScreen;
