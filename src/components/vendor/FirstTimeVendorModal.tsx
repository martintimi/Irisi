'use client';

import React, { useState } from 'react';
import { Sparkles, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FirstTimeVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorEmail: string;
  vendorId: string;
}

export default function FirstTimeVendorModal({
  isOpen,
  onClose,
  vendorName,
  vendorEmail,
  vendorId,
}: FirstTimeVendorModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/set-vendor-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: vendorEmail,
          newPassword,
          vendorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setIsSuccess(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn flex items-center justify-center p-4">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-zinc-950 border border-[#E6C367]/40 rounded-3xl p-6 sm:p-8 text-left text-white shadow-2xl my-auto shadow-black/80"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-editorial text-2xl font-bold">Password Configured!</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Your password has been saved. You can now log into your store directly with this password anytime.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#E6C367] uppercase">
                VIP Storefront Activated
              </span>
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl font-normal mb-1">
              Welcome, {vendorName || 'Merchant'} 🥂
            </h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Your store is <strong>100% verified and approved</strong>. Set your permanent password below so you can sign in directly anytime.
            </p>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                  Create Permanent Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-[#E6C367]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-[#E6C367]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#E6C367] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#d4af47] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-black" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Password &amp; Open Store</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  I'll do this later &rarr;
                </button>
              </div>

              <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-500 text-center">
                Tip: You can personalize your store logo and banner anytime in your Atelier settings.
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
