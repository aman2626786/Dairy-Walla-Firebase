import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';

export function TermsConditionsPage() {
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
            <FileText className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Terms & Conditions</h1>
          <p className="text-slate-500 font-medium mb-12">Last Updated: June 11, 2026</p>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
            <p>By accessing or using the DairyWalla platform, you agree to be bound by these Terms & Conditions.</p>

            <h3>1. Platform Role</h3>
            <p>DairyWalla is an order-management platform designed to connect Dairy and Ice-Cream Distributors with their Shopkeepers. We are a technology provider and do not manufacture, sell, or take responsibility for the physical goods being traded.</p>

            <h3>2. User Accounts</h3>
            <ul>
              <li><strong>Accuracy:</strong> You must provide accurate and complete information when creating an account.</li>
              <li><strong>Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li><strong>Role Verification:</strong> Accounts are designated as either "Distributor" or "Shopkeeper". Using the platform under false pretences is prohibited.</li>
            </ul>

            <h3>3. Orders and Transactions</h3>
            <ul>
              <li><strong>Order Placement:</strong> Shopkeepers are responsible for ensuring the accuracy of orders placed.</li>
              <li><strong>Fulfillment:</strong> Distributors are responsible for accepting, rejecting, or fulfilling orders according to their own business practices and inventory.</li>
              <li><strong>Disputes:</strong> Any disputes regarding product quality, missing items, or payments must be resolved directly between the Distributor and the Shopkeeper. DairyWalla is not liable for financial losses incurred.</li>
            </ul>

            <h3>4. Acceptable Use</h3>
            <p>You agree not to use the platform to:</p>
            <ul>
              <li>Send spam, fraudulent orders, or abusive messages.</li>
              <li>Interfere with the security or performance of the app.</li>
              <li>Attempt to reverse-engineer or extract data from the platform.</li>
            </ul>

            <h3>5. Termination</h3>
            <p>We reserve the right to suspend or terminate your account at any time if we suspect a violation of these terms.</p>

            <h3>6. Changes to Terms</h3>
            <p>We may update these terms occasionally. Continued use of the platform after updates constitutes your consent to the changes.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
