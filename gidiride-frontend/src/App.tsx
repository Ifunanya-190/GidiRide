import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/pages/Dashboard';
import { ManageDrivers } from './admin/pages/ManageDrivers';
import { ManageRiders } from './admin/pages/ManageRiders';
import { PlaceholderAdminPage } from './admin/pages/PlaceholderAdminPage';
import { KycReview } from './admin/pages/KycReview';
import { AdminPayouts } from './admin/pages/AdminPayouts';
import { PricingRules } from './admin/pages/PricingRules';
import { Disputes } from './admin/pages/Disputes';
import { Analytics } from './admin/pages/Analytics';
import { LoginPage } from './auth/LoginPage';
import { ProtectedRoute, roleHome } from './auth/ProtectedRoute';
import { RegisterPage } from './auth/RegisterPage';
import { useAuth } from './auth/AuthContext';
import { DriverLayout } from './driver/DriverLayout';
import { DriverHome } from './driver/pages/DriverHome';
import { DriverProfile } from './driver/pages/DriverProfile';
import { RideRequests } from './driver/pages/RideRequests';
import { Earnings } from './driver/pages/Earnings';
import { ActiveTrip } from './driver/pages/ActiveTrip';
import { DriverRideHistory } from './driver/pages/DriverRideHistory';
import { FareBids } from './driver/pages/FareBids';
import { Badges } from './driver/pages/Badges';
import { RiderLayout } from './rider/RiderLayout';
import { RiderHome } from './rider/pages/RiderHome';
import { BookRide } from './rider/pages/BookRide';
import { LiveTracking } from './rider/pages/LiveTracking';
import { RideHistory } from './rider/pages/RideHistory';
import { RiderProfile } from './rider/pages/RiderProfile';
import { Wallet } from './rider/pages/Wallet';
import { Payments } from './rider/pages/Payments';
import { BidFare } from './rider/pages/BidFare';
import { FuelSplit } from './rider/pages/FuelSplit';
import { GroupRides } from './rider/pages/GroupRides';
import { ShareTrip } from './rider/pages/ShareTrip';
import { SplashScreen } from './shared/components/SplashScreen';
import { ToastViewport } from './shared/components/ToastViewport';
import { CommandPalette } from './shared/components/CommandPalette';
import { ReferralsPage } from './shared/components/ReferralsPage';
import { NotificationsPage } from './shared/components/NotificationsPage';

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user) return <Navigate to={roleHome(user.role)} replace />;
  return <Navigate to="/login" replace />;
}

function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center p-8">
      <img src="/logo-final.png" alt="GidiRide" className="h-16 mb-6 object-contain" />
      <p className="text-xs font-bold text-[#00A859] uppercase tracking-widest mb-3">Wrong turning</p>
      <h1 className="text-4xl font-bold text-white mb-3">That road is not open.</h1>
      <p className="text-gray-400">Go back to your proper GidiRide lane.</p>
    </main>
  );
}

export function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('gidiride.splash.seen'));

  useEffect(() => {
    if (!showSplash) return;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('gidiride.splash.seen', 'true');
      setShowSplash(false);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [showSplash]);

  if (showSplash) return <SplashScreen />;

  return (
    <>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="riders" element={<ManageRiders />} />
          <Route path="drivers" element={<ManageDrivers />} />
          <Route path="kyc" element={<KycReview />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="pricing" element={<PricingRules />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverHome />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="requests" element={<RideRequests />} />
          <Route path="bids" element={<FareBids />} />
          <Route path="trip" element={<ActiveTrip />} />
          <Route path="history" element={<DriverRideHistory />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="badges" element={<Badges />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['RIDER']} />}>
        <Route path="/rider" element={<RiderLayout />}>
          <Route index element={<RiderHome />} />
          <Route path="book" element={<BookRide />} />
          <Route path="bid-fare" element={<BidFare />} />
          <Route path="group-rides" element={<GroupRides />} />
          <Route path="fuel-split" element={<FuelSplit />} />
          <Route path="tracking" element={<LiveTracking />} />
          <Route path="share-trip" element={<ShareTrip />} />
          <Route path="history" element={<RideHistory />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<RiderProfile />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    <CommandPalette />
    <ToastViewport />
    </>
  );
}
