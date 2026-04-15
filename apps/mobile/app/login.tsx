import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("入力エラー", "メールアドレスとパスワードを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert(
        "ログインエラー",
        error instanceof Error
          ? error.message
          : "ログインに失敗しました。再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <ThemedText type="title" style={styles.title}>
          tascal
        </ThemedText>

        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
            },
          ]}
          placeholder="メールアドレス"
          placeholderTextColor={Colors[colorScheme].icon}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
            },
          ]}
          placeholder="パスワード"
          placeholderTextColor={Colors[colorScheme].icon}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        <Pressable
          style={[
            styles.button,
            { backgroundColor: Colors[colorScheme].tint },
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>ログイン</ThemedText>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
