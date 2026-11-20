import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, ShoppingCart, Truck, UserPlus, AlertCircle, Building, MapPin } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import authService from '../services/authService';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'buyer';

  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Role-specific fields
  const [farmName, setFarmName] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [buyerType, setBuyerType] = useState('individual');
  const [gstNumber, setGstNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Mini Truck');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [maxCapacityTons, setMaxCapacityTons] = useState('');

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    // Client-side validations
    if (!username.trim() || !email.trim() || !password || !passwordConfirm) {
      setGeneralError('Please fill in all mandatory fields.');
      return;
    }

    if (password !== passwordConfirm) {
      setFieldErrors({ password_confirm: ['Passwords do not match.'] });
      return;
    }

    if (password.length < 8) {
      setFieldErrors({ password: ['Password must be at least 8 characters long.'] });
      return;
    }

    setLoading(true);

    try {
      const names = fullName.trim().split(' ');
      const firstName = names[0] || username.trim();
      const lastName = names.slice(1).join(' ') || '';

      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirm: passwordConfirm,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName.trim(),
        role: role.toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
      };

      // Attach role-specific attributes
      if (role === 'farmer') {
        payload.farm_name = farmName.trim() || `${fullName || username}'s Farm`;
        if (farmSizeAcres) {
          payload.farm_size_acres = parseFloat(farmSizeAcres) || 0.00;
        }
      } else if (role === 'buyer') {
        payload.business_name = businessName.trim() || fullName.trim() || username.trim();
        payload.buyer_type = buyerType;
        if (gstNumber) {
          payload.gst_number = gstNumber.trim();
        }
      } else if (role === 'transporter') {
        payload.vehicle_type = vehicleType;
        payload.vehicle_number = vehicleNumber.trim();
        if (maxCapacityTons) {
          payload.max_capacity_tons = parseFloat(maxCapacityTons) || 0.00;
        }
      }

      await authService.register(payload);

      // Registration successful: route to login with success indicator
      navigate('/login', {
        state: { registered: true, username: username.trim() },
        replace: true,
      });
    } catch (err) {
      if (err.response?.data) {
        if (typeof err.response.data === 'object' && !Array.isArray(err.response.data)) {
          setFieldErrors(err.response.data);
          // If non-field error exists
          if (err.response.data.non_field_errors) {
            setGeneralError(err.response.data.non_field_errors.join(' '));
          } else if (err.response.data.detail) {
            setGeneralError(err.response.data.detail);
          }
        } else {
          setGeneralError('Registration failed. Please check form inputs.');
        }
      } else if (err.code === 'ERR_NETWORK') {
        setGeneralError('Cannot connect to FarmConnect API server (127.0.0.1:8000). Please check if backend is running.');
      } else {
        setGeneralError('An unexpected registration error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFieldErrors = (fieldName) => {
    if (!fieldErrors[fieldName]) return null;
    const errors = Array.isArray(fieldErrors[fieldName]) ? fieldErrors[fieldName] : [fieldErrors[fieldName]];
    return (
      <div className="mt-1 text-xs text-red-600 space-y-0.5">
        {errors.map((err, idx) => (
          <p key={idx}>• {err}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your Account</h2>
        <p className="text-sm text-slate-500 mt-1">
          Join India's direct farmer-to-buyer agricultural marketplace
        </p>
      </div>

      {generalError && (
        <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Role Picker */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setRole('farmer')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'farmer'
              ? 'bg-white text-primary-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sprout className="w-4 h-4 mb-1 text-primary-600" />
          <span>Farmer</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('buyer')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'buyer'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mb-1 text-emerald-600" />
          <span>Buyer</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('transporter')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'transporter'
              ? 'bg-white text-amber-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 mb-1 text-amber-600" />
          <span>Transporter</span>
        </button>
      </div>

      <form onSubmit={handleRegister} className="space-y-3.5">
        {/* Basic Information */}
        <div>
          <Input
            label="Full Name / Primary Contact"
            name="fullName"
            placeholder="e.g. Ramesh Patil or Kiran Agro Trading"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          {renderFieldErrors('full_name')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Username"
              name="username"
              placeholder="e.g. ramesh_patil"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {renderFieldErrors('username')}
          </div>
          <div>
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {renderFieldErrors('email')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Phone Number"
              name="phone"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {renderFieldErrors('phone')}
          </div>
          <div>
            <Input
              label="City / Mandi Hub"
              name="city"
              placeholder="e.g. Nashik, Sehore, Pune"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            {renderFieldErrors('city')}
          </div>
        </div>

        {/* Dynamic Role-Specific Fields */}
        {role === 'farmer' && (
          <div className="p-3.5 bg-primary-50/60 rounded-xl border border-primary-200/70 space-y-3">
            <h4 className="text-xs font-bold text-primary-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-primary-700" />
              <span>Farmer & Land Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Farm / Enterprise Name"
                name="farmName"
                placeholder="e.g. Patil Organic Farms"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
              />
              <Input
                label="Cultivable Acres"
                name="farmSizeAcres"
                type="number"
                step="0.1"
                placeholder="e.g. 15.5"
                value={farmSizeAcres}
                onChange={(e) => setFarmSizeAcres(e.target.value)}
              />
            </div>
          </div>
        )}

        {role === 'buyer' && (
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70 space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>Buyer Procurement Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Business / Trading Name"
                name="businessName"
                placeholder="e.g. Kiran Wholesale Spices"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buyer Category
                </label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="individual">Individual Consumer / Household</option>
                  <option value="wholesaler">Mandi Wholesaler / Trader</option>
                  <option value="retailer">Retail Grocery Store</option>
                  <option value="processor">Food Processing Unit</option>
                  <option value="restaurant">Hotel / Restaurant</option>
                </select>
              </div>
            </div>
            <Input
              label="GST Number (Optional)"
              name="gstNumber"
              placeholder="e.g. 27ABCDE1234F1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
          </div>
        )}

        {role === 'transporter' && (
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span>Logistics & Freight Vehicle Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Mini Truck">Mini Truck (Tata Ace / Bolero)</option>
                  <option value="Tractor-Trailer">Tractor-Trailer</option>
                  <option value="Commercial Truck (10-Wheel)">Commercial Truck (10-Wheel)</option>
                  <option value="Heavy Container">Heavy Container Lorry</option>
                  <option value="Refrigerated Van">Refrigerated / Reefer Van</option>
                </select>
              </div>
              <Input
                label="Vehicle Number"
                name="vehicleNumber"
                placeholder="e.g. MH-15-AB-1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            <Input
              label="Payload Capacity (Metric Tons)"
              name="maxCapacityTons"
              type="number"
              step="0.1"
              placeholder="e.g. 5.5"
              value={maxCapacityTons}
              onChange={(e) => setMaxCapacityTons(e.target.value)}
            />
          </div>
        )}

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {renderFieldErrors('password')}
          </div>
          <div>
            <Input
              label="Confirm Password"
              name="passwordConfirm"
              type="password"
              placeholder="Re-enter password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            {renderFieldErrors('password_confirm')}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={loading}
          icon={UserPlus}
        >
          Register as {role.charAt(0).toUpperCase() + role.slice(1)}
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
          Sign In here
        </Link>
      </div>
    </div>
  );
};

export default Register;
