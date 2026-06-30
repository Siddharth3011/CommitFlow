import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import DevOtpBanner from '../components/DevOtpBanner';

// =============================================================================
// Register Page
// =============================================================================

const Register = () => {
  const navigate = useNavigate();
  const { handleRegister, handleClearError, isAuthenticated, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showDevBanner, setShowDevBanner] = useState(false);

  // Redirect to dashboard once the session is established
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear Redux error when the component unmounts
  useEffect(() => {
    return () => handleClearError();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError('');
    if (error) handleClearError();
  };

  const validate = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return false;
    }

    if (name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters long.');
      return false;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please try again.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const actionResult = await handleRegister({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (actionResult?.type === 'auth/registerUser/fulfilled') {
      setShowDevBanner(true);
      navigate('/verify-email', { state: { email: formData.email.trim() } });
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return null;
    if (password.length < 6) return { label: 'Too short', color: 'bg-destructive', width: 'w-1/4' };
    if (password.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/4' };
    if (password.length < 12) return { label: 'Good', color: 'bg-yellow-400', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const strength = getPasswordStrength();
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
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join CommitFlow and start collaborating
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

            {/* Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="block text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
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
                  id="register-email"
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
              <label
                htmlFor="register-password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {strength && (
                <div className="space-y-1 pt-1">
                  <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-confirm-password"
                className="block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className={`w-full rounded-lg border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-destructive/60 focus:ring-destructive'
                      : 'border-border'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {formData.confirmPassword && passwordsMatch && (
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Passwords mismatch hint */}
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive mt-1">Passwords do not match.</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
