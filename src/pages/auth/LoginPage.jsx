import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';

/** Returns webmail inbox URL for the given email, or Gmail as fallback. */
function getInboxUrl(email) {
  if (!email || typeof email !== 'string') return 'https://mail.google.com';
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com';
  if (['outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com', 'outlook.co.uk'].includes(domain)) return 'https://outlook.live.com';
  if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
  return 'https://mail.google.com';
}

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function getInputClassName(error) {
  const base =
    'w-full rounded-lg border bg-quaternary px-4 py-3 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-border focus:border-secondary focus:ring-secondary/20';
  const invalid = 'border-primary focus:border-primary focus:ring-primary/20';
  return `${base} ${error ? invalid : normal}`;
}

export default function LoginPage() {
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(null); // { message, email } when 403
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = location.state && typeof location.state === 'object' ? location.state : {};

  const closeEmailNotVerifiedDialog = () => setEmailNotVerified(null);

  const openInbox = () => {
    if (emailNotVerified?.email) {
      window.open(getInboxUrl(emailNotVerified.email), '_blank', 'noopener,noreferrer');
    } else {
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    }
    closeEmailNotVerifiedDialog();
  };

  useEffect(() => {
    if (!emailNotVerified) return;
    const onEscape = (e) => {
      if (e.key === 'Escape') closeEmailNotVerifiedDialog();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [emailNotVerified]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: typeof prefilled.email === 'string' ? prefilled.email : '',
      password: typeof prefilled.password === 'string' ? prefilled.password : '',
    },
  });

  const onSubmit = async (data) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.statusCode === 403) {
        setEmailNotVerified({
          message: err.message,
          email: data.email,
        });
        setAuthError(null);
      } else {
        setAuthError(err?.message ?? 'Sign in failed. Please check your email and password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign in" backgroundImage="/storeclothing.jpg">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-quaternary p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-primary">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {authError && (
              <div
                role="alert"
                className="rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm text-primary"
              >
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-primary">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={getInputClassName(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-primary">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-primary">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-secondary hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${getInputClassName(errors.password)} pr-10`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-tertiary transition-colors hover:text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-primary">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-secondary">
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-tertiary">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>

      {emailNotVerified &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-not-verified-title"
            aria-describedby="email-not-verified-desc"
          >
            <div
              className="absolute inset-0 bg-quaternary/90 backdrop-blur-sm"
              aria-hidden
              onClick={closeEmailNotVerifiedDialog}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-quaternary p-6 shadow-lg">
              <h2 id="email-not-verified-title" className="text-lg font-semibold text-primary">
                Verify your email
              </h2>
              <p id="email-not-verified-desc" className="mt-2 text-sm text-secondary">
                {emailNotVerified.message}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeEmailNotVerifiedDialog}
                  className="flex-1 rounded-lg border border-border bg-quaternary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={openInbox}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#7BA4D0' }}
                >
                  Open email inbox
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </AuthLayout>
  );
}
