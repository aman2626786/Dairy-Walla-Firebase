import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Building2, Store, Edit2, Check, X,
  LogOut, Shield, ChevronRight, MapPin, Clock, Tag, FileText, Package, Users, Navigation
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useToast } from '../components/ui/Toast';
import { MobileHeader } from '../components/layout/MobileHeader';
import { getCurrentLocation, getCoordinatesFromLocation } from '../utils/location';

const DELIVERY_TIMINGS = ['Morning (6–9 AM)', 'Afternoon (12–3 PM)', 'Evening (5–8 PM)', 'Any Time'];
const COMPANIES = ['Amul', 'Saras', 'Mother Dairy', 'Parag', 'Local Brand', 'Multiple Brands'];

interface EditField {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'select';
  options?: string[];
  placeholder?: string;
}

export function ProfilePage() {
  const { user, updateUser, signOut } = useAuthStore();
  const { distributorProfiles, shopkeeperProfiles, updateDistributorSettings, updateShopkeeperProfile, products, connections } = useAppStore();
  const { show } = useToast();
  const navigate = useNavigate();

  const isDistributor = user?.role === 'distributor';
  const distProfile = distributorProfiles.find(dp => dp.userId === user?.id);
  const shopProfile = shopkeeperProfiles.find(sp => sp.userId === user?.id);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationData, setLocationData] = useState({
    locationName: (isDistributor ? distProfile?.locationName : shopProfile?.locationName) || '',
    latitude: (isDistributor ? distProfile?.latitude : shopProfile?.latitude),
    longitude: (isDistributor ? distProfile?.longitude : shopProfile?.longitude),
  });

  const startEdit = (field: EditField) => {
    setEditingField(field.key);
    setEditValue(field.value || '');
  };

  const saveEdit = (key: string) => {
    const val = editValue.trim();
    if (!val && ['name', 'businessName', 'shopName', 'city'].includes(key)) {
      show('Ye field empty nahi ho sakta', 'error');
      return;
    }

    if (key === 'name') {
      updateUser({ name: val });
    } else if (isDistributor && distProfile) {
      updateDistributorSettings(distProfile.id, { [key]: val });
      if (key === 'ownerName') updateUser({ name: val });
    } else if (!isDistributor && shopProfile) {
      updateShopkeeperProfile(shopProfile.id, { [key]: val });
      if (key === 'ownerName') updateUser({ name: val });
    }

    setEditingField(null);
    show('Updated!');
  };

  const cancelEdit = () => setEditingField(null);

  const handleGetLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setLocationData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      show('Location captured!');
    } catch (error) {
      show('Location access denied', 'error');
      // Try to get from city
      const profile = isDistributor ? distProfile : shopProfile;
      if (profile?.city) {
        const coords = getCoordinatesFromLocation(profile.city);
        if (coords) {
          setLocationData(prev => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lon,
          }));
        }
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const saveLocation = () => {
    if (isDistributor && distProfile) {
      updateDistributorSettings(distProfile.id, {
        locationName: locationData.locationName,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
    } else if (!isDistributor && shopProfile) {
      updateShopkeeperProfile(shopProfile.id, {
        locationName: locationData.locationName,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
    }
    setEditingLocation(false);
    show('Location updated!');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Build field rows
  const distributorFields: EditField[] = [
    { key: 'ownerName', label: 'Owner Name', value: distProfile?.ownerName || user?.name || '', placeholder: 'Aapka naam' },
    { key: 'businessName', label: 'Business Name', value: distProfile?.businessName || '', placeholder: 'Dairy ka naam' },
    { key: 'company', label: 'Company / Brand', value: distProfile?.company || '', type: 'select', options: COMPANIES },
    { key: 'city', label: 'City', value: distProfile?.city || '', placeholder: 'e.g. Ajmer' },
    { key: 'address', label: 'Address', value: distProfile?.address || '', placeholder: 'Shop address' },
    { key: 'deliveryAreas', label: 'Delivery Areas', value: distProfile?.deliveryAreas || '', placeholder: 'e.g. Vaishali Nagar, Civil Lines' },
    { key: 'gst', label: 'GST Number', value: distProfile?.gst || '', placeholder: 'GSTIN (optional)' },
  ];

  const shopkeeperFields: EditField[] = [
    { key: 'ownerName', label: 'Owner Name', value: shopProfile?.ownerName || user?.name || '', placeholder: 'Aapka naam' },
    { key: 'shopName', label: 'Shop Name', value: shopProfile?.shopName || '', placeholder: 'Shop ka naam' },
    { key: 'city', label: 'City', value: shopProfile?.city || '', placeholder: 'e.g. Ajmer' },
    { key: 'address', label: 'Address', value: shopProfile?.address || '', placeholder: 'Shop address' },
    { key: 'deliveryTiming', label: 'Delivery Timing', value: shopProfile?.deliveryTiming || '', type: 'select', options: DELIVERY_TIMINGS },
  ];

  const fields = isDistributor ? distributorFields : shopkeeperFields;
  const avatarLetter = user?.name?.[0]?.toUpperCase() || '?';

  const fieldIcons: Record<string, React.ReactElement> = {
    ownerName: <User className="w-3.5 h-3.5" />,
    businessName: <Building2 className="w-3.5 h-3.5" />,
    shopName: <Store className="w-3.5 h-3.5" />,
    company: <Tag className="w-3.5 h-3.5" />,
    city: <MapPin className="w-3.5 h-3.5" />,
    address: <MapPin className="w-3.5 h-3.5" />,
    deliveryAreas: <MapPin className="w-3.5 h-3.5" />,
    deliveryTiming: <Clock className="w-3.5 h-3.5" />,
    gst: <FileText className="w-3.5 h-3.5" />,
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <MobileHeader title="My Profile" showBack />
      <div className="hidden md:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Apni profile manage karo</p>
      </div>

      {/* Avatar card */}
      <div className="card p-5 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md flex-shrink-0">
          <span className="text-white font-bold text-2xl">{avatarLetter}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-base">{user?.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`badge ${isDistributor ? 'badge-green' : 'badge-blue'} capitalize text-xs`}>
              {isDistributor ? '🚚 Distributor' : '🏪 Shopkeeper'}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Phone className="w-3 h-3" /> +91 {user?.phone}
            <span className="badge-green text-xs ml-1 flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> Verified
            </span>
          </div>
        </div>
      </div>

      {/* Editable profile fields */}
      <div className="card divide-y divide-gray-100 mb-4">
        {fields.map(field => (
          <div key={field.key} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {fieldIcons[field.key]}
                {field.label}
              </div>
              {editingField !== field.key && (
                <button
                  onClick={() => startEdit(field)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {editingField === field.key ? (
              <div className="flex gap-2 mt-2">
                {field.type === 'select' ? (
                  <select
                    className="input flex-1"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                  >
                    <option value="">Select...</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="input flex-1"
                    value={editValue}
                    placeholder={field.placeholder}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(field.key)}
                    autoFocus
                  />
                )}
                <button onClick={() => saveEdit(field.key)} className="btn-primary px-3 py-2">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={cancelEdit} className="btn-secondary px-3 py-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-900 mt-0.5">
                {field.value || <span className="text-gray-400 italic text-xs">Not set — tap Edit to add</span>}
              </div>
            )}
          </div>
        ))}

        {/* Phone — read only */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            <Phone className="w-3.5 h-3.5" /> Mobile Number
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">+91 {user?.phone}</div>
            <span className="badge-green text-xs flex items-center gap-1">
              <Shield className="w-3 h-3" /> Verified
            </span>
          </div>
        </div>

        {/* Location — editable */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <Navigation className="w-3.5 h-3.5" /> Location
            </div>
            {!editingLocation && (
              <button
                onClick={() => setEditingLocation(true)}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {editingLocation ? (
            <div className="space-y-3 mt-2">
              <div>
                <input
                  className="input w-full"
                  placeholder="e.g. Vaishali Nagar, Ajmer"
                  value={locationData.locationName}
                  onChange={e => setLocationData(prev => ({ ...prev, locationName: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGetLocation}
                  disabled={loadingLocation}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  {loadingLocation ? 'Getting...' : 'Get GPS Location'}
                </button>
              </div>
              {locationData.latitude && locationData.longitude && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  ✓ Location captured ({locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)})
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={saveLocation} className="btn-primary flex-1">
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setEditingLocation(false)} className="btn-secondary flex-1">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-0.5">
              {locationData.locationName ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">{locationData.locationName}</div>
                  {locationData.latitude && locationData.longitude && (
                    <div className="text-xs text-gray-400">
                      GPS: {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 italic text-xs">Not set — tap Edit to add location</span>
              )}
            </div>
          )}
        </div>

        {/* Connection code — distributor only */}
        {isDistributor && distProfile && (
          <>
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Connection Code
              </div>
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold text-brand-600 text-lg tracking-wider">
                  {distProfile.connectionCode}
                </div>
                <button
                  className="text-xs text-brand-600 hover:underline font-medium"
                  onClick={() => { navigator.clipboard.writeText(distProfile.connectionCode); show('Code copied!'); }}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Shopkeepers ko ye code share karo connect karne ke liye</p>
            </div>

            {/* Products Count */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                <Package className="w-3.5 h-3.5" />
                Products in Catalog
              </div>
              <div className="text-sm font-medium text-gray-900">
                {products.filter(p => p.distributorId === distProfile.id).length} products
                <span className="text-gray-400 ml-2">
                  ({products.filter(p => p.distributorId === distProfile.id && p.available).length} available)
                </span>
              </div>
            </div>

            {/* Connected Shopkeepers */}
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                <Users className="w-3.5 h-3.5" />
                Connected Shopkeepers
              </div>
              <div className="text-sm font-medium text-gray-900">
                {connections.filter(c => c.distributorId === distProfile.id && c.status === 'active').length} active connections
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="card divide-y divide-gray-100 mb-4">
        {isDistributor && (
          <button onClick={() => navigate('/distributor/settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">Order Window Settings</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button
          onClick={() => navigate(isDistributor ? '/distributor/notifications' : '/shop/notifications')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">Notifications</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
}
