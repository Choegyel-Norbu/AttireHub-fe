import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '@/components/layout/AuthLayout';
import * as addressService from '@/services/addressService';
import { addOrUpdateAddressInStorage } from '@/utils/addressStorage';

const ADDRESS_TYPES = [
  { value: 'SHIPPING', label: 'Shipping address' },
  { value: 'BILLING', label: 'Billing address' },
];

const addressSchema = z.object({
  addressType: z.enum(['SHIPPING', 'BILLING'], { required_error: 'Select an address type' }),
  streetAddress: z.string().min(1, 'Street address is required').max(255, 'Street address is too long'),
  city: z.string().min(1, 'City is required').max(100, 'City is too long'),
  state: z.string().min(1, 'State / province is required').max(100, 'State is too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code is too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country is too long'),
  isDefault: z.boolean().optional(),
});

function getInputClassName(error) {
  const base =
    'w-full rounded-lg border bg-quaternary px-4 py-3 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-border focus:border-secondary focus:ring-secondary/20';
  const invalid = 'border-primary focus:border-primary focus:ring-primary/20';
  return `${base} ${error ? invalid : normal}`;
}

export default function RegisterAddressPage() {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  useEffect(() => {
    if (!state?.accessToken || typeof state.email !== 'string' || typeof state.password !== 'string') {
      navigate('/register', { replace: true });
    }
  }, [state?.accessToken, state?.email, state?.password, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: 'SHIPPING',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false,
    },
  });

  const onSubmit = async (data) => {
    if (!state?.accessToken) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const created = await addressService.createAddress(
        {
          addressType: data.addressType,
          streetAddress: data.streetAddress.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          postalCode: data.postalCode.trim(),
          country: data.country.trim(),
          isDefault: Boolean(data.isDefault),
        },
        state.accessToken
      );
      addOrUpdateAddressInStorage(created);
      navigate('/login', {
        state: { email: state.email, password: state.password },
        replace: true,
      });
    } catch (err) {
      setSubmitError(err?.message ?? 'Could not save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state?.accessToken) {
    return null;
  }

  return (
    <AuthLayout title="Add your address">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-quaternary p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-primary">
              Add your address
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Add at least one address to complete your account setup.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {submitError && (
              <div
                role="alert"
                className="rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm text-primary"
              >
                {submitError}
              </div>
            )}

            <div>
              <label htmlFor="address-type" className="block text-sm font-medium text-primary">
                Address type
              </label>
              <select
                id="address-type"
                className={getInputClassName(errors.addressType)}
                {...register('addressType')}
              >
                {ADDRESS_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.addressType && (
                <p className="mt-1.5 text-sm text-primary">{errors.addressType.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="street-address" className="block text-sm font-medium text-primary">
                Street address
              </label>
              <input
                id="street-address"
                type="text"
                autoComplete="street-address"
                placeholder="123 Main Street, Apt 4"
                className={getInputClassName(errors.streetAddress)}
                {...register('streetAddress')}
              />
              {errors.streetAddress && (
                <p className="mt-1.5 text-sm text-primary">{errors.streetAddress.message}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-primary">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="New York"
                  className={getInputClassName(errors.city)}
                  {...register('city')}
                />
                {errors.city && (
                  <p className="mt-1.5 text-sm text-primary">{errors.city.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-primary">
                  State / Province
                </label>
                <input
                  id="state"
                  type="text"
                  autoComplete="address-level1"
                  placeholder="NY"
                  className={getInputClassName(errors.state)}
                  {...register('state')}
                />
                {errors.state && (
                  <p className="mt-1.5 text-sm text-primary">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="postal-code" className="block text-sm font-medium text-primary">
                  Postal code
                </label>
                <input
                  id="postal-code"
                  type="text"
                  autoComplete="postal-code"
                  placeholder="10001"
                  className={getInputClassName(errors.postalCode)}
                  {...register('postalCode')}
                />
                {errors.postalCode && (
                  <p className="mt-1.5 text-sm text-primary">{errors.postalCode.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-primary">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  autoComplete="country-name"
                  placeholder="United States"
                  className={getInputClassName(errors.country)}
                  {...register('country')}
                />
                {errors.country && (
                  <p className="mt-1.5 text-sm text-primary">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="is-default"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-secondary"
                {...register('isDefault')}
              />
              <label htmlFor="is-default" className="text-sm font-medium text-primary">
                Set as default address
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? 'Saving…' : 'Save address & continue'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-secondary">
          You’ll be redirected to sign in after saving your address.
        </p>
      </div>
    </AuthLayout>
  );
}
