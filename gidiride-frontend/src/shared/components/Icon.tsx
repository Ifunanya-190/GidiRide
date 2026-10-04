import type { ReactElement } from 'react';

export type IconName =
  | 'dashboard'
  | 'users'
  | 'drivers'
  | 'shield'
  | 'pricing'
  | 'support'
  | 'analytics'
  | 'home'
  | 'car'
  | 'bike'
  | 'map'
  | 'wallet'
  | 'card'
  | 'profile'
  | 'bell'
  | 'search'
  | 'logout'
  | 'chevronDown'
  | 'check'
  | 'x'
  | 'star'
  | 'gift'
  | 'bolt'
  | 'sos'
  | 'qr'
  | 'group'
  | 'history'
  | 'menu'
  | 'document'
  | 'money'
  | 'navigation'
  | 'badge'
  | 'settings'
  | 'plus'
  | 'eye'
  | 'eyeOff';

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

const paths: Record<IconName, ReactElement> = {
  dashboard: <path d="M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z" />,
  users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m19 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  drivers: <path d="M5 17h14l1-5-2.5-5h-11L4 12l1 5Zm2 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 12h12" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-5" />,
  pricing: <path d="M20 12V6a2 2 0 0 0-2-2h-6L4 12l8 8 8-8ZM15 7h.01M9 13l3 3 5-5" />,
  support: <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.3A8.5 8.5 0 0 1 12.5 20H12l-5 2 1.3-4.2A8.5 8.5 0 1 1 21 11.5Z" />,
  analytics: <path d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" />,
  home: <path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9Z" />,
  car: <path d="M3 16V9l2-5h14l2 5v7M5 16h14M7 16v3m10-3v3M6 11h12" />,
  bike: <path d="M5.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM9 14h4l-2-5h4l-2-3m-4 8 3-5" />,
  map: <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6" />,
  wallet: <path d="M3 7h16a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V7Zm0 0V5a2 2 0 0 1 2-2h13m14 10h-5a2 2 0 0 0 0 4h5" />,
  card: <path d="M3 6h18v12H3V6Zm0 4h18M7 15h4" />,
  profile: <path d="M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  bell: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12a2 2 0 0 0 4 0" />,
  search: <path d="m21 21-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />,
  gift: <path d="M20 12v10H4V12m18-5H2v5h20V7ZM12 22V7m0 0H7.5a2.5 2.5 0 1 1 2-4L12 7Zm0 0h4.5a2.5 2.5 0 1 0-2-4L12 7Z" />,
  bolt: <path d="M13 2 3 14h8l-1 8 11-14h-8l1-6Z" />,
  sos: <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  qr: <path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm12 1h2v2h-2v-2Zm4 0h2v6h-6v-2h4v-4Zm-4 4h2v2h-2v-2Z" />,
  group: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m22 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6" />,
  history: <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0 0V3m0 5h5m4-1v6l4 2" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  document: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h6" />,
  money: <path d="M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />,
  navigation: <path d="m3 11 19-9-9 19-2-8-8-2Z" />,
  badge: <path d="M12 3 8.5 9 2 10l4.7 4.6L5.6 21 12 18l6.4 3-1.1-6.4L22 10l-6.5-1L12 3Z" />,
  settings: <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm8-3.5a7.8 7.8 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15.5 3h-7l-.4 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.4 3h7l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  eye: <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  eyeOff: <path d="m3 3 18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M9.9 4.3A10.5 10.5 0 0 1 12 4c6 0 10 8 10 8a18.7 18.7 0 0 1-2.3 3.2M6.6 6.6C3.8 8.5 2 12 2 12s4 8 10 8a10.8 10.8 0 0 0 5.4-1.6" />
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
