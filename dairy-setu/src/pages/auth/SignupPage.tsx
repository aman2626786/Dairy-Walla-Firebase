﻿﻿﻿﻿import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Milk, Phone, KeyRound, ArrowLeft, ArrowRight } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth as firebaseAuth } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/ui/Toast";
import type { Role } from "../../types";

export function SignupPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [confirmationResult, setConfirmationResult] = useState<Awaited<ReturnType<typeof signInWithPhoneNumber>> | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, isAuthenticated, user } = useAuthStore();
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'distributor' ? '/distributor' : '/shop', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async () => {
    if (phone.length !== 10) { show("10 digit ka phone number daalo", "error"); return; }
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', { size: 'invisible' });
      }
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, appVerifier);
      setConfirmationResult(result);
      setStep("otp");
      show("OTP bhej diya gaya hai!");
    } catch (err: any) {
      console.error("Firebase OTP Error:", err);
      let errMsg = "OTP bhejne mein error aayi";
      if (err.code === 'auth/domain-not-authorized') errMsg = "Domain authorized nahi hai. Firebase console check karein.";
      else if (err.code === 'auth/invalid-phone-number') errMsg = "Phone number galat hai.";
      else if (err.code === 'auth/too-many-requests') errMsg = "Bahut zyada requests. Thodi der baad try karein.";
      else if (err.code === 'auth/billing-not-enabled' || err.message.includes('billing')) errMsg = "Firebase me Blaze plan enable karein (SMS ke liye zaroori hai).";
      else if (err.code === 'auth/captcha-check-failed') errMsg = "reCAPTCHA verification fail ho gaya. Page refresh karein.";
      else if (err.message) errMsg = err.message;
      
      show(errMsg, "error");

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { show("6 digit ka OTP daalo", "error"); return; }
    if (!confirmationResult) { show("Pehle OTP generate karo.", "error"); return; }
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseUid = result.user.uid;

      const loginResult = await signIn(phone, firebaseUid, role);

      if (loginResult.error) {
        show(loginResult.error, "error");
        if (loginResult.error.toLowerCase().includes("already registered as")) {
          navigate('/login');
        }
        return;
      }

      show("Phone verified successfully!");
      navigate(`/confirm?role=${role}`);
    } catch {
      show("OTP galat hai ya expire ho gaya.", "error");
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
          <p className="text-gray-500 text-sm mt-1">Naya account banao</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Account banao</h2>
          <p className="text-sm text-gray-500 mb-6">Sirf OTP daal kar sign up karein</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole("shopkeeper")} disabled={step === "otp"}
                  className={`py-2.5 rounded-xl border text-sm font-medium ${role === "shopkeeper" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"}`}>
                  Shopkeeper
                </button>
                <button type="button" onClick={() => setRole("distributor")} disabled={step === "otp"}
                  className={`py-2.5 rounded-xl border text-sm font-medium ${role === "distributor" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"}`}>
                  Distributor
                </button>
              </div>
            </div>

            {step === "phone" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">+91</span>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} autoFocus />
                    </div>
                  </div>
                </div>
                <button onClick={handleSendOtp} disabled={loading || phone.length !== 10} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2">
                  {loading ? "Sending OTP..." : "Get OTP"}
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Enter 6-digit OTP</label>
                    <button onClick={() => setStep("phone")} className="text-xs text-brand-600 flex items-center gap-1 hover:underline"><ArrowLeft className="w-3 h-3" /> Change</button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-center tracking-[0.5em] font-bold"
                      placeholder="------" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} autoFocus />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">OTP sent to +91 {phone}</p>
                </div>
                <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2 flex items-center justify-center gap-2">
                  {loading ? "Creating account..." : <><span>Verify & Create Account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </>
            )}

            <div id="recaptcha-container"></div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
