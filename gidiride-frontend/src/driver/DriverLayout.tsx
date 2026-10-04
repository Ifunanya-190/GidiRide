import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DemoBanner } from '../shared/components/DemoBanner';
import { NotificationCenter } from '../shared/components/NotificationCenter';
import { ProfileMenu } from '../shared/components/ProfileMenu';
import { MobileBottomNav } from '../shared/components/MobileBottomNav';
import { motion } from 'framer-motion';
import {
  Home,
  ShieldCheck,
  Car,
  Banknote,
  Navigation,
  History,
  Wallet,
  Award,
  Gift,
  Bell, Settings, } from 'lucide-react';

const driverNav = [
  { to: '/driver', label: 'Home', icon: Home, strIcon: 'home' },
  { to: '/driver/profile', label: 'KYC Profile', icon: ShieldCheck, strIcon: 'shield' },
  { to: '/driver/requests', label: 'Ride Requests', icon: Car, strIcon: 'car' },
  { to: '/driver/bids', label: 'Fare Bids', icon: Banknote, strIcon: 'pricing' },
  { to: '/driver/trip', label: 'Active Trip', icon: Navigation, strIcon: 'navigation' },
  { to: '/driver/history', label: 'History', icon: History, strIcon: 'history' },
  { to: '/driver/earnings', label: 'Earnings', icon: Wallet, strIcon: 'money' },
  { to: '/driver/badges', label: 'Badges', icon: Award, strIcon: 'badge' },
  { to: '/driver/referrals', label: 'Referrals', icon: Gift, strIcon: 'gift' },
  { to: '/driver/notifications', label: 'Settings', icon: Settings, strIcon: 'settings' }
];

export function DriverLayout() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 bg-gray-900 border-r border-gray-800 shrink-0 h-full overflow-y-auto">
        <div className="p-6 sticky top-0 bg-gray-900 z-10">
          <NavLink to="/driver" className="flex items-center gap-3 no-underline">
            <img src="/logo-final.png" alt="GidiRide" className="h-14 w-14 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white">
                Gidi<span className="text-[#00A859]">Ride</span>
              </span>
              <span className="text-xs text-[#00A859] font-semibold uppercase tracking-wider">Driver Lane</span>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1" aria-label="Driver navigation">
          {driverNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.to === '/driver'}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-[#00A859]/10 text-[#00A859] font-bold' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white font-medium'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-5 m-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#00A859]" />
            <h4 className="text-sm font-bold text-white">Separate lane</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Drivers never see admin controls or rider booking pages.
          </p>
        </div>
      </aside>

      {/* Main App Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full relative">
        <DemoBanner />
        
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-20 shrink-0">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Driver Console</p>
            <h1 className="text-2xl font-bold text-white">{user?.fullName || 'Driver'}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <ProfileMenu />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-950 p-4 md:p-6 pb-24 md:pb-6 relative">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileBottomNav
          items={[
            { to: '/driver', label: 'Home', icon: 'home' as any }, 
            { to: '/driver/requests', label: 'Requests', icon: 'car' as any }, 
            { to: '/driver/trip', label: 'Trip', icon: 'navigation' as any }, 
            { to: '/driver/earnings', label: 'Earn', icon: 'money' as any }, 
            { to: '/driver/profile', label: 'Me', icon: 'profile' as any }
          ]}
          moreItems={driverNav
            .filter((item) => !['/driver', '/driver/requests', '/driver/trip', '/driver/earnings', '/driver/profile'].includes(item.to))
            .map(item => ({ to: item.to, label: item.label, icon: item.strIcon as any }))}
        />
      </div>
    </div>
  );
}
