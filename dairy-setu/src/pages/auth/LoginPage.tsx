import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Milk } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/ui/Toast";
import type { Role } from "../../types";

type Step = "phone" | "otp" | "role";

export function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const { login } = useAuthStore();
  const { show } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (phone.length !== 10) { show("10 digit ka phone number daalo", "error"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    const knownPhones = ["9876543210","9876543211","9876543212","9876543213","9876543214"];
    setIsNewUser(!knownPhones.includes(phone));
    setStep("otp");
    show("OTP bheja gaya (demo mode)", "info");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { show("6 digit ka OTP daalo", "error"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);
    if (isNewUser) { setStep("role"); return; }
    const user = login(phone);
    if (user) { show("Welcome back, " + user.name + "!"); navigate(user.role === "distributor" ? "/distributor" : "/shop"); }
  };

  const handleRoleSelect = () => {
    const user = login(phone, role);
    if (user) { show("DairySetu mein aapka swagat hai!"); navigate(role === "distributor" ? "/distributor" : "/shop"); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-lg mb-4">
            <Milk className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DairySetu</h1>
          <p className="text-gray-500 text-sm mt-1">Smart dairy ordering for everyone</p>
        </div>
        <div className="card p-6">
          {step === "phone" && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
              <p className="text-sm text-gray-500 mb-5">Apna mobile number daalo</p>
              <div className="mb-4">
                <label className="label">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium">+91</div>
                  <input type="tel" className="input flex-1" placeholder="9876543210" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                    onKeyDown={e => e.key === "Enter" && handleSendOtp()} maxLength={10} autoFocus />
                </div>
              </div>
              <button className="btn-primary w-full" onClick={handleSendOtp} disabled={loading || phone.length !== 10}>
                {loading ? "Bhej raha hai..." : <> OTP Bhejo <ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-1">Demo accounts</p>
                <p className="text-xs text-blue-600">Distributor: <span className="font-mono font-semibold">9876543210</span></p>
                <p className="text-xs text-blue-600">Shopkeeper: <span className="font-mono font-semibold">9876543211</span></p>
                <p className="text-xs text-blue-500 mt-1">Koi bhi 6-digit OTP kaam karega</p>
              </div>
            </div>
          )}
          {step === "otp" && (
            <div className="animate-fade-in">
              <button onClick={() => { setStep("phone"); setOtp(""); }} className="text-sm text-brand-600 font-medium mb-4 flex items-center gap-1 hover:underline">
                &larr; Number badlo
              </button>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">OTP Verify Karo</h2>
              <p className="text-sm text-gray-500 mb-5">Bheja gaya: <span className="font-medium text-gray-700">+91 {phone}</span></p>
              <div className="mb-4">
                <label className="label">6-digit OTP</label>
                <input type="tel" className="input text-center text-xl tracking-widest font-semibold" placeholder="123456"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                  onKeyDown={e => e.key === "Enter" && otp.length === 6 && handleVerifyOtp()} maxLength={6} autoFocus />
              </div>
              <button className="btn-primary w-full" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                {loading ? "Verify ho raha hai..." : <>Verify Karo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}
          {step === "role" && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Aap kaun hain?</h2>
              <p className="text-sm text-gray-500 mb-5">Apna role chuniye</p>
              <div className="space-y-3 mb-5">
                {([
                  { value: "distributor" as Role, label: "Distributor", desc: "Main dairy products shops ko supply karta hoon", emoji: "🚚" },
                  { value: "shopkeeper" as Role, label: "Shopkeeper", desc: "Main apni shop ke liye dairy products order karta hoon", emoji: "🏪" },
                ]).map(opt => (
                  <button key={opt.value} onClick={() => setRole(opt.value)}
                    className={"w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left " + (role === opt.value ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300 bg-white")}>
                    <span className="text-2xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </div>
                    <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all " + (role === opt.value ? "border-brand-600 bg-brand-600" : "border-gray-300")}>
                      {role === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn-primary w-full" onClick={handleRoleSelect}>
                Shuru Karo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          OTP se secured
        </div>
      </div>
    </div>
  );
}
