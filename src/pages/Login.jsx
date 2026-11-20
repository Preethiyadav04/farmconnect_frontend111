import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, User as UserIcon, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registeredNotice = location.state?.registered;
  const prefilledUsername = location.state?.username;

  // Initialize prefilled username if redirected from registration
  React.useEffect(() => {
    if (prefilledUsername && !username) {
      setUsername(prefilledUsername);
    }
  }, [prefilledUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Connect to genuine Django backend JWT token endpoint
      const response = await authService.login(username, password);
      const { access, refresh, user: userData } = response;

      if (access && userData) {
        login(userData, access, refresh);
        const destination = location.state?.from?.pathname || `/dashboard/${(userData.role || 'buyer').toLowerCase()}`;
        navigate(destination, { replace: true });
      } else {
        setError('Authentication service returned an unexpected response format.');
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors.join(' '));
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the FarmConnect API server (127.0.0.1:8000). Please ensure the backend service is running.');
      } else {
        setError('Invalid username or password. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to FarmConnect</h2>
        <p className="text-sm text-slate-500 mt-1">
          Access your agricultural marketplace orders, crop listings, or logistics hub
        </p>
      </div>

      {registeredNotice && (
        <div className="p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Registration successful! Please sign in with your credentials to access your portal.</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          name="username"
          type="text"
          placeholder="e.g. farmer_ramesh or buyer_kiran"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={UserIcon}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              defaultChecked
            />
            <span>Remember me</span>
          </label>
          <a href="#forgot" className="text-primary-700 hover:text-primary-800 font-medium">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={loading}
          icon={LogIn}
        >
          Sign In
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
        Don't have an account yet?{' '}
        <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800">
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default Login;
