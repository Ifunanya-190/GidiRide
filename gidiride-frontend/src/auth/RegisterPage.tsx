import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ChevronRight } from 'lucide-react';
import { getFriendlyError } from '../api/client';
import { notify } from '../shared/components/ToastViewport';
import type { Gender, Role } from '../types/user';
import { useAuth } from './AuthContext';
import { roleHome } from './ProtectedRoute';

const roles: { value: Role; label: string; note: string }[] = [
  { value: 'RIDER', label: 'Rider', note: 'Book rides and view trip history.' },
  { value: 'DRIVER', label: 'Driver', note: 'Driver dashboard and KYC flow.' },
  { value: 'ADMIN', label: 'Admin', note: 'Control room access.' }
];

export function RegisterPage() {
  const { register, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('RIDER');
  const [gender, setGender] = useState<Gender>('FEMALE');
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const emailError = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Use a valid email address.' : '';
  const phoneError = phone.length > 0 && phone.replace(/\D/g, '').length < 10 ? 'Use a valid phone number.' : '';
  const passwordError = password.length > 0 && password.length < 6 ? 'Use at least 6 characters.' : '';
  const genderError = role === 'DRIVER' && !gender ? 'Driver gender is required for rider safety preferences.' : '';
  const canSubmit = fullName.trim() && email && phone && password && !emailError && !phoneError && !passwordError && !genderError;

  if (isAuthenticated && user) return <Navigate to={roleHome(user.role)} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await register({ fullName, email, phone, password, role, gender: role === 'DRIVER' ? gender : undefined });
      notify('Account created', `Your ${response.user.role.toLowerCase()} lane is ready.`, 'success');
      navigate(roleHome(response.user.role), { replace: true });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex font-sans text-white relative overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00A859]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#00A859]/10 blur-[100px] pointer-events-none" />

      {/* Left Marketing Side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-16">
            <img src="/logo-final.png" alt="GidiRide" className="h-10 object-contain" />
            <span className="text-2xl font-bold tracking-tight">
              Gidi<span className="text-[#00A859]">Ride</span>
            </span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold mb-6 leading-tight">
              Join the journey.
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Create a secure rider, driver, or operations account with a clean experience built for Lagos. Fast, reliable, and made for the city.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl relative"
        >
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/logo-final.png" alt="GidiRide" className="h-10 object-contain" />
            <span className="text-2xl font-bold tracking-tight">
              Gidi<span className="text-[#00A859]">Ride</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Create profile</h2>
            <p className="text-gray-400">Register for your GidiRide account</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Full name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all outline-none"
                    placeholder="+234..."
                  />
                </div>
                {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
              {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Account lane</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      role === item.value 
                        ? 'border-[#00A859] bg-[#00A859]/10' 
                        : 'border-gray-800 bg-gray-950 hover:border-gray-700'
                    }`}
                  >
                    <span className={`font-bold text-sm ${role === item.value ? 'text-[#00A859]' : 'text-white'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 line-clamp-2">{item.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {role === 'DRIVER' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <label className="text-sm font-medium text-gray-300">Driver gender</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['FEMALE', 'MALE', 'OTHER'] as Gender[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setGender(item)}
                        className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                          gender === item 
                            ? 'border-[#00A859] bg-[#00A859]/10' 
                            : 'border-gray-800 bg-gray-950 hover:border-gray-700'
                        }`}
                      >
                        <span className={`font-bold text-sm ${gender === item ? 'text-[#00A859]' : 'text-white'}`}>
                          {item === 'FEMALE' ? 'Female' : item === 'MALE' ? 'Male' : 'Prefer not to say'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {genderError && <p className="text-red-400 text-xs mt-1">{genderError}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="w-full bg-[#00A859] hover:bg-[#008a4a] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <span>Already have access?</span>
            <Link to="/login" className="text-[#00A859] hover:text-[#008a4a] font-medium inline-flex items-center transition-colors">
              Sign in <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
