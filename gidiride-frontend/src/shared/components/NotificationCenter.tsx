import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiClient } from '../../api/client';
import { Bell, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Notice = {
  id: string;
  title: string;
  body: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
};

function dismissedKey(userId: string) {
  return `gidiride.notifications.dismissed.${userId}`;
}

function readDismissed(userId: string): Set<string> {
  const raw = sessionStorage.getItem(dismissedKey(userId));
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } 
  catch { return new Set(); }
}

function getIcon(tone: string) {
  switch (tone) {
    case 'success': return <CheckCircle2 className="w-5 h-5 text-[#00A859]" />;
    case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'error':
    case 'critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchNotifs() {
      if (!user) return;
      try {
        const response = await apiClient.get<Notice[]>('/notifications');
        setItems(response.data || []);
      } catch (err) {
        // silently fail
      }
    }
    
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    
    fetchNotifs();
    const poll = setInterval(fetchNotifs, 30_000); // refresh every 30s
    window.addEventListener('mousedown', onClick);
    return () => {
      clearInterval(poll);
      window.removeEventListener('mousedown', onClick);
    };
  }, [user]);

  const unread = useMemo(() => items.length, [items]);

  return (
    <div className="relative z-50" ref={ref}>
      <button 
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A859]"
        onClick={() => setOpen((value) => !value)} 
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-gray-900 rounded-full flex items-center justify-center text-[9px] font-black text-white">
            {Math.min(unread, 9)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden origin-top-right flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/50 shrink-0">
              <strong className="text-white font-bold">GidiRide Updates</strong>
              {items.length > 0 && (
                <button 
                  className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                  onClick={() => { 
                    setItems([]); 
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1 min-h-0">
              {items.slice(0, 15).map((item) => {
                const dateVal = item.createdAt ? new Date(item.createdAt) : null;
                const dateStr = dateVal && !isNaN(dateVal.getTime()) 
                  ? new Intl.DateTimeFormat('en-NG', { timeStyle: 'short', dateStyle: 'medium' }).format(dateVal)
                  : 'Just now';

                return (
                  <article key={item.id} className="p-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors flex gap-3 last:border-0">
                    <div className="shrink-0 mt-0.5">
                      {getIcon(item.tone)}
                    </div>
                    <div>
                      <strong className="text-sm text-white font-bold block mb-1">{item.title}</strong>
                      <p className="text-xs text-gray-400 mb-2 leading-relaxed">{item.body}</p>
                      <small className="text-[10px] text-gray-600 font-medium tracking-wider uppercase">{dateStr}</small>
                    </div>
                  </article>
                );
              })}
              
              {!items.length && (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                  <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                  </div>
                  <strong className="text-white font-bold block mb-1">No new updates</strong>
                  <small className="text-xs leading-relaxed max-w-[200px] mx-auto">
                    Ride, safety, referral, and payment events will appear here.
                  </small>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
