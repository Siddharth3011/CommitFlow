import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import DevOtpBanner from '../components/DevOtpBanner';

// =============================================================================
// Login Page
// =============================================================================

const Login = () => {
  const navigate = useNavigate();
  const { handleLogin, handleClearError, isAuthenticated, loading, error } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showDevBanner, setShowDevBanner] = useState(false);

  // Redirect to dashboard once the session is established
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear Redux error when the component unmounts or the user begins typing again
  useEffect(() => {
    return () => handleClearError();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on edit
    if (validationError) setValidationError('');
    if (error) handleClearError();
  };

  const validate = () => {
    const { email, password } = formData;
    if (!email.trim() || !password.trim()) {
      setValidationError('Both email and password are required.');
      return false;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const actionResult = await handleLogin({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (actionResult?.type === 'auth/loginUser/fulfilled') {
      // Show the dev banner then navigate to the OTP screen
      setShowDevBanner(true);
      navigate('/verify-email', { state: { email: formData.email.trim() } });
    }
  };

  const displayError = validationError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      {/* Sticky dev-mode OTP banner */}
      <DevOtpBanner visible={showDevBanner} onClose={() => setShowDevBanner(false)} />

      <div className="w-full max-w-md">

        {/* Brand Mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            CF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your CommitFlow workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card px-8 py-8 shadow-sm">

          {/* Error Alert */}
          {displayError && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive leading-snug">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
