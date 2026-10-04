import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CarFront,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  MessageSquareWarning,
  BarChart3
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', badge: '01', icon: LayoutDashboard },
  { to: '/admin/riders', label: 'Riders', badge: '02', icon: Users },
  { to: '/admin/drivers', label: 'Drivers', badge: '03', icon: CarFront },
  { to: '/admin/kyc', label: 'KYC', badge: '04', icon: ShieldCheck },
  { to: '/admin/payouts', label: 'Payouts', badge: '05', icon: CreditCard },
  { to: '/admin/pricing', label: 'Pricing', badge: '06', icon: TrendingUp },
  { to: '/admin/disputes', label: 'Disputes', badge: '07', icon: MessageSquareWarning },
  { to: '/admin/analytics', label: 'Analytics', badge: '08', icon: BarChart3 }
];

export function AdminSidebar() {
  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <NavLink to="/admin" className="flex items-center gap-3" aria-label="GidiRide admin dashboard">
            <img src="/logo-final.png" alt="GidiRide" className="h-14 object-contain" />
            <div className="flex flex-col">
              <strong className="text-xl font-bold text-white tracking-tight">
                Gidi<span className="text-[#00A859]">Ride</span>
              </strong>
              <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Admin Control</span>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium ${
                    isActive
                      ? 'bg-[#00A859] text-white shadow-lg shadow-[#00A859]/20'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] uppercase tracking-wider opacity-50 shrink-0">{item.badge}</span>
                <span className="flex-1 truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6 m-4 bg-gray-950 rounded-2xl border border-gray-800 shrink-0">
          <span className="text-xs font-bold text-[#00A859] uppercase tracking-wider block mb-2">Safety first</span>
          <p className="text-xs text-gray-400 leading-relaxed">
            Bad reviews, fraud signals, or danger reports can trigger ban actions here.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-50 flex items-center justify-around px-2 pb-safe pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 min-w-[64px] rounded-xl transition-all ${
                  isActive
                    ? 'text-[#00A859]'
                    : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-bold tracking-wider truncate max-w-full">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
