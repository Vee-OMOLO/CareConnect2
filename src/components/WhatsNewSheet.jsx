import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_VERSION, CHANGELOG } from '../config/appVersion';
import { markVersionSeen } from '../utils/updateManager';

export default function WhatsNewSheet({ onClose }) {
  const [leaving, setLeaving] = useState(false);
  const changes = CHANGELOG[APP_VERSION] || [];

  function dismiss() {
    markVersionSeen();
    setLeaving(true);
    setTimeout(onClose, 200);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="What's New">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: leaving ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40"
          onClick={dismiss}
        />
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: leaving ? 0 : 1, y: leaving ? 60 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[22px]">new_releases</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">What&apos;s New</h2>
              <p className="text-xs text-on-surface-variant">CareConnect v{APP_VERSION}</p>
            </div>
          </div>

          {/* Changelog */}
          <div className="flex flex-col gap-3 mb-6">
            {changes.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Got it */}
          <button
            onClick={dismiss}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-base card-interactive active:scale-[0.98]"
          >
            Got it
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
