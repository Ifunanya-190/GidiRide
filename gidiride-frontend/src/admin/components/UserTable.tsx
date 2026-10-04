import type { User } from '../../types/user';
import { ShieldAlert, ShieldCheck, Eye, AlertTriangle } from 'lucide-react';

interface UserTableProps {
  users: User[];
  subject: 'rider' | 'driver';
  onBan: (user: User) => void;
  onUnban: (user: User) => void;
  onWarn: (user: User) => void;
  onView: (user: User) => void;
  busyUserId?: string;
}

function formatDate(value?: string) {
  if (!value || value === 'null') return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return '—';
  }
}

function presence(value?: string): { label: string; tone: 'online' | 'recent' | 'offline' } {
  if (!value || value === 'null') return { label: 'Never signed in', tone: 'offline' };
  try {
    const minutesAgo = (Date.now() - new Date(value).getTime()) / 60000;
    if (minutesAgo < 10) return { label: 'Online now', tone: 'online' };
    if (minutesAgo < 60 * 24) return { label: 'Active today', tone: 'recent' };
    const daysAgo = Math.round(minutesAgo / (60 * 24));
    return { label: `Offline · ${daysAgo}d ago`, tone: 'offline' };
  } catch {
    return { label: 'Never signed in', tone: 'offline' };
  }
}

export function UserTable({ users, subject, onBan, onUnban, onWarn, onView, busyUserId }: UserTableProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="text-xs uppercase bg-gray-950 text-gray-400 border-b border-gray-800">
          <tr>
            <th className="px-6 py-4 font-bold tracking-wider">Name</th>
            <th className="px-6 py-4 font-bold tracking-wider">Contact</th>
            {subject === 'driver' && <th className="px-6 py-4 font-bold tracking-wider">KYC / Vehicle</th>}
            <th className="px-6 py-4 font-bold tracking-wider">Rides</th>
            <th className="px-6 py-4 font-bold tracking-wider">Status</th>
            <th className="px-6 py-4 font-bold tracking-wider">Presence</th>
            <th className="px-6 py-4 font-bold tracking-wider">Joined</th>
            <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map((user) => {
            const currentPresence = presence(user.lastActiveAt);
            return (
              <tr key={user.id} className={`hover:bg-gray-800/50 transition-colors ${user.banned ? 'bg-red-950/20' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold shrink-0">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <strong className="block text-white font-medium">{user.fullName || 'Unknown'}</strong>
                      <span className="text-xs text-gray-500">{user.rating ? `${user.rating.toFixed(1)} rating` : user.role}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="block text-gray-300">{user.phone || 'No phone'}</span>
                  <span className="block text-xs text-gray-500">{user.email || 'No email'}</span>
                </td>
                {subject === 'driver' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${
                      user.kycStatus === 'APPROVED' ? 'bg-[#00A859]/20 text-[#00A859]' : 
                      user.kycStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 
                      user.kycStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {String(user.kycStatus || 'NOT_SUBMITTED').replace('_', ' ')}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {typeof user.vehicle === 'string'
                        ? user.vehicle
                        : user.vehicle
                        ? `${user.vehicle.make || ''} ${user.vehicle.model || ''} - ${user.vehicle.plateNumber || 'No plate'}`
                        : 'No vehicle'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.totalRides ?? 0}</td>
                <td className="px-6 py-4">
                  {user.banned ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                        <ShieldAlert className="w-3 h-3" /> Banned
                      </span>
                      {user.banReason && <span className="block text-[10px] text-red-400/70 mt-1 truncate max-w-[120px]" title={user.banReason}>{user.banReason}</span>}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#00A859]/20 text-[#00A859]">
                      <ShieldCheck className="w-3 h-3" /> Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      currentPresence.tone === 'online' ? 'bg-[#00A859] shadow-[0_0_8px_#00A859]' : 
                      currentPresence.tone === 'recent' ? 'bg-yellow-500' : 'bg-gray-600'
                    }`} />
                    <span className="text-xs text-gray-400">{currentPresence.label}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      onClick={() => onView(user)}
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {!user.banned && (
                      <button
                        className="p-2 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors disabled:opacity-50"
                        onClick={() => onWarn(user)}
                        disabled={busyUserId === user.id}
                        title="Send warning"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}
                    
                    {user.banned ? (
                      <button
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 text-xs"
                        onClick={() => onUnban(user)}
                        disabled={busyUserId === user.id}
                      >
                        {busyUserId === user.id ? '...' : 'Unban'}
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50 text-xs"
                        onClick={() => onBan(user)}
                        disabled={busyUserId === user.id}
                      >
                        {busyUserId === user.id ? '...' : 'Ban'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {!users.length && (
            <tr>
              <td colSpan={subject === 'driver' ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                No {subject}s match this search yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
