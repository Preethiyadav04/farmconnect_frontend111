import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
            <Sprout className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Farm<span className="text-primary-600">Connect</span>
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <Outlet />
        </div>
        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-500 hover:text-primary-600 transition-colors">
            ← Return to FarmConnect Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
