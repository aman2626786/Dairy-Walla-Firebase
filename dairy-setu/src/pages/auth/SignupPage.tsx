import { useState } from "react";
import { Link } from "react-router-dom";
import { Milk, Lock, Mail, Eye, EyeOff, Phone, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/ui/Toast";
import type { Role } from "../../types";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { signUp } = useAuthStore();
  const { show } = useToast();

  const handleSubmit = async () => {
    if (!email.includes("@")) { show("Valid email daalo", "error"); return; }
    if (phone.length !== 10) { show("10 digit ka phone number daalo", "error"); return; }
    if (password.length < 6) { show("Password kam se kam 6 characters ka hona chahiye", "error"); return; }
    if (password !== confirmPassword) { show("Passwords match nahi kar rahe", "error"); return; }

    setLoading(true);
    const result = await signUp(email.trim().toLowerCase(), password, role, phone);
    setLoading(false);

    if (result.error) { show(result.error, "error"); return; }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-lg mb-3">
            <Milk className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DairyWalla</h1>
          <p className="text-gray-500 text-sm mt-1">Naya account banao</p>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Check Karo!</h2>
            <p className="text-sm text-gray-500 mb-2">Confirmation link bheja gaya:</p>
            <p className="text-sm font-semibold text-brand-600 mb-4">{email}</p>
            <p className="text-xs text-gray-500 mb-4">Selected role: <span className="font-semibold capitalize">{role}</span></p>
            <div className="bg-blue-50 rounded-xl p-3 mb-5 text-left">
              <p className="text-xs text-blue-700 font-medium mb-1">Aage kya karna hai:</p>
              <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                <li>Email inbox (ya spam) mein jaao</li>
                <li>"Confirm your email" link pe click karo</li>
                <li>Link click karne ke baad apna role aur profile setup karo</li>
              </ol>
            </div>
            <p className="text-xs text-gray-400">Spam folder bhi check karo agar mail nahi aaya</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Account banao</h2>
            <p className="text-sm text-gray-500 mb-6">Details bharo, phir email confirm karo</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Type *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="aap@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">+91</span>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPass ? "text" : "password"} className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPass ? "text" : "password"} className="w-full pl-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Password dobara daalo" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                </div>
                {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords match nahi kar rahe</p>}
                {confirmPassword && password === confirmPassword && password.length >= 6 && <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>}
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2">
                {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
