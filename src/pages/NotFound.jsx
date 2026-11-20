import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center mb-6">
        <Sprout className="w-9 h-9" />
      </div>
      <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">
        404 – Page Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-3">
        Looks like this field hasn't been cultivated yet!
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
        The page you are looking for might have been moved, renamed, or is currently under construction for future phases.
      </p>
      <div className="flex gap-3">
        <Link to="/">
          <Button variant="primary" icon={Home}>
            Return to Homepage
          </Button>
        </Link>
        <Link to="/marketplace">
          <Button variant="outline">
            Browse Marketplace
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
