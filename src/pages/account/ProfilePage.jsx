import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import * as addressService from '@/services/addressService';
import {
  getAddressesFromStorage,
  setAddressesInStorage,
} from '@/utils/addressStorage';
import { User, MapPin, Package, Settings } from 'lucide-react';

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
    window.scrollTo(0, 0);
  }, []);

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
  
  const isAdminUser = isAdmin(authUser);
  const menuItems = [
    {
      icon: Package,
      label: isAdminUser ? 'Customer Orders' : 'Orders',
      to: isAdminUser ? '/admin/orders' : '/account/orders',
      description: isAdminUser
        ? 'View and manage orders placed by customers'
        : 'Track, return, or buy things again',
    },
    { icon: Settings, label: 'Settings', to: '/account/settings', description: 'Edit profile, password, and preferences' },
    // { icon: CreditCard, label: 'Payment Methods', to: '/account/payment', description: 'Manage saved cards' },
  ];

  if (isAdminUser) {
    menuItems.unshift({
      icon: User,
      label: 'Admin Dashboard',
      to: '/admin/products',
      description: 'Manage products and store settings',
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-8"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-serif font-medium text-white shadow-xl sm:h-32 sm:w-32 sm:text-4xl">
          {initials}
        </div>
        
        <div className="mt-6 sm:mt-0">
          <h1 className="font-serif text-3xl text-primary sm:text-4xl">
            Welcome back, {displayName.split(' ')[0]}
          </h1>
          <p className="mt-2 text-secondary/70">{email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link 
              to="/account/settings"
              className="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-gray-50"
            >
              Edit Profile
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('request-logout'))}
              className="rounded-full border border-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link 
              to={item.to}
              className="group flex h-full flex-col rounded-xl border border-border bg-white p-6 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl text-primary">{item.label}</h3>
              <p className="mt-2 text-sm text-secondary/70">{item.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Default Address Preview */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-12 rounded-xl border border-border bg-white p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-primary">Default Address</h2>
          <Link
            to="/account/settings#addresses"
            className="text-sm font-medium text-primary underline underline-offset-4 hover:text-secondary"
          >
            Manage
          </Link>
        </div>
        
        <div className="mt-6">
          {addressLoading ? (
            <div className="h-20 w-full animate-pulse rounded-lg bg-gray-100" />
          ) : defaultAddress ? (
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 text-secondary" />
              <div>
                <p className="font-medium text-primary">
                  {defaultAddress.streetAddress ?? defaultAddress.street_address}
                </p>
                <p className="text-secondary/80">
                  {[
                    defaultAddress.city,
                    defaultAddress.state,
                    defaultAddress.postalCode ?? defaultAddress.postal_code,
                    defaultAddress.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-secondary/60">No default address set.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
