import { Link, useNavigate } from 'react-router-dom';
import {
  Store, Clock, FileText,
  ArrowRight,
  CheckCircle, Zap, TrendingUp,
  Play, Check, Globe, Share2, ClipboardList
} from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { useAuthStore } from '../store/authStore';
import { useTranslation, type AppLanguage } from '../utils/i18n';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();

  const handleCTA = () => {
    if (isAuthenticated && user) {
      navigate(user.role === 'distributor' ? '/distributor' : '/shop');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 shadow-lg shadow-brand-200 flex items-center justify-center">
                <BrandLogo className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">DairyWalla</span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden lg:flex items-center gap-6 mr-4">
                <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Features</a>
                <a href="#dashboard" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">Dashboard</a>
                <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">How it works</a>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="bg-transparent text-[13px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="hinglish">Hinglish</option>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>

              {isAuthenticated ? (
                <button onClick={handleCTA} className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all">
                  Dashboard
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-brand-600 transition-colors hidden sm:block">
                    {t('Login')}
                  </Link>
                  <Link to="/signup" className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-md shadow-brand-100 transition-all">
                    {t('Sign Up')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-brand-50 rounded-full blur-3xl opacity-60 -z-10 translate-x-1/2"></div>
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-40 -z-10 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5 fill-brand-600" />
            The Complete Dairy Business Operating System
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 max-w-4xl mx-auto">
            Ab Dairy Business <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-emerald-500">
              Hoga 100x Zyada Fast.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed mb-12 max-w-3xl mx-auto font-medium">
            Everything you need to manage your dairy distribution in one place. From smart ordering to auto-invoicing, DairyWalla takes care of the hard work so you can grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button onClick={handleCTA} className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-12 rounded-2xl shadow-xl shadow-brand-200 flex items-center justify-center gap-3 text-lg transition-all hover:-translate-y-1">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#how-it-works" className="w-full sm:w-auto bg-white border border-slate-200 hover:border-brand-300 text-slate-700 font-bold py-4 px-12 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg">
              Watch Features <Play className="w-4 h-4 fill-slate-700" />
            </a>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative max-w-6xl mx-auto animate-slide-up-fade">
             <div className="relative rounded-[2.5rem] p-2 bg-white shadow-2xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800">
                   <div className="bg-slate-800 h-8 w-full flex items-center px-4 gap-1.5 border-b border-slate-700">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div className="flex-1 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">dairywalla-v2.pro.dashboard</div>
                   </div>
                   <img src="/screenshots/dashboard.png" alt="Dashboard" className="w-full h-auto" />
                </div>
             </div>
             {/* Floating Mobile Feature */}
             <div className="absolute -bottom-12 -right-8 lg:-right-24 w-56 lg:w-72 z-20 hidden sm:block">
                <div className="relative rounded-[3rem] p-2 bg-slate-900 shadow-2xl border-8 border-slate-800 overflow-hidden rotate-6 hover:rotate-0 transition-transform duration-500 group">
                   <img src="/screenshots/catalog.png" alt="Mobile Catalog" className="w-full h-auto rounded-[2.5rem]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-brand-600/20 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity"></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Feature Showoff - Bento Grid Style */}
      <section className="py-24 bg-slate-50 border-y border-slate-100" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Powerful Tools, One App.</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto italic">"Pehle ka kaam ghanton me hota tha, ab DairyWalla se minutes me hoga."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[220px]">
            {/* 1. Smart Re-Ordering (4 cols) */}
            <div className="md:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
               <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-50 rounded-full group-hover:scale-150 transition-transform"></div>
               <div className="relative z-10 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6"><Zap className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Cart System</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Shopkeepers can repeat yesterday's order in exactly one click. No typing needed.</p>
               </div>
            </div>

            {/* 2. Auto Summaries (8 cols) */}
            <div className="md:col-span-8 bg-slate-900 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="relative z-10 flex flex-col md:flex-row h-full items-center gap-8">
                  <div className="flex-1">
                     <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6"><ClipboardList className="w-6 h-6" /></div>
                     <h3 className="text-2xl font-bold text-white mb-3">Instant Product Summary</h3>
                     <p className="text-slate-400 text-sm font-medium leading-relaxed">System calculates total Milk, Paneer, Curd demand across all shops. Get your load ready in seconds.</p>
                  </div>
                  <div className="w-full md:w-64 bg-white/5 rounded-2xl p-4 border border-white/10 hidden sm:block">
                     <div className="text-xs text-brand-400 font-bold mb-3 uppercase tracking-widest">Today's Demand</div>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Amul Milk (500ml)</span><span className="text-white font-bold">420 Pkts</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Fresh Paneer (1kg)</span><span className="text-white font-bold">25 Kg</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-300 text-sm">Curd Cups (200g)</span><span className="text-white font-bold">180 Units</span></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. Normal vs Late Orders (7 cols) */}
            <div className="md:col-span-7 bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-[2rem] border border-amber-100 hover:shadow-lg transition-all group">
               <div className="flex items-center gap-6 h-full">
                  <div className="flex-1">
                     <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 shadow-sm flex items-center justify-center mb-6"><Clock className="w-6 h-6" /></div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Cutoff Windows</h3>
                     <p className="text-slate-600 text-sm font-medium leading-relaxed">Define your ordering time. Late orders are flagged for your approval, keeping your inventory stable.</p>
                  </div>
                  <div className="hidden sm:block">
                     <div className="flex flex-col gap-2">
                        <div className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full text-center">8:00 PM (Normal)</div>
                        <div className="bg-red-100 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full text-center">8:01 PM (Late)</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 4. Multi-Language (5 cols) */}
            <div className="md:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-blue-500"></div>
               <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Globe className="w-6 h-6" /></div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Language App</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">Full support for English, Hindi, and Hinglish. Language change is instant across the whole app.</p>
               <div className="flex gap-2 mt-4">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Hindi</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Hinglish</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">English</span>
               </div>
            </div>

            {/* 5. Invoice Generation (6 cols) */}
            <div className="md:col-span-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2rem] border border-blue-100 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 shadow-sm flex items-center justify-center mb-6"><FileText className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">One-Tap Professional Bills</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">Generate professional invoices for any order. Share directly to WhatsApp or download as PDF in seconds.</p>
            </div>

            {/* 6. Profile Sharing (6 cols) */}
            <div className="md:col-span-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
               <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-slate-50 rounded-full opacity-50"></div>
               <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6"><Share2 className="w-6 h-6" /></div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Share & Grow</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">Distributors get a unique sharing link. Shopkeepers can connect simply by tapping the link on WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature: Order Window Visualizer */}
      <section className="py-24 bg-white" id="dashboard">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold mb-6 tracking-wider uppercase">Real-Time Management</div>
                  <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">Control Your Business From One Screen.</h2>
                  <div className="space-y-6">
                     {[
                       { icon: CheckCircle, title: 'Live Order Popups', desc: 'Naya order aate hi turant alert milega.' },
                       { icon: TrendingUp, title: 'Revenue Tracking', desc: 'Daily aur weekly sales trends dekhien.' },
                       { icon: Store, title: 'Shopkeeper Activity', desc: 'Kon order kar raha hai, kon nahi - sab dikhega.' }
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start">
                           <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-1"><item.icon className="w-4 h-4 text-brand-600" /></div>
                           <div>
                              <h4 className="font-bold text-slate-900">{item.title}</h4>
                              <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="bg-slate-100 rounded-[3rem] p-6 sm:p-10 relative group">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-900">Today's Orders</span>
                        <div className="flex gap-2">
                           <span className="w-3 h-3 rounded-full bg-brand-500"></span>
                           <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        </div>
                     </div>
                     <div className="p-4 space-y-3">
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">A</div>
                              <div><div className="text-sm font-bold text-slate-900">Aman Store</div><div className="text-[10px] text-slate-400 font-bold uppercase">7:45 PM • Normal</div></div>
                           </div>
                           <div className="text-brand-600 font-black">₹4,810</div>
                        </div>
                        <div className="p-4 bg-red-50/50 rounded-2xl flex items-center justify-between border border-red-100/50">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700">R</div>
                              <div><div className="text-sm font-bold text-slate-900">Rahul Dairy</div><div className="text-[10px] text-red-500 font-bold uppercase">8:15 PM • Late</div></div>
                           </div>
                           <button className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-lg">Approve</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* How It Works - Visual Timeline */}
      <section className="py-24 bg-slate-900 relative overflow-hidden" id="how-it-works">
         <div className="absolute top-0 left-0 w-full h-full bg-brand-600/5 -z-10"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-20 tracking-tight">How It Works.</h2>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
               <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
               {[
                 { step: 1, title: 'Profile Setup', desc: 'Signup karein, role aur language select karein.' },
                 { step: 2, title: 'Connect Shops', desc: 'Link share karein, connections approve karein.' },
                 { step: 3, title: 'Manage Orders', desc: 'Catalog, summaries aur invoices manage karein.' }
               ].map((item, i) => (
                  <div key={i} className="text-center group">
                     <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:bg-brand-500 group-hover:scale-110 transition-all duration-300 relative">
                        <span className="text-2xl font-bold text-white">{item.step}</span>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center shadow-lg animate-pulse"><Check className="w-4 h-4 text-white" /></div>
                     </div>
                     <h4 className="text-xl font-bold text-white mb-3 tracking-tight">{item.title}</h4>
                     <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-white text-center px-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-50 rounded-full blur-3xl opacity-40 -z-10 translate-x-1/2"></div>
         <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 tracking-tight">Ready to boost your business?</h2>
         <p className="text-slate-500 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto italic">Join hundreds of local distributors and shops saving hours every single day.</p>
         <button onClick={handleCTA} className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-5 px-16 rounded-2xl shadow-2xl shadow-brand-200 transition-all hover:-translate-y-1 text-xl flex items-center justify-center gap-4 mx-auto">
            Get Started For Free <ArrowRight className="w-6 h-6" />
         </button>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-slate-100 text-center">
         <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5">
               <BrandLogo className="w-full h-full grayscale opacity-40" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">DairyWalla</span>
         </div>
         <p className="text-slate-400 text-sm font-medium tracking-tight">© 2026 DairyWalla — Local Dairy Distribution Digitized.</p>
      </footer>
    </div>
  );
}
