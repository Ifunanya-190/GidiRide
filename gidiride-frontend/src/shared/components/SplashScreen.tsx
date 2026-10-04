import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-[9999]" aria-label="GidiRide loading">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00A859]/10 blur-[100px]"
        />
      </div>

      {/* Just the logo, large and centered */}
      <div className="relative flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <motion.img
            src="/logo-final.png"
            alt="GidiRide"
            className="h-48 w-auto object-contain"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-gray-400 text-sm font-medium tracking-widest uppercase mt-4"
          >
            Connecting Nigeria. Moving Forward.
          </motion.p>
        </div>

        {/* Minimal progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-40 h-0.5 bg-gray-800 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-[#00A859] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
