import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { roleHome } from '../../auth/ProtectedRoute';
import { ChevronDown, Home, User as UserIcon, Bell, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  // Safe initials extraction
  const parts = user.fullName ? user.fullName.split(' ').filter(Boolean) : [];
  const initials = parts.length > 0 
    ? parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'U';

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <div className="relative z-50" ref={ref}>
      <button 
        className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A859]"
        onClick={() => setOpen((value) => !value)} 
        aria-expanded={open}
      >
        <div className="w-10 h-10 rounded-full bg-[#00A859]/20 border border-[#00A859]/50 flex items-center justify-center text-[#00A859] font-black shrink-0">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start text-left">
          <strong className="text-white text-sm font-bold truncate max-w-[120px]">{user.fullName}</strong>
          <small className="text-gray-400 text-[10px] uppercase tracking-wider">{user.role.toLowerCase()} lane</small>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''} hidden sm:block`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden origin-top-right"
          >
            <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-gray-950/50">
              <div className="w-12 h-12 rounded-full bg-[#00A859] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-inner">
                {initials}
              </div>
              <div className="min-w-0">
                <strong className="text-white text-sm font-bold block truncate">{user.fullName}</strong>
                <small className="text-gray-400 text-xs block truncate">{user.email || user.phone || 'GidiRide account'}</small>
              </div>
            </div>
            
            <div className="p-2 space-y-1">
              <button 
                onClick={() => go(roleHome(user.role))} 
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors text-left"
              >
                <Home className="w-4 h-4" /> Go to home
              </button>
              
              {user.role === 'RIDER' && (
                <button 
                  onClick={() => go('/rider/profile')} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4" /> Rider profile
                </button>
              )}
              
              {user.role === 'DRIVER' && (
                <button 
                  onClick={() => go('/driver/profile')} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4" /> Driver profile
                </button>
              )}
              
              {user.role !== 'ADMIN' && (
                <button 
                  onClick={() => go(`/${user.role.toLowerCase()}/notifications`)} 
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors text-left"
                >
                  <Bell className="w-4 h-4" /> Notifications
                </button>
              )}
              
              <div className="h-px bg-gray-800 my-1 mx-2" />
              
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
