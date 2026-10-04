import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

interface Item { to: string; label: string; icon: IconName }

export function MobileBottomNav({ items, moreItems }: { items: Item[]; moreItems?: Item[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="md:hidden block z-50">
      {/* More Sheet Overlay */}
      {open && moreItems && moreItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl p-4 grid grid-cols-2 gap-2 pb-6 z-[1001]" role="menu" aria-label="More pages">
          {moreItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              onClick={() => setOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-[#00A859]/20 text-[#00A859]' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-950 border-t border-gray-800 flex items-center justify-around px-2 z-[1002]" aria-label="Mobile quick navigation">
        {items.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            end={item.to.endsWith('/rider') || item.to.endsWith('/driver')}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-[#00A859]' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Icon name={item.icon} className="h-6 w-6" />
            <small className="text-[10px] font-medium">{item.label}</small>
          </NavLink>
        ))}
        {moreItems && moreItems.length > 0 && (
          <button 
            type="button" 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${open ? 'text-[#00A859]' : 'text-gray-500 hover:text-gray-300'}`} 
            onClick={() => setOpen((value) => !value)} 
            aria-expanded={open}
          >
            <Icon name="menu" className="h-6 w-6" />
            <small className="text-[10px] font-medium">More</small>
          </button>
        )}
      </nav>
      {/* Safe Area Spacer */}
      <div className="h-16 md:hidden w-full bg-transparent" />
    </div>
  );
}
