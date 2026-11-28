'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, X, Check, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export default function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const targetEmail = (userEmail || emailInput || '').trim();

  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialOrUpper = /[A-Z!@#$%^&*]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasSpecialOrUpper].filter(Boolean).length;
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  const strengthLabel =
    newPassword.length === 0
      ? ''
      : strengthScore === 3
      ? 'Strong'
      : strengthScore === 2
      ? 'Good'
      : 'Weak';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!targetEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Please enter your new password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (confirmPassword.trim() && confirmPassword.trim() !== newPassword.trim()) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Could not update password. Please verify your current password.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#e6c367', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn overscroll-contain"
      onClick={() => !isSubmitting && onClose()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border-t sm:border border-[var(--border-subtle)] rounded-t-[28px] sm:rounded-[28px] shadow-2xl relative max-h-[90dvh] overflow-y-auto overscroll-contain animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Mobile Native Drag Handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
        </div>

        {/* Sticky Minimal Header */}
        <div className="px-6 pt-4 sm:pt-6 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--gold-accent)] flex items-center justify-center shrink-0">
              <KeyRound className="h-4 w-4" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] leading-tight">
                Update Password
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-light truncate mt-0.5">
                Keep your ÌRÍSÍ account secure
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {successMessage ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7" strokeWidth={1.6} />
              </div>
              <h4 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                Password Updated
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
                Your new password is active immediately across all your devices.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Signed-In Email Strip or Input */}
              {userEmail ? (
                <div className="px-3.5 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                    Account
                  </span>
                  <span className="text-[var(--text-primary)] truncate max-w-[220px]">
                    {userEmail}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors"
                  />
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="w-full h-11 px-3.5 pr-11 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowCurrent((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                    New Password
                  </label>
                  {strengthLabel && (
                    <span
                      className={`text-[10px] font-mono-luxury uppercase tracking-wider ${
                        strengthScore === 3
                          ? 'text-emerald-500'
                          : strengthScore === 2
                          ? 'text-[var(--gold-accent)]'
                          : 'text-rose-500'
                      }`}
                    >
                      {strengthLabel}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="w-full h-11 px-3.5 pr-11 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowNew((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Smooth 3-Segment Strength Meter */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1 rounded-full transition-colors ${
                        newPassword.length > 0 && strengthScore >= step
                          ? strengthScore === 3
                            ? 'bg-emerald-500'
                            : strengthScore === 2
                            ? 'bg-[var(--gold-accent)]'
                            : 'bg-rose-500'
                          : 'bg-[var(--border-subtle)]'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--text-muted)]">
                  <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-emerald-500' : ''}`}>
                    <Check className={`h-3 w-3 ${hasMinLength ? 'opacity-100' : 'opacity-35'}`} />
                    <span>6+ chars</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-emerald-500' : ''}`}>
                    <Check className={`h-3 w-3 ${hasNumber ? 'opacity-100' : 'opacity-35'}`} />
                    <span>Number</span>
                  </span>
                  <span className={`inline-flex items-center gap-1 ${hasSpecialOrUpper ? 'text-emerald-500' : ''}`}>
                    <Check className={`h-3 w-3 ${hasSpecialOrUpper ? 'opacity-100' : 'opacity-35'}`} />
                    <span>Uppercase / Symbol</span>
                  </span>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className={`w-full h-11 px-3.5 pr-11 rounded-2xl bg-[var(--bg-primary)] border text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors ${
                      confirmPassword.length > 0 && !passwordsMatch
                        ? 'border-rose-500/60 focus:border-rose-500'
                        : 'border-[var(--border-subtle)] focus:border-[var(--gold-accent)]'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 px-0.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>Passwords do not match</span>
                  </p>
                )}
              </div>

              {/* Inline Error */}
              {errorMessage && (
                <div className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-1 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-12 px-5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[var(--gold-accent)]" />
                      <span>Save Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="h-safe-area-bottom sm:hidden" />
      </div>
    </div>
  );
}
