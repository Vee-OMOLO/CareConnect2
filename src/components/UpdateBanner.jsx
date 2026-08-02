import { motion, AnimatePresence } from 'framer-motion';

export default function UpdateBanner({ newVersion, onReload }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed left-4 right-4 bottom-24 sm:bottom-6 z-[70]"
        role="status"
        aria-live="polite"
      >
        <div className="card p-3 flex items-center gap-3 shadow-lg bg-surface">
          <div className="w-9 h-9 rounded-lg bg-health-bg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-health text-[18px]">system_update_alt</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface">Update available</p>
            <p className="text-[11px] text-on-surface-variant truncate">v{newVersion} — tap to get the latest fixes</p>
          </div>
          <button
            onClick={onReload}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold card-interactive active:scale-[0.97] flex-shrink-0"
          >
            Reload
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
