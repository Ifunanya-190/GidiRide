import { Link } from 'react-router-dom';
import { LagosMap } from '../../shared/components/LagosMap';
import { riderApi } from '../../api/rider';
import { motion } from 'framer-motion';
import { MapPin, Calculator, Shield, Car, Wallet, Navigation } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export function RiderHome() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="flex flex-col justify-center space-y-6">
          <p className="text-[#00A859] font-semibold tracking-wide uppercase">Move through Lagos</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Book clean rides without <br /> mixing lanes.
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Book rides, compare fares, track your driver, and keep safety controls close.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/rider/book" className="bg-[#00A859] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#008a4a] transition-all flex items-center gap-2">
              <Car size={20} />
              Book a ride
            </Link>
            <Link to="/rider/tracking" className="bg-gray-800 text-white border border-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all flex items-center gap-2">
              <Navigation size={20} />
              Track current ride
            </Link>
            <button className="bg-gray-800 text-white border border-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all flex items-center gap-2">
              <Wallet size={20} />
              Wallet
            </button>
          </div>
        </div>
        
        <div className="h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-gray-800 shadow-lg shadow-emerald-900/10 relative z-10">
          <LagosMap pickup={riderApi.locations[0]} dropoff={riderApi.locations[5]} compact />
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8"
      >
        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="h-12 w-12 bg-gray-800 text-[#00A859] rounded-xl flex items-center justify-center mb-4">
            <MapPin size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Lagos quick pins</h3>
          <p className="text-gray-400">Ikeja, Yaba, VI, Lekki, Ajah, airport, and common road points are ready for booking.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="h-12 w-12 bg-gray-800 text-[#00A859] rounded-xl flex items-center justify-center mb-4">
            <Calculator size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Fare estimate</h3>
          <p className="text-gray-400">Bike, Economy, and Premium calculate different base fare, per-km, traffic, and payment fees.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
          <div className="h-12 w-12 bg-gray-800 text-[#00A859] rounded-xl flex items-center justify-center mb-4">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Safety mode</h3>
          <p className="text-gray-400">Female driver preference, SOS, and share-trip toggles are already represented in the rider flow.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
