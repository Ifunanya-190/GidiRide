import { useAuth } from '../../auth/AuthContext';

export function DemoBanner() {
  const { isDemoFallback } = useAuth();
  const shouldShow = import.meta.env.VITE_SHOW_DEMO_BANNER === 'true';

  // Hidden by default so demo/backend state never makes the app feel unprofessional.
  // Turn on only while debugging with VITE_SHOW_DEMO_BANNER=true.
  if (!isDemoFallback || !shouldShow) return null;

  return (
    <div className="demo-banner">
      <strong>Workshop mode:</strong> backend was not reachable, so this screen is using local demo data.
      Admin login: <code>admin@gidiride.ng</code> / <code>GidiRide@123</code>
    </div>
  );
}
