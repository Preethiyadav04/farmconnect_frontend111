import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Scale,
  RefreshCw,
  Sprout,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import { formatCurrency } from '../utils/formatters';
import cropService from '../services/cropService';
import { getCropImageUrl, handleCropImageError, hasFarmerUploadedImage } from '../utils/cropImageHelper';

export const Marketplace = () => {
  const [crops, setCrops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Fetch categories on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await cropService.getCategories();
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load crop categories:', err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch crops with active filters
  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        page_size: pageSize,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedLocation.trim()) {
        params.location = selectedLocation.trim();
      }
      if (sortBy) {
        params.sort_by = sortBy;
      }

      const response = await cropService.getCrops(params);
      setCrops(response.results || []);
      setTotalCount(response.count || 0);
    } catch (err) {
      console.error('Failed to fetch crops:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the FarmConnect API server (127.0.0.1:8000). Please verify backend service.');
      } else {
        setError('Unable to load crop listings from the database. Please try again.');
      }
      setCrops([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, selectedLocation, sortBy, searchTerm]);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadCrops();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('');
    setSortBy('newest');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Agricultural Produce Marketplace"
        subtitle="Source fresh, verified harvests directly from regional farmers at transparent prices."
        badge={
          loading
            ? 'Loading Catalog...'
            : `${totalCount} ${totalCount === 1 ? 'Listing Available' : 'Listings Available'}`
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              name="search"
              placeholder="Search by crop name, variety, grain, or mandi location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full sm:w-48">
            <Input
              name="location"
              placeholder="Filter by city/state"
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setPage(1);
              }}
              icon={MapPin}
            />
          </div>
          <div className="w-full sm:w-44">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-[42px]"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Viewed</option>
            </select>
          </div>
          <Button type="submit" variant="primary" icon={Search} className="shrink-0">
            Search
          </Button>
        </form>

        {/* Dynamic Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Harvests
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug || cat.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.slug || selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mandi Rate Notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
        <div className="flex items-start sm:items-center gap-2.5">
          <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>APMC Mandi Transparency:</strong> FarmConnect displays regional APMC modal rates for price comparison. <em>Data Source: Sample Database Benchmark. Genuine live Agmarknet government API integration connects in subsequent releases.</em>
          </span>
        </div>
        <span className="shrink-0 font-medium text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full text-xs">
          Mandi Reference
        </span>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-16">
          <Loading text="Loading available harvests from verified regional farmers..." />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Failed to Load Crops</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
          </div>
          <Button variant="primary" size="sm" icon={RefreshCw} onClick={loadCrops}>
            Retry Connection
          </Button>
        </div>
      ) : crops.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Harvests Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              No active crop listings match your current search criteria or category filter.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Crop Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {crops.map((crop) => (
              <Card
                key={crop.id}
                hover
                padding={false}
                className="flex flex-col justify-between overflow-hidden group"
              >
                {/* Image or Crop Banner */}
                <div className="h-48 bg-slate-900 flex flex-col justify-between p-3.5 text-white relative overflow-hidden">
                  <img
                    src={getCropImageUrl(crop)}
                    alt={crop.crop_name}
                    onError={(e) => handleCropImageError(e, crop)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                  {/* Visual gradient overlay for clean contrast and legible text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-black/40 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-xs text-white border border-white/10">
                      {crop.category_name || 'Produce'}
                    </span>
                    {crop.farmer_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/90 text-white shadow-xs">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : null}
                  </div>

                  <div className="relative z-10 flex items-end justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-300 font-medium">Available Stock:</span>
                      <p className="text-base font-bold text-white leading-tight">
                        {parseFloat(crop.quantity_available).toLocaleString()} {crop.unit}
                      </p>
                    </div>
                    {!hasFarmerUploadedImage(crop) && (
                      <span className="text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10" title="High-resolution harvest catalog reference image">
                        Catalog Ref
                      </span>
                    )}
                  </div>
                </div>

                {/* Crop Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-primary-700 transition-colors">
                      {crop.crop_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {crop.variety ? `Variety: ${crop.variety}` : crop.category_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{crop.location || `${crop.location_city}, ${crop.location_state}`}</span>
                    </div>
                  </div>

                  {/* Pricing and Farmer Details */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Farmer Price:</span>
                      <span className="text-lg font-extrabold text-primary-700">
                        {formatCurrency(crop.price_per_unit)}
                        <span className="text-xs font-normal text-slate-500"> /{crop.unit}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="truncate">Farmer: {crop.farmer_name}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        Min: {parseFloat(crop.minimum_order_quantity)} {crop.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to={`/crops/${crop.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <span>View Produce & Benchmarks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
