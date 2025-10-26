import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import LoadingOverlay from "../components/LoadingOverlay";
import AuthLayout from "../components/AuthLayout";
import { AuthContext } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const VerifyEmailScreen = ({ navigation, route }) => {
  const { email: emailParam } = route.params || {};
  const { verifyEmail, resendCode } = useContext(AuthContext);
  const { theme } = useThemeMode();
  const { pushNotification } = useNotifications();
  const [email, setEmail] = useState(emailParam || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);

  useEffect(() => {
    if (!verificationDone) {
      return undefined;
    }
    const timeout = globalThis.setTimeout(() => navigation.replace("Login"), 1500);
    return () => globalThis.clearTimeout(timeout);
  }, [verificationDone, navigation]);

  const handleVerify = async () => {
    if (!email || !code) {
      pushNotification({ type: "warning", message: "Informe o e-mail e o código recebido." });
      return;
    }
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      pushNotification({ type: "success", message: "Conta verificada! Redirecionando ao login." });
      setCode("");
      setVerificationDone(true);
    } catch (err) {
      pushNotification({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      pushNotification({ type: "warning", message: "Informe seu e-mail para reenviar o código." });
      return;
    }
    setResending(true);
    try {
      await resendCode({ email });
      pushNotification({ type: "info", message: "Novo código enviado! Ele expira em 2 minutos." });
    } catch (err) {
      pushNotification({ type: "error", message: err.message });
    } finally {
      setResending(false);
    }
  };

  const footer = (
    <View style={styles.footerLinks}>
      <Text style={[styles.footerText, { color: theme.palette.textMuted }]}>Pronto?</Text>
      <TouchableOpacity onPress={() => navigation.replace("Login")}>
        <Text style={[styles.footerLink, { color: theme.palette.accentSoft }]}>Voltar ao login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthLayout
      accent="Quase lá"
      title="Valide seu e-mail"
      subtitle="Confirme o código de 6 dígitos e libere todas as funcionalidades."
      footer={footer}
    >
      <LoadingOverlay visible={loading || resending} />

      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="voce@email.com"
      />
      <TextField
        label="Código de verificação"
        value={code}
        onChangeText={setCode}
        placeholder="6 dígitos"
        keyboardType="number-pad"
      />

      <PrimaryButton
        title="Validar código"
        onPress={handleVerify}
        loading={loading}
        icon={<Ionicons name="key-outline" size={18} color={theme.palette.textPrimary} />}
      />

      <PrimaryButton
        title="Reenviar código"
        onPress={handleResend}
        loading={resending}
        variant="ghost"
        icon={<Ionicons name="refresh-outline" size={18} color={theme.palette.textSecondary} />}
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

export default VerifyEmailScreen;
