import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Truck, Scale, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Feature banner */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Direct Farmer Trade</h4>
                <p className="text-xs text-slate-400 mt-0.5">Eliminates unwarranted middlemen</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Fair Mandi Benchmarks</h4>
                <p className="text-xs text-slate-400 mt-0.5">APMC market rate benchmark architecture</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Integrated Logistics</h4>
                <p className="text-xs text-slate-400 mt-0.5">Farm-to-godown freight dispatch</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Farm<span className="text-primary-400">Connect</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              FarmConnect is a smart digital agricultural marketplace dedicated to empowering farmers,
              commercial buyers, and transport operators through fair trade, direct price negotiation,
              and seamless supply chain connectivity.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/marketplace" className="hover:text-primary-400 transition-colors">
                  Browse Harvest Catalog
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-400 transition-colors">
                  Farmer Portal
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-400 transition-colors">
                  Register as Buyer
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-400 transition-colors">
                  Join as Transporter
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Governance */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-slate-400">MySQL 8.0 & Django REST</span>
              </li>
              <li>
                <span className="text-slate-400">JWT Token Security</span>
              </li>
              <li>
                <span className="text-slate-400">APMC Mandi Benchmarks</span>
              </li>
              <li>
                <span className="text-slate-400">Status: Phase 6 Scaffolding</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FarmConnect Agricultural Technologies. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with care for Indian Agriculture
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
