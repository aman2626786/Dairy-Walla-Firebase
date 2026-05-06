import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Milk, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { useToast } from "../../components/ui/Toast";
import type { Role } from "../../types";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, resendConfirmation } = useAuthStore();
  const { fetchDistributorProfile, fetchShopkeeperProfile, fetchAllDistributors, fetchConnections, fetchProducts, fetchOrders, fetchNotifications, fetchDeliveryGroups } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) { show("Valid email daalo", "error"); return; }
    if (!password) { show("Password daalo", "error"); return; }
    setLoading(true);
    try {
      type LoginResult = { error?: string; user?: { id: string; role: Role }; needsProfile?: boolean };
      const loginResult = await Promise.race([
        signIn(normalizedEmail, password, role),
        new Promise<LoginResult>((resolve) =>
          setTimeout(() => resolve({ error: "Login request timeout. Internet check karo aur dobara try karo." }), 15000)
        ),
      ]) as LoginResult;

      if (loginResult.error) {
        if (loginResult.error.toLowerCase().includes("invalid login credentials")) {
          show("Email ya password galat hai. Email lowercase/without spaces try karo.", "error");
        } else if (loginResult.error.toLowerCase().includes("email not confirmed")) {
          const resend = await resendConfirmation(normalizedEmail);
          if (resend.error) {
            show("Email verify nahi hui. Inbox/spam check karo.", "error");
          } else {
            show("Email verify nahi hui. Naya confirmation link bhej diya hai.", "error");
          }
        } else {
          show(loginResult.error, "error");
        }
        return;
      }
      if (loginResult.needsProfile) {
        navigate(`/confirm?role=${role}`);
        return;
      }
      if (loginResult.user) {
        const u = loginResult.user;
        navigate(u.role === "distributor" ? "/distributor" : "/shop");
        try {
          if (u.role === "distributor") {
            const dp = await fetchDistributorProfile(u.id);
            if (dp) {
              await Promise.all([
                fetchProducts(dp.id),
                fetchConnections(u.id, "distributor"),
                fetchOrders(u.id, "distributor"),
                fetchDeliveryGroups(dp.id),
              ]);
            }
          } else {
            await fetchShopkeeperProfile(u.id);
            await fetchAllDistributors();
            await Promise.all([
              fetchConnections(u.id, "shopkeeper"),
              fetchOrders(u.id, "shopkeeper"),
            ]);
          }
          await fetchNotifications(u.id);
        } catch { /* non-critical */ }
      }
    } catch {
      show("Login failed. Dobara try karo.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-lg mb-3">
            <Milk className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DairyWalla</h1>
          <p className="text-gray-500 text-sm mt-1">Smart dairy ordering platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Apne account mein sign in karo</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Login As</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole("shopkeeper")}
                  className={`py-2.5 rounded-xl border text-sm font-medium ${role === "shopkeeper" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"}`}>
                  Shopkeeper
                </button>
                <button type="button" onClick={() => setRole("distributor")}
                  className={`py-2.5 rounded-xl border text-sm font-medium ${role === "distributor" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"}`}>
                  Distributor
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="aap@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Apna password daalo"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Account nahi hai?{" "}
          <Link to="/signup" className="text-brand-600 font-semibold hover:underline">Sign Up karo</Link>
        </p>
      </div>
    </div>
  );
}
