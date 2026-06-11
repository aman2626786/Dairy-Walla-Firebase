import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-brand-600" />
            </div>
            <span className="font-bold text-slate-700 group-hover:text-brand-600 transition-colors">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 opacity-50 pointer-events-none">
             <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center p-1"><BrandLogo className="w-full h-full grayscale" /></div>
             <span className="font-bold text-slate-400 text-sm">DairyWalla</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-8 border border-brand-100/50">
            <Shield className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-500 font-medium mb-12">Effective Date: June 11, 2026</p>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
            <p>Welcome to DairyWalla! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our application.</p>

            <h3>1. Information We Collect</h3>
            <p>We may collect personal identification information from Users in a variety of ways, including, but not limited to:</p>
            <ul>
              <li><strong>Personal Data:</strong> Name, email address, phone number, and business details (business name, GST number, location).</li>
              <li><strong>Location Data:</strong> GPS location of the shop or distributorship to facilitate accurate deliveries.</li>
              <li><strong>Transaction Data:</strong> Order history, quantities, and status.</li>
            </ul>
            <p><em>Note:</em> We do not store sensitive payment/credit card information on our servers.</p>

            <h3>2. How We Use Your Information</h3>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To create and manage your account.</li>
              <li>To facilitate order placement and fulfillment between distributors and shopkeepers.</li>
              <li>To send important notifications regarding order status (via Push Notifications).</li>
              <li>To improve our platform and customer service.</li>
            </ul>

            <h3>3. Data Sharing</h3>
            <p>We do not sell, trade, or rent your personal identification information to others. We share your information only:</p>
            <ul>
              <li>Between connected Distributors and Shopkeepers to process orders.</li>
              <li>With third-party service providers (like Firebase for hosting/auth, Render for server hosting) under strict confidentiality agreements.</li>
              <li>When required by law.</li>
            </ul>

            <h3>4. Security</h3>
            <p>We adopt appropriate data collection, storage, and processing practices, and security measures (like encryption and secured tokens) to protect against unauthorized access or disclosure of your personal information.</p>

            <h3>5. Your Rights</h3>
            <p>You have the right to request access to, correction of, or deletion of your personal data stored with us. You can contact our support team for these requests.</p>

            <h3>6. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at <strong>support@dairywalla.in</strong>.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
