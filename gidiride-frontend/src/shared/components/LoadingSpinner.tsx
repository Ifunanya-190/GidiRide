import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4" role="status" aria-live="polite">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-8 h-8 text-[#00A859]" />
      </motion.div>
      <p className="text-gray-400 text-sm font-medium">{label}</p>
    </div>
  );
}
