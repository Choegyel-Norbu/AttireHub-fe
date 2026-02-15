import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import * as userService from '@/services/userService';
import * as addressService from '@/services/addressService';
import {
  getAddressesFromStorage,
  setAddressesInStorage,
  addOrUpdateAddressInStorage,
} from '@/utils/addressStorage';
import { Settings, Loader2, MapPin, Pencil, Trash2, Star } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

const ADDRESS_TYPES = [
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'BILLING', label: 'Billing' },
];

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  phoneNumber: z.union([z.string().max(20, 'Phone number is too long'), z.literal('')]).optional(),
});

const addressSchema = z.object({
  addressType: z.enum(['SHIPPING', 'BILLING'], { required_error: 'Select type' }),
  streetAddress: z.string().min(1, 'Street address is required').max(255, 'Too long'),
  city: z.string().min(1, 'City is required').max(100, 'Too long'),
  state: z.string().min(1, 'State / province is required').max(100, 'Too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Too long'),
  isDefault: z.boolean().optional(),
});

function getInputClassName(error) {
  const base =
    'w-full rounded-xl border bg-quaternary px-4 py-3 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-tertiary focus:border-secondary focus:ring-secondary/20';
  const invalid = 'border-primary focus:border-primary focus:ring-primary/20';
  return `${base} ${error ? invalid : normal}`;
}

function getDefaultProfileValues(user) {
  if (!user) return { firstName: '', lastName: '', phoneNumber: '' };
  const firstName = user.firstName ?? user.first_name ?? (user.name && user.name.split(' ')[0]) ?? '';
  const lastName = user.lastName ?? user.last_name ?? (user.name && user.name.split(' ').slice(1).join(' ')) ?? '';
  const phoneNumber = user.phoneNumber ?? user.phone_number ?? '';
  return { firstName, lastName, phoneNumber };
}

const emptyAddress = {
  addressType: 'SHIPPING',
  streetAddress: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

export default function AccountSettingsPage() {
  const { user: authUser, updateUser } = useAuth();
  const { show: showToast } = useToast();
  const [addresses, setAddresses] = useState(() => getAddressesFromStorage());
  const [profileError, setProfileError] = useState(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [addressError, setAddressError] = useState(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: getDefaultProfileValues(authUser),
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: emptyAddress,
  });

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    userService
      .getProfile()
      .then((profile) => {
        if (!cancelled) profileForm.reset(getDefaultProfileValues(profile));
      })
      .catch(() => {
        if (!cancelled) profileForm.reset(getDefaultProfileValues(authUser));
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [authUser, profileForm.reset]);

  useEffect(() => {
    let cancelled = false;
    addressService
      .getAddresses()
      .then((list) => {
        if (!cancelled) {
          setAddresses(list);
          setAddressesInStorage(list);
        }
      })
      .catch(() => {
        if (!cancelled) setAddresses(getAddressesFromStorage());
      });
    return () => { cancelled = true; };
  }, []);

  const syncAddressesFromStorage = () => setAddresses(getAddressesFromStorage());

  const onProfileSubmit = async (data) => {
    setProfileError(null);
    setProfileSubmitting(true);
    try {
      const updated = await userService.updateProfile({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber?.trim() || undefined,
      });
      updateUser(updated);
      showToast({ message: 'Profile updated.', variant: 'success' });
      profileForm.reset(getDefaultProfileValues(updated));
    } catch (err) {
      setProfileError(err?.message ?? 'Failed to update profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const onAddressSubmit = async (data) => {
    setAddressError(null);
    setAddressSubmitting(true);
    const payload = {
      addressType: data.addressType,
      streetAddress: data.streetAddress.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      postalCode: data.postalCode.trim(),
      country: data.country.trim(),
      isDefault: Boolean(data.isDefault),
    };

    if (editingAddressId != null) {
      try {
        let updated = await addressService.updateAddress(editingAddressId, {
          ...payload,
          streetAddress: payload.streetAddress,
          city: payload.city,
          state: payload.state,
          postalCode: payload.postalCode,
          country: payload.country,
          isDefault: payload.isDefault,
        });

        if (payload.isDefault) {
          updated = await addressService.setDefaultAddress(editingAddressId);
        }
        
        // Update local storage with the response from server
        const list = getAddressesFromStorage();
        const idx = list.findIndex((a) => a?.id === editingAddressId || a?.id === String(editingAddressId));
        if (idx >= 0) {
          let next = list.slice();
          if (updated.isDefault) {
             next = next.map((a) => ({ ...a, isDefault: a.id === updated.id }));
          }
          next[idx] = updated;
          setAddressesInStorage(next);
          syncAddressesFromStorage();
        }
        
        showToast({ message: 'Address updated.', variant: 'success' });
        addressForm.reset(emptyAddress);
        setEditingAddressId(null);
      } catch (err) {
         // Fallback to local update if API fails (or handle error)
         console.error("Failed to update address on server", err);
         // For now, let's keep the local update as fallback or just show error
         setAddressError(err?.message ?? 'Failed to update address.');
      }
    } else {
      try {
        const created = await addressService.createAddress({
          ...payload,
          streetAddress: payload.streetAddress,
          city: payload.city,
          state: payload.state,
          postalCode: payload.postalCode,
          country: payload.country,
          isDefault: payload.isDefault,
        });
        addOrUpdateAddressInStorage(created);
      } catch {
        const localId = `local-${Date.now()}`;
        addOrUpdateAddressInStorage({ ...payload, id: localId, street_address: payload.streetAddress, postal_code: payload.postalCode });
        showToast({ message: 'Address saved locally.', variant: 'success' });
      }
      syncAddressesFromStorage();
      addressForm.reset(emptyAddress);
    }
    setAddressSubmitting(false);
  };

  const setDefaultAddress = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      
      const list = getAddressesFromStorage().map((a) => ({
        ...a,
        isDefault: a.id === id || a.id === String(id),
      }));
      setAddressesInStorage(list);
      syncAddressesFromStorage();
      showToast({ message: 'Default address updated.', variant: 'success' });
    } catch (err) {
      console.error("Failed to set default address on server", err);
      // Fallback to local update or show error
      // For now, we can show an error toast
      showToast({ message: err?.message ?? 'Failed to set default address.', variant: 'error' });
    }
  };

  const requestRemoveAddress = (addr) => setAddressToDelete(addr);

  const cancelRemoveAddress = () => setAddressToDelete(null);

  useEffect(() => {
    if (!addressToDelete) return;
    const onEscape = (e) => {
      if (e.key === 'Escape') cancelRemoveAddress();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [addressToDelete]);

  const confirmRemoveAddress = async () => {
    if (!addressToDelete) return;
    const id = addressToDelete.id;
    const isLocalOnly = String(id).startsWith('local-');
    setDeleteConfirming(true);
    try {
      if (!isLocalOnly) {
        await addressService.deleteAddress(id);
      }
      const list = getAddressesFromStorage().filter((a) => a.id !== id && a.id !== String(id));
      setAddressesInStorage(list);
      syncAddressesFromStorage();
      if (editingAddressId === id) {
        addressForm.reset(emptyAddress);
        setEditingAddressId(null);
      }
      showToast({ message: 'Address removed.', variant: 'success' });
      setAddressToDelete(null);
    } catch (err) {
      showToast({ message: err?.message ?? 'Failed to remove address.', variant: 'error' });
    } finally {
      setDeleteConfirming(false);
    }
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    addressForm.reset({
      addressType: addr.addressType ?? addr.address_type ?? 'SHIPPING',
      streetAddress: addr.streetAddress ?? addr.street_address ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      postalCode: addr.postalCode ?? addr.postal_code ?? '',
      country: addr.country ?? '',
      isDefault: Boolean(addr.isDefault ?? addr.default),
    });
  };

  const email = authUser?.email ?? '';

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <div className="flex items-center gap-2 text-secondary">
          <Settings className="h-6 w-6" aria-hidden />
          <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-secondary">
          Update your profile and addresses.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-tertiary bg-quaternary p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-primary">Profile</h2>
        <p className="mt-1 text-sm text-secondary">Name and phone. Email is used to sign in.</p>
        {profileLoading ? (
          <div className="mt-6 flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          </div>
        ) : (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-6 space-y-5">
            {profileError && (
              <div role="alert" className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
                {profileError}
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-firstName" className="block text-sm font-medium text-primary">First name</label>
                <input
                  id="settings-firstName"
                  type="text"
                  autoComplete="given-name"
                  className={getInputClassName(profileForm.formState.errors.firstName)}
                  {...profileForm.register('firstName')}
                />
                {profileForm.formState.errors.firstName && (
                  <p className="mt-1.5 text-sm text-primary">{profileForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="settings-lastName" className="block text-sm font-medium text-primary">Last name</label>
                <input
                  id="settings-lastName"
                  type="text"
                  autoComplete="family-name"
                  className={getInputClassName(profileForm.formState.errors.lastName)}
                  {...profileForm.register('lastName')}
                />
                {profileForm.formState.errors.lastName && (
                  <p className="mt-1.5 text-sm text-primary">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="settings-email" className="block text-sm font-medium text-primary">Email</label>
              <input
                id="settings-email"
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full rounded-xl border border-tertiary bg-tertiary/20 px-4 py-3 text-primary opacity-90"
              />
            </div>
            <div>
              <label htmlFor="settings-phone" className="block text-sm font-medium text-primary">Phone (optional)</label>
              <input
                id="settings-phone"
                type="tel"
                autoComplete="tel"
                className={getInputClassName(profileForm.formState.errors.phoneNumber)}
                {...profileForm.register('phoneNumber')}
              />
              {profileForm.formState.errors.phoneNumber && (
                <p className="mt-1.5 text-sm text-primary">{profileForm.formState.errors.phoneNumber.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={profileSubmitting || !profileForm.formState.isDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-quaternary hover:opacity-90 disabled:opacity-50"
            >
              {profileSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save profile
            </button>
          </form>
        )}
      </section>

      {/* Addresses */}
      <section className="rounded-2xl border border-tertiary bg-quaternary p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
          <MapPin className="h-5 w-5" aria-hidden /> Addresses
        </h2>
        <p className="mt-1 text-sm text-secondary">Add or edit addresses. They are stored on this device and synced when possible.</p>

        {addresses.length > 0 && (
          <ul className="mt-4 space-y-3">
            {addresses.map((addr) => {
              const street = addr.streetAddress ?? addr.street_address;
              const city = addr.city;
              const state = addr.state;
              const postal = addr.postalCode ?? addr.postal_code;
              const country = addr.country;
              const type = addr.addressType ?? addr.address_type;
              const isDefault = addr.isDefault ?? addr.default;
              return (
                <li
                  key={addr.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-tertiary bg-quaternary p-4"
                >
                  <div>
                    {isDefault && (
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                    <p className="font-medium text-primary">{street}</p>
                    <p className="text-sm text-secondary">{[city, state, postal, country].filter(Boolean).join(', ')}</p>
                    {type && <p className="mt-1 text-xs text-secondary">{type}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip text="Edit address" side="top">
                      <button
                        type="button"
                        onClick={() => startEditAddress(addr)}
                        className="rounded-lg p-2 text-primary hover:bg-tertiary/20"
                        aria-label="Edit address"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    {!isDefault && (
                      <Tooltip text="Set as default" side="top">
                        <button
                          type="button"
                          onClick={() => setDefaultAddress(addr.id)}
                          className="rounded-lg p-2 text-secondary hover:bg-tertiary/20"
                          aria-label="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip text="Remove address" side="top">
                      <button
                        type="button"
                        onClick={() => requestRemoveAddress(addr)}
                        className="rounded-lg p-2 text-primary hover:bg-primary/10"
                        aria-label="Remove address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="mt-6 space-y-5">
          {addressError && (
            <div role="alert" className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              {addressError}
            </div>
          )}
          <div>
            <label htmlFor="addr-type" className="block text-sm font-medium text-primary">Type</label>
            <select id="addr-type" className={getInputClassName(addressForm.formState.errors.addressType)} {...addressForm.register('addressType')}>
              {ADDRESS_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="addr-street" className="block text-sm font-medium text-primary">Street address</label>
            <input
              id="addr-street"
              type="text"
              autoComplete="street-address"
              placeholder="123 Main St"
              className={getInputClassName(addressForm.formState.errors.streetAddress)}
              {...addressForm.register('streetAddress')}
            />
            {addressForm.formState.errors.streetAddress && (
              <p className="mt-1.5 text-sm text-primary">{addressForm.formState.errors.streetAddress.message}</p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-city" className="block text-sm font-medium text-primary">City</label>
              <input id="addr-city" type="text" autoComplete="address-level2" className={getInputClassName(addressForm.formState.errors.city)} {...addressForm.register('city')} />
              {addressForm.formState.errors.city && <p className="mt-1.5 text-sm text-primary">{addressForm.formState.errors.city.message}</p>}
            </div>
            <div>
              <label htmlFor="addr-state" className="block text-sm font-medium text-primary">State / Province</label>
              <input id="addr-state" type="text" autoComplete="address-level1" className={getInputClassName(addressForm.formState.errors.state)} {...addressForm.register('state')} />
              {addressForm.formState.errors.state && <p className="mt-1.5 text-sm text-primary">{addressForm.formState.errors.state.message}</p>}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-postal" className="block text-sm font-medium text-primary">Postal code</label>
              <input id="addr-postal" type="text" autoComplete="postal-code" className={getInputClassName(addressForm.formState.errors.postalCode)} {...addressForm.register('postalCode')} />
              {addressForm.formState.errors.postalCode && <p className="mt-1.5 text-sm text-primary">{addressForm.formState.errors.postalCode.message}</p>}
            </div>
            <div>
              <label htmlFor="addr-country" className="block text-sm font-medium text-primary">Country</label>
              <input id="addr-country" type="text" autoComplete="country-name" className={getInputClassName(addressForm.formState.errors.country)} {...addressForm.register('country')} />
              {addressForm.formState.errors.country && <p className="mt-1.5 text-sm text-primary">{addressForm.formState.errors.country.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="addr-default"
              type="checkbox"
              className="h-4 w-4 rounded border-tertiary text-primary focus:ring-secondary"
              {...addressForm.register('isDefault')}
            />
            <label htmlFor="addr-default" className="text-sm font-medium text-primary">Set as default</label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addressSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-quaternary hover:opacity-90 disabled:opacity-50"
            >
              {addressSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingAddressId != null ? 'Update address' : 'Add address'}
            </button>
            {editingAddressId != null && (
              <button
                type="button"
                onClick={() => { addressForm.reset(emptyAddress); setEditingAddressId(null); }}
                className="rounded-xl border border-tertiary px-4 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Delete address confirmation dialog — matches sign out dialog style */}
      {addressToDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-address-dialog-title"
            aria-describedby="delete-address-dialog-desc"
          >
            <div
              className="absolute inset-0 bg-quaternary/90 backdrop-blur-sm"
              aria-hidden
              onClick={cancelRemoveAddress}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-tertiary bg-quaternary p-6 shadow-lg">
              <h2 id="delete-address-dialog-title" className="text-lg font-semibold text-primary">
                Remove address?
              </h2>
              <p id="delete-address-dialog-desc" className="mt-2 text-sm text-secondary">
                Are you sure you want to remove this address? This action cannot be undone.
              </p>
              <div className="mt-4 rounded-lg border border-tertiary bg-quaternary p-3">
                <p className="font-medium text-primary">
                  {addressToDelete.streetAddress ?? addressToDelete.street_address}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  {[addressToDelete.city, addressToDelete.state, addressToDelete.postalCode ?? addressToDelete.postal_code, addressToDelete.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={cancelRemoveAddress}
                  disabled={deleteConfirming}
                  className="flex-1 rounded-lg border border-tertiary bg-quaternary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveAddress}
                  disabled={deleteConfirming}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
                  style={{ backgroundColor: '#7BA4D0' }}
                >
                  {deleteConfirming ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Removing…
                    </span>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
