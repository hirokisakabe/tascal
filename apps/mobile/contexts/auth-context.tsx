import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";

const TOKEN_KEY = "auth_token";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthErrorBody = {
  code?: string;
};

export function getSignInErrorMessage(
  status: number,
  body: AuthErrorBody | null,
): string {
  if (body?.code === "EMAIL_NOT_VERIFIED") {
    return "メールアドレスの確認が必要です。確認メールを再送しました。メール内のリンクを Web で開いてから、もう一度ログインしてください。";
  }
  if (body?.code === "EMAIL_DELIVERY_UNAVAILABLE") {
    return "確認メールを送信できませんでした。時間をおいて、同じ資格情報で再度ログインしてください。";
  }
  if (status === 401) {
    return "メールアドレスまたはパスワードが正しくありません";
  }
  return "ログインに失敗しました。再度お試しください。";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { user: User };
        setUser(data.user);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      // ネットワークエラー時はトークンを保持し、次回再試行
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let body: AuthErrorBody | null = null;
      try {
        body = (await res.json()) as AuthErrorBody;
      } catch {
        // JSON でない error response は status のみで安全な案内へ変換する
      }
      throw new Error(getSignInErrorMessage(res.status, body));
    }

    // Bearer トークンは set-auth-token ヘッダーで返される
    const token = res.headers.get("set-auth-token");
    if (!token) {
      throw new Error("認証トークンの取得に失敗しました");
    }

    const data = (await res.json()) as { user: User };

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // サーバーへの通知が失敗してもローカルのトークンは削除する
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
