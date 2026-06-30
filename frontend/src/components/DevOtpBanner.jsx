import React, { useState, useEffect } from 'react';
import { X, Terminal, ShieldAlert } from 'lucide-react';

/**
 * DevOtpBanner
 *
 * A sticky top-of-screen notification panel that glides down whenever the
 * backend returns `status: "VERIFICATION_REQUIRED"` and email delivery is
 * running in stub (no-op) mode.
 *
 * Props:
 *   visible  {boolean}  — controls whether the banner is shown
 *   onClose  {function} — called when the user clicks the × button
 */
const DevOtpBanner = ({ visible, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      // Small delay so the CSS transition animates from the top
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-1/2 z-[9999] w-full max-w-lg -translate-x-1/2 px-4 pt-4 transition-all duration-500 ease-out ${
        mounted ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
      }`}
    >
      <div className="relative rounded-xl border border-indigo-500/40 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-md overflow-hidden">

        {/* Accent top bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-amber-400 to-indigo-500" />

        <div className="flex items-start gap-4 px-5 py-4">
          {/* Icon */}
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30">
            <ShieldAlert size={17} className="text-indigo-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-0.5">
              🔐 Development Mode: Real-world email delivery is disabled.
            </p>
            <p className="text-xs leading-relaxed text-slate-300">
              Please type '999999' into the secure code blocks below to instantly verify your profile.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="ml-2 shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevOtpBanner;
