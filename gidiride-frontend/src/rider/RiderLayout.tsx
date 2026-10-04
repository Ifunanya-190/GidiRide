import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DemoBanner } from '../shared/components/DemoBanner';
import { NotificationCenter } from '../shared/components/NotificationCenter';
import { ProfileMenu } from '../shared/components/ProfileMenu';
import { MobileBottomNav } from '../shared/components/MobileBottomNav';
import { type IconName } from '../shared/components/Icon';
import { motion } from 'framer-motion';
import { 
  Home, 
  Car, 
  Navigation, 
  Users, 
  Fuel, 
  MapPin, 
  Share2, 
  History, 
  Wallet, 
  CreditCard, 
  User, 
  Gift, 
  Bell, 
  Settings 
} from 'lucide-react';

const riderNav: Array<{ to: string; label: string; icon: any; iconName: IconName }> = [
  { to: '/rider', label: 'Home', icon: Home, iconName: 'home' },
  { to: '/rider/book', label: 'Book Ride', icon: Car, iconName: 'car' },
  { to: '/rider/bid-fare', label: 'Bid Fare', icon: Navigation, iconName: 'pricing' },
  { to: '/rider/group-rides', label: 'Danfo Mode', icon: Users, iconName: 'group' },
  { to: '/rider/fuel-split', label: 'Fuel Split', icon: Fuel, iconName: 'money' },
  { to: '/rider/tracking', label: 'Live Tracking', icon: MapPin, iconName: 'map' },
  { to: '/rider/share-trip', label: 'Share Trip', icon: Share2, iconName: 'sos' },
  { to: '/rider/history', label: 'History', icon: History, iconName: 'history' },
  { to: '/rider/wallet', label: 'Wallet', icon: Wallet, iconName: 'wallet' },
  { to: '/rider/payments', label: 'Payments', icon: CreditCard, iconName: 'card' },
  { to: '/rider/profile', label: 'Profile', icon: User, iconName: 'profile' },
  { to: '/rider/referrals', label: 'Referrals', icon: Gift, iconName: 'gift' },
  { to: '/rider/notifications', label: 'Settings', icon: Settings, iconName: 'settings' }
];

export function RiderLayout() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col">
        <NavLink to="/rider" className="flex items-center gap-3 p-6 pb-2">
          <img src="/logo-final.png" alt="GidiRide" className="h-14 object-contain" />
          <div className="flex flex-col">
            <strong className="text-xl font-bold tracking-tight leading-none">
              Gidi<span className="text-[#00A859]">Ride</span>
            </strong>
            <span className="text-xs text-gray-400 mt-1">Rider Lane</span>
          </div>
        </NavLink>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Rider navigation">
          {riderNav.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.to === '/rider'}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gray-800 text-[#00A859] border-l-4 border-[#00A859] font-medium' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent'
                  }`
                }
              >
                <IconComponent className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-sm"
          >
            <div className="flex items-center gap-2 text-[#00A859] font-semibold mb-2">
              <Share2 className="w-4 h-4" />
              <span>SOS ready</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Share trip, emergency contacts, female driver preference, and audio safety hooks are being prepared for Lagos.
            </p>
          </motion.div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        <DemoBanner />
        
        <header className="flex-shrink-0 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-semibold text-[#00A859] uppercase tracking-wider mb-1">Rider console</p>
            <h1 className="text-2xl font-bold text-white">{user?.fullName || 'Rider'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <ProfileMenu />
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Nav */}
      <MobileBottomNav
        items={[
          { to: '/rider', label: 'Home', icon: 'home' }, 
          { to: '/rider/book', label: 'Book', icon: 'car' }, 
          { to: '/rider/tracking', label: 'Track', icon: 'map' }, 
          { to: '/rider/wallet', label: 'Wallet', icon: 'wallet' }, 
          { to: '/rider/profile', label: 'Me', icon: 'profile' }
        ]}
        moreItems={riderNav
          .filter((item) => !['/rider', '/rider/book', '/rider/tracking', '/rider/wallet', '/rider/profile'].includes(item.to))
          .map(item => ({ to: item.to, label: item.label, icon: item.iconName }))}
      />
    </div>
  );
}
