import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const { signIn } = useAuth();
  return <LoginForm onSignIn={signIn} />;
}
