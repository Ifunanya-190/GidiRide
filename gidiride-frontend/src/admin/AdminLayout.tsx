import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DemoBanner } from '../shared/components/DemoBanner';
import { AdminSidebar } from './components/AdminSidebar';
import { NotificationCenter } from '../shared/components/NotificationCenter';
import { ProfileMenu } from '../shared/components/ProfileMenu';
import { MobileBottomNav } from '../shared/components/MobileBottomNav';

export function AdminLayout() {
  const { user } = useAuth();

  const adminMobileMain = [
    { to: '/admin', label: 'Home', icon: 'home' as const },
    { to: '/admin/users', label: 'Users', icon: 'group' as const },
    { to: '/admin/kyc', label: 'KYC', icon: 'card' as const },
    { to: '/admin/disputes', label: 'Support', icon: 'sos' as const }
  ];

  const adminMobileMore = [
    { to: '/admin/payouts', label: 'Payouts', icon: 'money' as const },
    { to: '/admin/pricing', label: 'Pricing', icon: 'pricing' as const },
    { to: '/admin/analytics', label: 'Analytics', icon: 'analytics' as const }
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex text-white font-sans">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 relative">
        <DemoBanner />
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div>
            <p className="hidden md:block text-xs font-bold text-[#00A859] uppercase tracking-wider mb-1">Control Room</p>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter />
            <ProfileMenu />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-gray-950">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav items={adminMobileMain} moreItems={adminMobileMore} />
    </div>
  );
}
