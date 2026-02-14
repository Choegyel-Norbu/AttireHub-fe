import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import * as addressService from '@/services/addressService';
import {
  getAddressesFromStorage,
  setAddressesInStorage,
} from '@/utils/addressStorage';
import { User, Shield, MapPin, Mail, Phone, Pencil, Map, Loader2 } from 'lucide-react';

function isAdmin(u) {
  return u?.role === 'ADMIN' || u?.role === 'ROLE_ADMIN';
}

function formatDisplayName(user) {
  if (!user) return '';
  const first = user.firstName ?? user.first_name ?? (user.name && user.name.split(' ')[0]) ?? '';
  const last = user.lastName ?? user.last_name ?? (user.name && user.name.split(' ').slice(1).join(' ')) ?? '';
  return [first, last].filter(Boolean).join(' ') || user.email || 'User';
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [addresses, setAddresses] = useState(() => getAddressesFromStorage());
  const [addressLoading, setAddressLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAddressLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) setAddressLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const defaultAddress = addresses.find((a) => a.isDefault ?? a.default) ?? addresses[0];
  const displayName = formatDisplayName(authUser);
  const initials = getInitials(displayName);
  const email = authUser?.email ?? '';
  const phone = authUser?.phoneNumber ?? authUser?.phone_number ?? '—';
  const roleLabel = isAdmin(authUser) ? 'Admin' : 'Customer';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-tertiary bg-quaternary p-6 shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary shadow-sm sm:h-32 sm:w-32 sm:text-4xl">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">{displayName}</h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isAdmin(authUser)
                    ? 'bg-primary/10 text-primary'
                    : 'bg-tertiary/20 text-secondary'
                }`}
              >
                {isAdmin(authUser) ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-secondary">{email}</p>
            
            <div className="mt-6 flex justify-center sm:justify-start">
              <Link
                to="/account/settings"
                className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Intro / About */}
        <div className="rounded-2xl border border-tertiary bg-quaternary p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Intro</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Mail className="h-5 w-5 text-secondary" />
              <span>{email}</span>
            </div>
            <div className="flex items-center gap-3 text-primary">
              <Phone className="h-5 w-5 text-secondary" />
              <span>{phone}</span>
            </div>
            <div className="flex items-center gap-3 text-primary">
              <User className="h-5 w-5 text-secondary" />
              <span>{roleLabel} Account</span>
            </div>
          </div>
          <div className="mt-6 border-t border-tertiary pt-4">
             <Link to="/account/settings" className="block w-full rounded-xl bg-tertiary/10 py-2 text-center text-sm font-semibold text-primary hover:bg-tertiary/20">
               Edit Details
             </Link>
          </div>
        </div>

        {/* Address Preview */}
        <div className="rounded-2xl border border-tertiary bg-quaternary p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Default Address</h2>
          </div>
          
          <div className="mt-4">
            {addressLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-tertiary py-8">
                <Loader2 className="h-6 w-6 animate-spin text-secondary" aria-hidden />
                <span className="text-sm text-secondary">Loading address…</span>
              </div>
            ) : defaultAddress ? (
              <div className="relative overflow-hidden rounded-xl border border-tertiary bg-tertiary/5 p-4">
                <div className="flex gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">
                      {defaultAddress.streetAddress ?? defaultAddress.street_address}
                    </p>
                    <p className="text-sm text-secondary">
                      {[
                        defaultAddress.city,
                        defaultAddress.state,
                        defaultAddress.postalCode ?? defaultAddress.postal_code,
                        defaultAddress.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {(defaultAddress.addressType || defaultAddress.address_type) && (
                      <span className="mt-2 inline-block rounded bg-quaternary px-2 py-1 text-xs font-medium text-secondary shadow-sm">
                        {String(defaultAddress.addressType ?? defaultAddress.address_type)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-tertiary py-8 text-center">
                <Map className="h-8 w-8 text-tertiary" />
                <p className="mt-2 text-sm text-secondary">No address set</p>
                <Link to="/account/settings" className="mt-2 text-sm font-medium text-primary hover:underline">
                  Add address
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
