import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShoppingCart, Truck, ShieldCheck, TrendingUp, Users, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export const Home = () => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/60 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-6 border border-primary-200">
            <Sprout className="w-3.5 h-3.5" />
            <span>FarmConnect 1.0 – Live Marketplace & Auth (Phase 7)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Direct Farmer-to-Buyer <span className="text-primary-600">Marketplace</span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminating unwarranted middlemen. Enabling direct price negotiation, transparent APMC mandi benchmarks, and integrated farm-to-godown logistics.
          </p>

          {/* Phase 7 Live Status Notice */}
          <div className="mt-6 max-w-xl mx-auto p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              Live Database Active
            </span>
            <span>Connected to Django REST & MySQL 8.0. Mandi rates reflect sample database benchmark data.</span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/marketplace">
              <Button size="lg" icon={ShoppingCart} className="w-full sm:w-auto shadow-md">
                Browse Harvest Catalog
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg" icon={ArrowRight} className="w-full sm:w-auto">
                Join as Farmer or Buyer
              </Button>
            </Link>
          </div>

          {/* Core Platform Capabilities Strip (Architectural Highlights) */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-primary-700">Direct Trade</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Zero Middleman Margins</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-primary-700">Pessimistic Lock</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Atomic Inventory Safety</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-primary-700">APMC Benchmarks</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Modal Price Transparency</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-primary-700">Integrated Freight</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Farm-to-Door Delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Tailored Solutions for Every Agriculture Stakeholder
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Choose your role on FarmConnect and access specialized tools built specifically for your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Farmer Card */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-primary-600">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Farmers</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                List your harvest with custom prices, manage inventory with atomic stock locking, review direct buyer bids, and receive safe offline payments.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link to="/register?role=farmer">
                <Button variant="secondary" size="sm" className="w-full">
                  Farmer Registration →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Buyer Card */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-emerald-600">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Buyers & Traders</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Source directly from verified farmers, compare live APMC mandi rates, negotiate custom prices, and track doorstep freight delivery.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link to="/register?role=buyer">
                <Button variant="secondary" size="sm" className="w-full">
                  Buyer Registration →
                </Button>
              </Link>
            </div>
          </Card>

          {/* Transporter Card */}
          <Card hover className="flex flex-col justify-between border-t-4 border-t-amber-500">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Transporters</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse open dispatch shipments in your city, accept commercial hauling jobs, update transit checkpoints, and earn guaranteed freight charges.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link to="/register?role=transporter">
                <Button variant="secondary" size="sm" className="w-full">
                  Transporter Sign Up →
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
