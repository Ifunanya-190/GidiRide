import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { getFriendlyError } from '../api/client';
import { notify } from '../shared/components/ToastViewport';
import { useAuth } from './AuthContext';
import { roleHome } from './ProtectedRoute';
import { Logo } from '../components/Logo';

export function LoginPage() {
  const { login, user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Using explicit backend testing credentials
  const [emailOrPhone, setEmailOrPhone] = useState('admin@gidiride.ng');
  const [password, setPassword] = useState('GidiRide@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const banned = searchParams.get('banned') === 'true';
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  if (isAuthenticated && user) return <Navigate to={roleHome(user.role)} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await login({ emailOrPhone, password });
      notify('Welcome back', `Entering ${response.user.role.toLowerCase()} dashboard.`, 'success');
      navigate(from && from !== '/' ? from : roleHome(response.user.role), { replace: true });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex overflow-hidden relative">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#00A859]/10 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#00A859]/5 blur-[120px]"
        />
      </div>

      {/* Left side poster */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10 border-r border-white/10 bg-black/20 backdrop-blur-3xl"
      >
        <Logo size="lg" />
        <div className="max-w-xl">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-extrabold tracking-tight mb-6 leading-tight"
          >
            Move through <span className="text-[#00A859]">Lagos</span> with confidence.
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400 font-light"
          >
            Book premium rides, drive on your own terms, or manage operations from one unified platform.
          </motion.p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-gray-500">
          <span className="bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">Rider Access</span>
          <span className="bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">Driver Portal</span>
          <span className="bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">Admin Control</span>
        </div>
      </motion.div>

      {/* Right side login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md bg-gray-900/40 p-8 rounded-3xl backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50"
        >
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to your GidiRide account</p>
          </div>

          <AnimatePresence>
            {banned && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                Account suspended. Contact support.
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email or Phone</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all placeholder:text-gray-600"
                  placeholder="admin@gidiride.ng"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting || !emailOrPhone || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#00A859] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00A859]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Authenticating...' : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00A859] hover:text-white transition-colors font-semibold">
              Create one now
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
