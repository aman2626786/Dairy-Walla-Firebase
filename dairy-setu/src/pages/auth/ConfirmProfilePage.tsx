import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Milk, Navigation, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { useToast } from "../../components/ui/Toast";
import { getCurrentLocation, getCoordinatesFromLocation } from "../../utils/location";
import { supabase } from "../../lib/supabase";
import type { Role } from "../../types";

type Step = "verifying" | "profile" | "done" | "error";
const COMPANIES = ["Amul", "Saras", "Mother Dairy", "Parag", "Local Brand", "Multiple Brands"];
const DELIVERY_TIMINGS = ["Morning (6-9 AM)", "Afternoon (12-3 PM)", "Evening (5-8 PM)", "Any Time"];

export function ConfirmProfilePage() {
  const [step, setStep] = useState<Step>("verifying");
  const [role, setRole] = useState<Role>("shopkeeper");
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [userId, setUserId] = useState<string>("");

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

  const { updateUser } = useAuthStore();
  const { createDistributorProfile, createShopkeeperProfile } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const isEmailConfirmed = (sessionUser: { email_confirmed_at?: string | null } | null | undefined) =>
      Boolean(sessionUser?.email_confirmed_at);

    // Supabase email confirm link mein URL hash hota hai jisme tokens hote hain
    // onAuthStateChange automatically URL hash process karta hai
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user && isEmailConfirmed(session.user)) {
        setUserId(session.user.id);
        // Update auth store
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const resolvedRole: Role = profile.role === "distributor" ? "distributor" : "shopkeeper";
          setRole(resolvedRole);
          useAuthStore.setState({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name || "",
              phone: profile.phone,
              role: resolvedRole,
            },
            isAuthenticated: true,
          });
        }
        setStep("profile");
        subscription.unsubscribe();
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user && !isEmailConfirmed(session.user)) {
        setStep("error");
      } else if (event === "SIGNED_OUT") {
        setStep("error");
      }
    });

    // Already logged in check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isEmailConfirmed(session.user)) {
        setUserId(session.user.id);
        const metaRole = session.user.user_metadata?.role;
        if (metaRole === "distributor" || metaRole === "shopkeeper") setRole(metaRole);
        useAuthStore.setState({
          isAuthenticated: true,
        });
        setStep("profile");
        subscription.unsubscribe();
      } else if (session?.user && !isEmailConfirmed(session.user)) {
        setStep("error");
      }
    });

    const roleFromQuery = searchParams.get("role");
    if (roleFromQuery === "distributor" || roleFromQuery === "shopkeeper") {
      setRole(roleFromQuery);
    }

    // 10 second timeout
    const timeout = setTimeout(() => {
      setStep(prev => prev === "verifying" ? "error" : prev);
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [searchParams]);

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
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || userId;
      if (!uid) {
        show("Session expired. Login karo.", "error");
        navigate("/login");
        return;
      }

      // Update role and name in profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role, name })
        .eq("id", uid);

      if (updateError) {
        // Profile row nahi hai — insert karo
        const { error: insertError } = await supabase.from("profiles").insert({
          id: uid,
          email: session?.user?.email || "",
          name,
          phone: session?.user?.user_metadata?.phone || "",
          role,
        });
        if (insertError) throw new Error(insertError.message);
      }

      await supabase.from("user_roles").upsert(
        { user_id: uid, role },
        { onConflict: "user_id,role" }
      );

      await updateUser({ name, role });

      if (role === "distributor") {
        const created = await createDistributorProfile(uid, {
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
        });
        if (!created) throw new Error("Distributor profile save nahi hua");
      } else {
        const created = await createShopkeeperProfile(uid, {
          shopName: shopName.trim(),
          ownerName: shopOwnerName.trim(),
          city: shopCity.trim(),
          deliveryTiming,
          locationName: locationName.trim(),
          latitude: coords?.lat,
          longitude: coords?.lon,
        });
        if (!created) throw new Error("Shopkeeper profile save nahi hua");
      }

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
            <p className="text-sm text-gray-600">Email verify ho rahi hai...</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Link Expire Ho Gaya</h2>
            <p className="text-sm text-gray-500 mb-5">Confirmation link expire ho gaya ya invalid hai.</p>
            <button onClick={() => navigate("/signup")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Dobara Signup Karo
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
