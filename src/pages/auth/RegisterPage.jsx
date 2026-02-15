import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import * as authService from '@/services/authService';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
    lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phoneNumber: z.union([z.string().max(20, 'Phone number is too long'), z.literal('')]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function getInputClassName(error) {
  const base =
    'w-full rounded-lg border bg-quaternary px-4 py-3 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-border focus:border-secondary focus:ring-secondary/20';
  const invalid = 'border-primary focus:border-primary focus:ring-primary/20';
  return `${base} ${error ? invalid : normal}`;
}

export default function RegisterPage() {
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data) => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const tokens = await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber?.trim() || undefined,
      });
      navigate('/register/address', {
        state: {
          email: data.email,
          password: data.password,
          accessToken: tokens.accessToken,
        },
        replace: true,
      });
    } catch (err) {
      setAuthError(err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create account" backgroundImage="/storeclothing.jpg">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-quaternary p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-primary">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Join AttireHub for a better shopping experience
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="register-firstName" className="block text-sm font-medium text-primary">
                  First name
                </label>
                <input
                  id="register-firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  className={getInputClassName(errors.firstName)}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-sm text-primary">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="register-lastName" className="block text-sm font-medium text-primary">
                  Last name
                </label>
                <input
                  id="register-lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  className={getInputClassName(errors.lastName)}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-sm text-primary">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="register-phoneNumber" className="block text-sm font-medium text-primary">
                Phone number <span className="text-tertiary">(optional)</span>
              </label>
              <input
                id="register-phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+1234567890"
                className={getInputClassName(errors.phoneNumber)}
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && (
                <p className="mt-1.5 text-sm text-primary">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-primary">
                Email address
              </label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-medium text-primary">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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

            <div>
              <label htmlFor="register-confirmPassword" className="block text-sm font-medium text-primary">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="register-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`${getInputClassName(errors.confirmPassword)} pr-10`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-tertiary transition-colors hover:text-primary"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-primary">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-secondary">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-tertiary">
          By creating an account, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </AuthLayout>
  );
}
