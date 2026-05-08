import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Milk, Navigation, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/ui/Toast";
import { getCurrentLocation, getCoordinatesFromLocation } from "../../utils/location";
import { auth as firebaseAuth } from "../../lib/firebase";
import axios from "axios";
import type { Role } from "../../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
type Step = "verifying" | "profile" | "done" | "error";
const COMPANIES = ["Amul", "Saras", "Mother Dairy", "Parag", "Local Brand", "Multiple Brands"];
const DELIVERY_TIMINGS = ["Morning (6-9 AM)", "Afternoon (12-3 PM)", "Evening (5-8 PM)", "Any Time"];

export function ConfirmProfilePage() {
  const [step, setStep] = useState<Step>("verifying");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState("");
  const [orderStart, setOrderStart] = useState("18:00");
  const [orderCutoff, setOrderCutoff] = useState("20:00");
  const [shopName, setShopName] = useState("");
  const [shopOwnerName, setShopOwnerName] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [deliveryTiming, setDeliveryTiming] = useState("");
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [searchParams] = useSearchParams();

  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const roleFromQuery = searchParams.get("role");
    if (roleFromQuery === "distributor" || roleFromQuery === "shopkeeper") {
      setRole(roleFromQuery);
    }

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (fUser) => {
      if (!fUser) {
        if (alive) setStep("error");
        return;
      }
      const phone = fUser.phoneNumber?.replace('+91', '') || '';
      try {
        const res = await axios.post(`${API_URL}/auth/me`, { phone });
        if (res.data.needsSetup) {
          if (alive) setStep("profile");
          return;
        }
        const { profile, dp, sp } = res.data;
        let resolvedRole: Role = (roleFromQuery || profile.role || "shopkeeper") as Role;
        if (resolvedRole === "distributor" && !dp && sp) resolvedRole = "shopkeeper";
        if (resolvedRole === "shopkeeper" && !sp && dp) resolvedRole = "distributor";
        
        useAuthStore.setState({
          user: { name: profile.name || "", role: resolvedRole, phone: profile.phone, id: profile.id, email: profile.email },
          isAuthenticated: true
        });
        localStorage.setItem('dairy-walla-active-role', resolvedRole);

        const targetPath = resolvedRole === "distributor" ? (dp ? "/distributor" : "/shop") : (sp ? "/shop" : "/distributor");
        navigate(targetPath, { replace: true });
      } catch (_e) {
        if (alive) setStep("error");
      }
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [searchParams, navigate]);

  const handleGetLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      setCoords({ lat: loc.latitude, lon: loc.longitude });
      show("Location captured!");
    } catch {
      const cityVal = role === "distributor" ? city : shopCity;
      if (cityVal) { const c = getCoordinatesFromLocation(cityVal); if (c) setCoords(c); }
    } finally { setLoadingLocation(false); }
  };

  const handleSubmit = async () => {
    const name = role === "distributor" ? ownerName : shopOwnerName;
    const sName = role === "distributor" ? businessName : shopName;
    if (!name.trim()) { show("Owner name daalo", "error"); return; }
    if (!sName.trim()) { show(role === "distributor" ? "Business name daalo" : "Shop name daalo", "error"); return; }

    setLoading(true);
    try {
      const fUser = firebaseAuth.currentUser;
      if (!fUser) {
        show("Session expired. Login karo.", "error");
        navigate("/login");
        return;
      }

      const phoneToSave = fUser.phoneNumber?.replace('+91', '') || "";

      const res = await axios.post(`${API_URL}/auth/setup`, {
        phone: phoneToSave,
        role,
        name,
        businessData: role === "distributor" ? {
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          company,
          city: city.trim(),
          deliveryAreas: deliveryAreas.trim(),
          orderWindowStart: orderStart,
          orderWindowCutoff: orderCutoff,
          locationName: locationName.trim(),
          latitude: coords?.lat,
          longitude: coords?.lon,
          profileComplete: true
        } : null,
        shopData: role === "shopkeeper" ? {
          shopName: shopName.trim(),
          ownerName: shopOwnerName.trim(),
          city: shopCity.trim(),
          deliveryTiming,
          locationName: locationName.trim(),
          latitude: coords?.lat,
          longitude: coords?.lon,
          profileComplete: true
        } : null
      });

      const p = res.data.profile;
      useAuthStore.setState({
        user: { name: p.name || "", role: p.role as Role, phone: p.phone, id: p.id, email: p.email },
        isAuthenticated: true
      });
      localStorage.setItem('dairy-walla-active-role', p.role);

      setStep("done");
      setTimeout(() => {
        navigate(role === "distributor" ? "/distributor" : "/shop");
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Profile save failed";
      show(msg, "error");
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
        </div>

        {/* Verifying */}
        {step === "verifying" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Account check ho raha hai...</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-sm text-gray-500 mb-5">Profile setup session expire ho gayi hai.</p>
            <button onClick={() => navigate("/login")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Login Karke Setup Pura Karein
            </button>
          </div>
        )}

        {/* Role selection */}
        {false && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Email Verified! 🎉</h2>
            <p className="text-sm text-gray-500 mb-5">Ab apna role chuniye</p>
            <div className="space-y-3 mb-5">
              {(["distributor", "shopkeeper"] as Role[]).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={"w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left " + (role === r ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300")}>
                  <span className="text-3xl">{r === "distributor" ? "🚚" : "🏪"}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{r === "distributor" ? "Distributor" : "Shopkeeper"}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r === "distributor" ? "Dairy products supply karta hoon" : "Shop ke liye order karta hoon"}</div>
                  </div>
                  <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 " + (role === r ? "border-brand-600 bg-brand-600" : "border-gray-300")}>
                    {role === r && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("profile")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile setup */}
        {step === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <div className="text-xs text-gray-500">Selected Role</div>
              <div className="font-semibold text-gray-900 capitalize">{role}</div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{role === "distributor" ? "Business Details" : "Shop Details"}</h2>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {role === "distributor" ? (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Aapka naam" value={ownerName} onChange={e => setOwnerName(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Sharma Dairy" value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand / Company</label>
                    <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={company} onChange={e => setCompany(e.target.value)}>
                      <option value="">Select...</option>{COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Ajmer" value={city} onChange={e => setCity(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Areas</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Vaishali Nagar, Civil Lines" value={deliveryAreas} onChange={e => setDeliveryAreas(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Start</label><input type="time" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={orderStart} onChange={e => setOrderStart(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Cutoff</label><input type="time" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={orderCutoff} onChange={e => setOrderCutoff(e.target.value)} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Aapka naam" value={shopOwnerName} onChange={e => setShopOwnerName(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Patel General Store" value={shopName} onChange={e => setShopName(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Ajmer" value={shopCity} onChange={e => setShopCity(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Timing</label>
                    <select className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={deliveryTiming} onChange={e => setDeliveryTiming(e.target.value)}>
                      <option value="">Select...</option>{DELIVERY_TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                <input className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-2" placeholder="e.g. Vaishali Nagar, Ajmer" value={locationName} onChange={e => setLocationName(e.target.value)} />
                <button type="button" onClick={handleGetLocation} disabled={loadingLocation}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Navigation className="w-4 h-4" />{loadingLocation ? "Getting location..." : "Use Current Location"}
                </button>
                {coords && <p className="text-xs text-green-600 mt-1">✓ Location set</p>}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-5">
              {loading ? "Saving..." : <><span>Complete Setup</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Profile Ready!</h2>
            <p className="text-sm text-gray-500">Dashboard pe ja rahe hain...</p>
          </div>
        )}
      </div>
    </div>
  );
}
