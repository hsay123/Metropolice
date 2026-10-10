import { LoginPanel } from "@/components/auth/login-panel";

/**
 * /login — Privy sign-in (email or wallet) and the role landing (AGENTS.md A5).
 * The panel decides between the real Privy flow and the mock role picker.
 */
export default function LoginPage() {
  return <LoginPanel />;
}
