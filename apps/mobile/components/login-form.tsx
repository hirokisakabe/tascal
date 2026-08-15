import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type LoginFormProps = {
  onSignIn: (email: string, password: string) => Promise<void>;
  initialError?: string;
};

export function LoginForm({ onSignIn, initialError = "" }: LoginFormProps) {
  const colorScheme = useColorScheme() ?? "light";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(error);
    }
  }, [error]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSignIn(email, password);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
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
              borderColor: Colors[colorScheme].controlBorder,
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
              borderColor: Colors[colorScheme].controlBorder,
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

        {error ? (
          <View
            style={[styles.error, { borderColor: Colors[colorScheme].danger }]}
            accessibilityRole="alert"
          >
            <ThemedText
              style={[styles.errorText, { color: Colors[colorScheme].danger }]}
            >
              {error}
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.button,
            { backgroundColor: Colors[colorScheme].tintBackground },
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors[colorScheme].onTint} />
          ) : (
            <ThemedText
              style={[styles.buttonText, { color: Colors[colorScheme].onTint }]}
            >
              ログイン
            </ThemedText>
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
  error: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: "600",
  },
});
